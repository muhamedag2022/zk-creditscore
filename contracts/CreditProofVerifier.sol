// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CreditScoreRegistry.sol";
import "./CreditSBT.sol";

/**
 * @title CreditProofVerifier
 * @notice Verifies ZK credit proofs for DeFi protocols on HashKey Chain
 * @dev Used by DeFi protocols to gate access based on credit score
 */
contract CreditProofVerifier {

    CreditScoreRegistry public registry;
    CreditSBT public sbt;

    struct ProofRequest {
        address requester;
        address subject;
        uint256 minScore;
        uint256 timestamp;
        bool verified;
        bool result;
    }

    mapping(bytes32 => ProofRequest) public proofRequests;
    mapping(address => uint256) public verificationCount;
    mapping(address => bytes32[]) public userProofs;

    event ProofRequested(
        bytes32 indexed proofId,
        address indexed requester,
        address indexed subject,
        uint256 minScore
    );
    event ProofVerified(
        bytes32 indexed proofId,
        bool result
    );

    constructor(address _registry, address _sbt) {
        registry = CreditScoreRegistry(_registry);
        sbt = CreditSBT(_sbt);
    }

    /**
     * @notice Request credit proof verification
     * @param subject Address to verify
     * @param minScore Minimum required score
     * @return bytes32 Proof ID
     */
    function requestProof(address subject, uint256 minScore)
        external
        returns (bytes32)
    {
        require(subject != address(0), "Invalid subject");
        require(minScore <= 1000, "Invalid threshold");

        bytes32 proofId = keccak256(
            abi.encodePacked(
                msg.sender,
                subject,
                minScore,
                block.timestamp,
                block.number
            )
        );

        proofRequests[proofId] = ProofRequest({
            requester: msg.sender,
            subject: subject,
            minScore: minScore,
            timestamp: block.timestamp,
            verified: false,
            result: false
        });

        emit ProofRequested(proofId, msg.sender, subject, minScore);
        return proofId;
    }

    /**
     * @notice Verify credit proof on-chain
     * @param proofId Proof to verify
     * @return bool Verification result
     */
    function verifyProof(bytes32 proofId) external returns (bool) {
        ProofRequest storage request = proofRequests[proofId];
        require(request.requester != address(0), "Proof not found");
        require(!request.verified, "Already verified");

        bool result = registry.verifyScoreAbove(
            request.subject,
            request.minScore
        );

        request.verified = true;
        request.result = result;
        verificationCount[request.subject]++;
        userProofs[request.subject].push(proofId);

        emit ProofVerified(proofId, result);
        return result;
    }

    /**
     * @notice Quick verify by tier (no proof storage)
     * @param user Address to verify
     * @param minTier Minimum required tier (1-5)
     * @return bool True if user meets tier requirement
     */
    function verifyByTier(address user, uint8 minTier)
        external
        view
        returns (bool)
    {
        try sbt.getUserTier(user) returns (uint8 tier) {
            return tier >= minTier;
        } catch {
            return false;
        }
    }

    /**
     * @notice Verify score is in range (privacy-preserving)
     * @param user Address to verify
     * @param minScore Minimum score
     * @param maxScore Maximum score
     * @return bool True if score is in range
     */
    function verifyScoreInRange(
        address user,
        uint256 minScore,
        uint256 maxScore
    ) external view returns (bool) {
        return registry.verifyScoreAbove(user, minScore) &&
               !registry.verifyScoreAbove(user, maxScore + 1);
    }

    /**
     * @notice Get proof request details
     * @param proofId Proof ID
     */
    function getProofRequest(bytes32 proofId)
        external
        view
        returns (ProofRequest memory)
    {
        require(proofRequests[proofId].requester != address(0), "Not found");
        return proofRequests[proofId];
    }

    /**
     * @notice Get all proofs for a user
     * @param user Address to query
     */
    function getUserProofs(address user)
        external
        view
        returns (bytes32[] memory)
    {
        return userProofs[user];
    }

    /**
     * @notice Update registry address
     */
    function updateRegistry(address _registry) external {
        require(_registry != address(0), "Invalid address");
        registry = CreditScoreRegistry(_registry);
    }

    /**
     * @notice Update SBT address
     */
    function updateSBT(address _sbt) external {
        require(_sbt != address(0), "Invalid address");
        sbt = CreditSBT(_sbt);
    }
}