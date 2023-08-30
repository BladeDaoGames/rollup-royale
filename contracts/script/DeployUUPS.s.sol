// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.12;

import "forge-std/console.sol";
import "forge-std/Script.sol";

import "../src/UUPSProxy.sol";
import "../src/RRoyale.sol";

contract DeployUUPS is Script {
    UUPSProxy proxy;
    RRoyale wrappedProxyV1;

    function run() public {
        //vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        RRoyale implementationV1 = new RRoyale();
        console.log("implementation is: ");
        console.log(address(implementationV1));
        // deploy proxy contract and point it to implementation
        proxy = new UUPSProxy(address(implementationV1), "");
        console.log("proxy is: ");
        console.log(address(proxy));
        
        // wrap in ABI to support easier calls
        wrappedProxyV1 = RRoyale(address(proxy));
        wrappedProxyV1.initialize(msg.sender);
        console.log("message sender is: ");
        console.log(msg.sender);
        //vm.stopBroadcast();

        // new implementation
        // RRoyaleV2 implementationV2 = new RRoyaleV2();
        // wrappedProxyV1.upgradeTo(address(implementationV2));
        
        // wrappedProxyV2 = RRoyaleV2(address(proxy));
        // wrappedProxyV2.setY(200);

        // console.log(wrappedProxyV2.x(), wrappedProxyV2.y());
    }

}