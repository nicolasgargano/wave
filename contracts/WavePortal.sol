// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract WavePortal {
    mapping(address => uint) public wavesByAddress;
    mapping(address => uint) public lastWavedAt;
    uint totalWaves;

    event NewWave(address indexed from, uint timestamp, string message);

    struct Wave {
        address waver;
        string message;
        uint timestamp;
    }

    Wave[] waves;

    uint accumulatedGas;

    constructor() payable {
        console.log("Yo yo, I am a contract and I am smart");
    }

    function wave(string memory _message) public {
        // Cooldown
        require(lastWavedAt[msg.sender] + 1 minutes < block.timestamp, "You can only wave once every 15 minutes!");
        lastWavedAt[msg.sender] = block.timestamp;

        // Count waves
        wavesByAddress[msg.sender] = wavesByAddress[msg.sender] + 1;
        totalWaves = totalWaves + 1;
        console.log("%s waved with message %s", msg.sender, _message);

        // Prize
        uint prizeAmount = 0.0001 ether;
        require(prizeAmount <= address(this).balance, "Trying to withdraw more ether than the contract has.");
        (bool success,) = (msg.sender).call{value: prizeAmount}("");
        require(success, "Failed to withdraw money from contract.");

        // Tally gas
        accumulatedGas = accumulatedGas + tx.gasprice;

        // Add wave
        waves.push(Wave(msg.sender, _message, block.timestamp));
        emit NewWave(msg.sender, block.timestamp, _message);
    }

    function getAllWaves() view public returns (Wave[] memory) {
        return waves;
    }

    function getTotalWaves() view public returns (uint) {
        console.log("Total of %d waves", totalWaves);
        return totalWaves;
    }
}
