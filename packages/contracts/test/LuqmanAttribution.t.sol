// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {LuqmanAttribution} from "../src/LuqmanAttribution.sol";
import {Reentrant} from "./mocks/Reentrant.sol";

/**
 * Test suite for LuqmanAttribution. Written against the SPEC in the contract
 * NatSpec — all cases will fail until LEARN #3 is implemented. Run with
 * `forge test -vv`.
 */
contract LuqmanAttributionTest is Test {
    LuqmanAttribution internal luqman;

    address internal owner = address(this);
    address internal treasury = address(0xBEEF);
    address internal researcher = address(0xA11CE);
    address internal attacker = address(0xBAD);
    address internal agent = address(0xA6E47);

    bytes32 internal constant CHUNK_ID = bytes32("chunk-001");
    bytes32 internal constant RESEARCHER_ID = bytes32("researcher-asma");

    event ResearcherRegistered(address indexed researcher, bytes32 indexed researcherId);
    event RetrievalRecorded(
        bytes32 indexed chunkId,
        address indexed researcher,
        uint256 amountResearcher,
        uint256 amountPlatform,
        uint256 timestamp
    );

    function setUp() public {
        luqman = new LuqmanAttribution(treasury);
        vm.deal(agent, 10 ether);
    }

    // ─── registerResearcher ────────────────────────────────────────────────

    function test_RegisterResearcher_UpdatesMapping() public {
        luqman.registerResearcher(researcher, RESEARCHER_ID);
        assertTrue(luqman.isRegisteredResearcher(researcher));
        assertEq(luqman.researcherIdOf(researcher), RESEARCHER_ID);
    }

    function test_RegisterResearcher_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit ResearcherRegistered(researcher, RESEARCHER_ID);
        luqman.registerResearcher(researcher, RESEARCHER_ID);
    }

    function test_RegisterResearcher_RevertsWhenNotOwner() public {
        vm.prank(attacker);
        vm.expectRevert();
        luqman.registerResearcher(researcher, RESEARCHER_ID);
    }

    // ─── recordRetrieval ───────────────────────────────────────────────────

    function test_RecordRetrieval_RevertsForUnregisteredResearcher() public {
        vm.prank(agent);
        vm.expectRevert(
            abi.encodeWithSelector(LuqmanAttribution.ResearcherNotRegistered.selector, researcher)
        );
        luqman.recordRetrieval{value: 0.008 ether}(CHUNK_ID, researcher);
    }

    function test_RecordRetrieval_RevertsOnZeroPayment() public {
        luqman.registerResearcher(researcher, RESEARCHER_ID);
        vm.prank(agent);
        vm.expectRevert(LuqmanAttribution.ZeroPayment.selector);
        luqman.recordRetrieval{value: 0}(CHUNK_ID, researcher);
    }

    function test_RecordRetrieval_Splits85_15_Correctly() public {
        luqman.registerResearcher(researcher, RESEARCHER_ID);

        uint256 payment = 0.008 ether; // mimic $0.008 in 18-dec native units
        uint256 expectedResearcher = (payment * 8500) / 10000;
        uint256 expectedPlatform = payment - expectedResearcher;

        uint256 beforeR = researcher.balance;
        uint256 beforeT = treasury.balance;

        vm.prank(agent);
        luqman.recordRetrieval{value: payment}(CHUNK_ID, researcher);

        assertEq(researcher.balance - beforeR, expectedResearcher);
        assertEq(treasury.balance - beforeT, expectedPlatform);
    }

    function test_RecordRetrieval_SplitWithRoundingCrumb() public {
        // Pick a value that doesn't divide evenly. 7 wei * 8500 / 10000 = 5.95
        // → 5 to researcher, 2 to treasury (crumb goes to platform by design).
        luqman.registerResearcher(researcher, RESEARCHER_ID);
        vm.prank(agent);
        luqman.recordRetrieval{value: 7}(CHUNK_ID, researcher);
        assertEq(researcher.balance, 5);
        assertEq(treasury.balance, 2);
    }

    function test_RecordRetrieval_EmitsRetrievalRecordedEvent() public {
        luqman.registerResearcher(researcher, RESEARCHER_ID);
        uint256 payment = 1 ether;
        uint256 expectedR = (payment * 8500) / 10000;
        uint256 expectedP = payment - expectedR;

        vm.expectEmit(true, true, false, true);
        emit RetrievalRecorded(CHUNK_ID, researcher, expectedR, expectedP, block.timestamp);

        vm.prank(agent);
        luqman.recordRetrieval{value: payment}(CHUNK_ID, researcher);
    }

    function test_RecordRetrieval_BlocksReentrancy() public {
        Reentrant evil = new Reentrant(luqman, CHUNK_ID);
        luqman.registerResearcher(address(evil), bytes32("researcher-evil"));
        vm.deal(agent, 1 ether);

        vm.prank(agent);
        // The outer call itself reverts because the forwarded .call returns
        // false (the reentrant attempt inside the Reentrant.receive() is
        // blocked by nonReentrant, which bubbles up as a failed transfer).
        vm.expectRevert();
        luqman.recordRetrieval{value: 0.01 ether}(CHUNK_ID, address(evil));
    }

    function test_OnlyOwner_CanRegister() public {
        vm.prank(address(0xABCD));
        vm.expectRevert();
        luqman.registerResearcher(researcher, RESEARCHER_ID);
    }

    function test_TreasuryReceives15Percent_OverManyRetrievals() public {
        luqman.registerResearcher(researcher, RESEARCHER_ID);
        uint256 perCall = 0.008 ether;
        uint256 n = 10;
        for (uint256 i = 0; i < n; i++) {
            vm.prank(agent);
            luqman.recordRetrieval{value: perCall}(
                keccak256(abi.encode("chunk", i)),
                researcher
            );
        }
        uint256 totalGmv = perCall * n;
        uint256 expectedTreasury = (totalGmv * 1500) / 10000;
        assertEq(treasury.balance, expectedTreasury);
    }

    function test_SetPlatformTreasury_OnlyOwner() public {
        address newTreasury = address(0xCAFE);
        luqman.setPlatformTreasury(newTreasury);
        assertEq(luqman.platformTreasury(), newTreasury);

        vm.prank(attacker);
        vm.expectRevert();
        luqman.setPlatformTreasury(attacker);
    }
}
