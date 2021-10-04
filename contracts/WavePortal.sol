// SPDX-License-Identifier: BSD-3-Clause

pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract WavePortal {

    struct Wave {
        address waver;
        string message;
        uint timestamp;
    }

    Wave[] waves;
    uint totalWaves;

    event NewWave(address indexed from, uint timestamp, string message);

    mapping(address => Wave[]) public wavesByAddress;
    mapping(address => uint) public lastWavedAt;

    uint accumulatedGas;

    constructor() payable {
        console.log("Yo yo, I am a contract and I am smart");
    }

    function wave(string memory _message) public {
        uint256 initialGas = gasleft();

        // Cooldown
        require(lastWavedAt[msg.sender] + 15 seconds < block.timestamp, "You can only wave once every 15 seconds!");
        lastWavedAt[msg.sender] = block.timestamp;

        // Count waves
        totalWaves = totalWaves + 1;
        console.log("%s waved with message %s", msg.sender, _message);

        // Prize
        uint prizeAmount = 0.00001 ether;
        require(prizeAmount <= address(this).balance, "Trying to withdraw more ether than the contract has.");
        (bool success,) = (msg.sender).call{value: prizeAmount}("");
        require(success, "Failed to withdraw money from contract.");

        // Add wave
        waves.push(Wave(msg.sender, _message, block.timestamp));
        wavesByAddress[msg.sender].push(Wave(msg.sender, _message, block.timestamp));
        emit NewWave(msg.sender, block.timestamp, _message);

        // Tally gas
        accumulatedGas = accumulatedGas + (initialGas - gasleft());
    }

    function getAllWaves() view public returns (Wave[] memory) {
        return waves;
    }

    function getTotalWaves() view public returns (uint) {
        console.log("Total of %d waves", totalWaves);
        return totalWaves;
    }

    function getAccumulatedGas() view public returns (uint) {
        console.log("Accumulated gas", accumulatedGas);
        return accumulatedGas;
    }

    function getWavesFromAddress(address _address) view public returns (Wave[] memory) {
        return wavesByAddress[_address];
    }
}
