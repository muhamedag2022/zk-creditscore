// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreditScoreRegistry
 * @notice ZK-CreditScore Registry on HashKey Chain
 * @dev Privacy-preserving credit scoring for DeFi
 */
contract CreditScoreRegistry is Ownable, ReentrancyGuard {

    struct CreditProfile {
        uint256 score;
        uint256 lastUpdated;
        bytes32 dataCommitment;
        uint8 tier;
        bool isActive;
        uint256 totalAnalyses;
    }

    struct ScoreFactors {
        uint256 balanceScore;
        uint256 activityScore;
        uint256 consistencyScore;
        uint256 diversityScore;
        uint256 riskScore;
    }

    mapping(address => CreditProfile) public profiles;
    mapping(address => ScoreFactors) private scoreFactors;
    mapping(address => bool) public authorizedAnalyzers;

    uint256 public constant MAX_SCORE = 1000;
    uint256 public totalProfiles;
    uint256 public totalAnalyses;

    event ProfileCreated(address indexed user, uint256 score, uint8 tier);
    event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore);
    event ProofGenerated(address indexed user, bytes32 proofHash);
    event AnalyzerAuthorized(address indexed analyzer);

    modifier onlyAuthorized() {
        require(
            authorizedAnalyzers[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedAnalyzers[msg.sender] = true;
    }

    function updateCreditProfile(
        address user,
        uint256 score,
        bytes32 commitment,
        ScoreFactors memory factors
    ) external onlyAuthorized nonReentrant {
        require(score <= MAX_SCORE, "Score exceeds maximum");
        require(user != address(0), "Invalid address");

        CreditProfile storage profile = profiles[user];
        uint256 oldScore = profile.score;
        uint8 tier = _calculateTier(score);

        if (!profile.isActive) {
            totalProfiles++;
            profile.isActive = true;
            emit ProfileCreated(user, score, tier);
        } else {
            emit ScoreUpdated(user, oldScore, score);
        }

        profile.score = score;
        profile.lastUpdated = block.timestamp;
        profile.dataCommitment = commitment;
        profile.tier = tier;
        profile.totalAnalyses++;
        scoreFactors[user] = factors;
        totalAnalyses++;
    }

    function verifyScoreAbove(address user, uint256 threshold)
        external
        view
        returns (bool)
    {
        require(profiles[user].isActive, "Profile not found");
        return profiles[user].score >= threshold;
    }

    function getCreditTier(address user) external view returns (uint8) {
        require(profiles[user].isActive, "Profile not found");
        return profiles[user].tier;
    }

    function generateProofHash(address user, bytes memory data)
        external
        returns (bytes32)
    {
        require(profiles[user].isActive, "Profile not found");

        bytes32 proofHash = keccak256(
            abi.encodePacked(
                user,
                profiles[user].score,
                profiles[user].dataCommitment,
                block.timestamp,
                data
            )
        );

        emit ProofGenerated(user, proofHash);
        return proofHash;
    }

    function getProfile(address user)
        external
        view
        returns (CreditProfile memory)
    {
        require(profiles[user].isActive, "Profile not found");
        return profiles[user];
    }

    function getScoreFactors(address user)
        external
        view
        returns (ScoreFactors memory)
    {
        require(profiles[user].isActive, "Profile not found");
        return scoreFactors[user];
    }

    function isProfileFresh(address user, uint256 maxAge)
        external
        view
        returns (bool)
    {
        if (!profiles[user].isActive) return false;
        return (block.timestamp - profiles[user].lastUpdated) <= maxAge;
    }

    function authorizeAnalyzer(address analyzer) external onlyOwner {
        require(analyzer != address(0), "Invalid address");
        authorizedAnalyzers[analyzer] = true;
        emit AnalyzerAuthorized(analyzer);
    }

    function revokeAnalyzer(address analyzer) external onlyOwner {
        authorizedAnalyzers[analyzer] = false;
    }

    function getStats() external view returns (
        uint256 _totalProfiles,
        uint256 _totalAnalyses
    ) {
        return (totalProfiles, totalAnalyses);
    }

    function _calculateTier(uint256 score) internal pure returns (uint8) {
        if (score >= 800) return 5;
        if (score >= 650) return 4;
        if (score >= 500) return 3;
        if (score >= 350) return 2;
        return 1;
    }
}