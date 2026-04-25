// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LuqmanAttribution} from "../../src/LuqmanAttribution.sol";

/**
 * Malicious receiver used to prove {LuqmanAttribution.recordRetrieval} cannot
 * be re-entered. On receiving value, it attempts to call recordRetrieval
 * again on the same contract. {ReentrancyGuard} should revert the inner call.
 */
contract Reentrant {
    LuqmanAttribution public target;
    bytes32 public chunkId;
    bool public attacked;

    constructor(LuqmanAttribution _target, bytes32 _chunkId) {
        target = _target;
        chunkId = _chunkId;
    }

    // Called when the target contract forwards USDC to us. We re-enter.
    receive() external payable {
        if (!attacked) {
            attacked = true;
            // Attempt to re-enter the exact same function we're mid-execution of.
            target.recordRetrieval{value: address(this).balance}(chunkId, address(this));
        }
    }
}
