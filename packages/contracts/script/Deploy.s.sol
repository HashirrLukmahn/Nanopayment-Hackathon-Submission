// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {LuqmanAttribution} from "../src/LuqmanAttribution.sol";

/**
 * Deploy LuqmanAttribution to the configured network.
 *
 * Usage:
 *   export LUQMAN_TREASURY_ADDRESS=0x...
 *   forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast --private-key $PRIVATE_KEY -vvvv
 */
contract Deploy is Script {
    function run() external returns (LuqmanAttribution) {
        address treasury = vm.envAddress("LUQMAN_TREASURY_ADDRESS");
        require(treasury != address(0), "LUQMAN_TREASURY_ADDRESS not set");

        vm.startBroadcast();
        LuqmanAttribution luqman = new LuqmanAttribution(treasury);
        vm.stopBroadcast();

        console2.log("LuqmanAttribution deployed at:", address(luqman));
        console2.log("Platform treasury:", treasury);
        return luqman;
    }
}
