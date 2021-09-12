// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract WavePortal {
    mapping(address => uint) public waves;
    uint totalWaves;

    uint accumulatedGas;

    constructor() {
        console.log("Yo yo, I am a contract and I am smart");
    }

    function wave() public {
        waves[msg.sender] = waves[msg.sender] + 1;
        totalWaves = totalWaves + 1;
        console.log("%s waved!", msg.sender);
        accumulatedGas = accumulatedGas + tx.gasprice;
    }

    function getTotalWaves() view public returns (uint) {
        console.log("Total of %d waves", totalWaves);
        return totalWaves;
    }
}
