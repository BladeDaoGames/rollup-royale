// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Royale.sol";

contract RoyaleScript is Script {
    function setUp() public {}

    function run() public {
        vm.broadcast();
        address _deployer = address(bytes20(bytes(vm.envString("TESTER1"))));
        Royale game1 = new Royale(_deployer);
        vm.stopBroadcast();
    }
}
