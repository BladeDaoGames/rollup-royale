// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.12;

import "forge-std/console.sol";
import "forge-std/Script.sol";

import "../src/UUPSProxy.sol";
import "../src/RRoyale.sol";
import "../src/RRoyaleV2.sol";

contract UpgradeUUPS is Script {
    RRoyale wrappedProxyV1;
    //RRoyaleV2 implementationV2;

    function run() public {
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        
        // new implementation
        RRoyaleV2 implementationV2 = new RRoyaleV2();
        console.log("new implementation is: ");
        console.log(address(implementationV2));

        // // wrap in ABI to support easier calls
        // proxy = UUPSProxy(address(0x94F4c7000F9CC4a3cA5d8391E8B7a56E7751A552));
        wrappedProxyV1 = RRoyale(address(0x628659473A706CdA9E278744D5ff218D58534338)); //proxy address
        wrappedProxyV1.upgradeToAndCall(address(implementationV2), "");
        console.log("proxy is still: ");
        console.log(address(wrappedProxyV1));

        console.log("message sender is: ");
        console.log(msg.sender);
        vm.stopBroadcast();

        
        
        // wrappedProxyV2 = RRoyaleV2(address(proxy));
        // wrappedProxyV2.setY(200);

        // console.log(wrappedProxyV2.x(), wrappedProxyV2.y());
    }

}