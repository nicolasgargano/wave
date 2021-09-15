// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract WavePortal {
    mapping(address => uint) public wavesByAddress;
    uint totalWaves;

    event NewWave(address indexed from, uint timestamp, string message);

    struct Wave {
        address waver;
        string message;
        uint timestamp;
    }

    Wave[] waves;

    uint accumulatedGas;

    constructor() {
        console.log("Yo yo, I am a contract and I am smart");
    }

    function wave(string memory _message) public {
        wavesByAddress[msg.sender] = wavesByAddress[msg.sender] + 1;
        totalWaves = totalWaves + 1;
        console.log("%s waved with message %s", msg.sender, _message);

        waves.push(Wave(msg.sender, _message, block.timestamp));
        emit NewWave(msg.sender, block.timestamp, _message);

        accumulatedGas = accumulatedGas + tx.gasprice;
    }

    function getAllWaves() view public returns (Wave[] memory) {
        return waves;
    }

    function getTotalWaves() view public returns (uint) {
        console.log("Total of %d waves", totalWaves);
        return totalWaves;
    }
}
