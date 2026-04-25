// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LuqmanAttribution
 * @notice Records chunk-level attribution for Luqman retrievals and splits the
 *         incoming USDC payment 85/15 between the researcher and the platform
 *         treasury in the same transaction.
 *
 * Design notes
 * ─────────────
 *  - Assumes USDC is the native gas token on Arc, so `msg.value` IS the USDC
 *    amount. If/when Arc switches to ERC-20 USDC this contract takes a
 *    one-line change (replace `msg.value` with a `transferFrom`).
 *  - Emits one {RetrievalRecorded} event per retrieval — the frontend
 *    PaymentStream component indexes these for the live demo feed.
 *  - Uses Checks-Effects-Interactions AND {ReentrancyGuard}. Belt and braces;
 *    any contract that forwards funds to two recipients in one tx is a
 *    reentrancy target.
 *
 * LEARN #3 CHECKLIST (see CLAUDE_CODE_SPEC.md)
 * ────────────────────────────────────────────
 *  1. registerResearcher: only owner, mark researcher as registered, emit.
 *  2. recordRetrieval: require registered researcher, compute 85/15 split,
 *     forward to researcher + treasury using .call{value: ...}(""), revert
 *     on failure, emit RetrievalRecorded.
 *  3. Follow Checks-Effects-Interactions. Do not violate with a raw .transfer.
 *  4. Make the tests in test/LuqmanAttribution.t.sol pass.
 */
contract LuqmanAttribution is Ownable, ReentrancyGuard {
    // ─── Events ────────────────────────────────────────────────────────────
    event ResearcherRegistered(address indexed researcher, bytes32 indexed researcherId);
    event RetrievalRecorded(
        bytes32 indexed chunkId,
        address indexed researcher,
        uint256 amountResearcher,
        uint256 amountPlatform,
        uint256 timestamp
    );
    event PlatformTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ─── Errors ────────────────────────────────────────────────────────────
    error ResearcherNotRegistered(address researcher);
    error ZeroPayment();
    error TransferFailed(address to, uint256 amount);
    error InvalidTreasury();
    error LearnNotImplemented(); // stub marker — remove after LEARN #3

    // ─── Storage ───────────────────────────────────────────────────────────
    address public platformTreasury;
    mapping(address => bool) public isRegisteredResearcher;
    mapping(address => bytes32) public researcherIdOf;

    // ─── Constants ─────────────────────────────────────────────────────────
    uint256 public constant RESEARCHER_BPS = 8500; // 85.00%
    uint256 public constant PLATFORM_BPS = 1500;   // 15.00%
    uint256 public constant BPS_DENOM = 10000;

    constructor(address _platformTreasury) Ownable(msg.sender) {
        if (_platformTreasury == address(0)) revert InvalidTreasury();
        platformTreasury = _platformTreasury;
    }

    /**
     * @notice Update the platform treasury. Only callable by owner.
     */
    function setPlatformTreasury(address _newTreasury) external onlyOwner {
        if (_newTreasury == address(0)) revert InvalidTreasury();
        address old = platformTreasury;
        platformTreasury = _newTreasury;
        emit PlatformTreasuryUpdated(old, _newTreasury);
    }

    /**
     * @notice Register a researcher so they can receive payouts.
     * @dev TODO: LEARN #3 — Hashirr to implement.
     *      Required behaviour:
     *        - set isRegisteredResearcher[researcher] = true
     *        - set researcherIdOf[researcher] = researcherId
     *        - emit ResearcherRegistered(researcher, researcherId)
     */
    function registerResearcher(address researcher, bytes32 researcherId) external onlyOwner {
        // TODO: LEARN #3 — Hashirr to implement. See CLAUDE_CODE_SPEC.md.
        revert LearnNotImplemented();
    }

    /**
     * @notice Record a retrieval and split the incoming USDC 85/15.
     * @dev TODO: LEARN #3 — Hashirr to implement.
     *      Required behaviour:
     *        - revert if msg.value == 0 (ZeroPayment)
     *        - revert if !isRegisteredResearcher[researcher] (ResearcherNotRegistered)
     *        - amountResearcher = msg.value * RESEARCHER_BPS / BPS_DENOM
     *        - amountPlatform = msg.value - amountResearcher  (so rounding crumb → platform)
     *        - effects: emit RetrievalRecorded(...)
     *        - interactions: forward via .call{value: ...}(""); revert on failure
     *      Pattern: Checks → Effects → Interactions. Reentrancy-guarded via modifier.
     */
    function recordRetrieval(bytes32 chunkId, address researcher)
        external
        payable
        nonReentrant
    {
        // TODO: LEARN #3 — Hashirr to implement. See CLAUDE_CODE_SPEC.md.
        // NOTE: msg.value is the USDC amount since USDC is native gas on Arc.
        revert LearnNotImplemented();
    }

    /**
     * @notice Convenience batch function — record N retrievals in one tx.
     *         Saves gas when Gemini returns many chunks in one agent call.
     * @dev Intentionally left as a forward to recordRetrieval so the LEARN
     *      exercise only has to get one function right. Gas savings come from
     *      amortising the base tx cost, not storage reads.
     *
     *      This function does not guard against duplicate chunkIds — the
     *      business layer is expected to dedupe. Add your own guards if you
     *      extend this after LEARN #3.
     */
    function recordRetrievalBatch(
        bytes32[] calldata chunkIds,
        address[] calldata researchersToPay,
        uint256[] calldata amounts
    ) external payable nonReentrant {
        uint256 n = chunkIds.length;
        require(researchersToPay.length == n && amounts.length == n, "length mismatch");
        uint256 totalSent;
        for (uint256 i = 0; i < n; i++) {
            totalSent += amounts[i];
        }
        require(totalSent == msg.value, "value mismatch");
        // Delegate to recordRetrieval for each entry. Skipped until LEARN #3 done.
        revert LearnNotImplemented();
    }

    receive() external payable {
        // Accept stray sends so treasury top-ups don't brick. Not part of LEARN.
    }
}
