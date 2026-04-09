// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreditSBT
 * @notice Soulbound Token for ZK Credit Identity on HashKey Chain
 * @dev Non-transferable NFT tied to credit score tier
 */
contract CreditSBT is ERC721, Ownable {

    struct CreditIdentity {
        uint8 tier;
        uint256 issuedAt;
        uint256 expiresAt;
        bytes32 scoreCommitment;
        bool isValid;
    }

    mapping(uint256 => CreditIdentity) public identities;
    mapping(address => uint256) public userTokenId;

    uint256 private _tokenIdCounter;
    uint256 public constant VALIDITY_PERIOD = 90 days;

    event IdentityIssued(address indexed user, uint256 tokenId, uint8 tier);
    event IdentityRevoked(uint256 indexed tokenId);
    event IdentityRenewed(uint256 indexed tokenId, uint256 newExpiry);

    constructor() ERC721("ZK Credit Identity", "ZKCI") Ownable(msg.sender) {}

    function mint(
        address to,
        uint8 tier,
        bytes32 scoreCommitment
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid address");
        require(tier >= 1 && tier <= 5, "Invalid tier");
        require(userTokenId[to] == 0, "Identity already exists");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);

        identities[tokenId] = CreditIdentity({
            tier: tier,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + VALIDITY_PERIOD,
            scoreCommitment: scoreCommitment,
            isValid: true
        });

        userTokenId[to] = tokenId;
        emit IdentityIssued(to, tokenId, tier);
        return tokenId;
    }

    function renew(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(identities[tokenId].isValid, "Identity not valid");

        identities[tokenId].expiresAt = block.timestamp + VALIDITY_PERIOD;
        emit IdentityRenewed(tokenId, identities[tokenId].expiresAt);
    }

    function revoke(uint256 tokenId) external onlyOwner {
        identities[tokenId].isValid = false;
        emit IdentityRevoked(tokenId);
    }

    function isValidIdentity(uint256 tokenId) external view returns (bool) {
        CreditIdentity memory identity = identities[tokenId];
        return identity.isValid && block.timestamp < identity.expiresAt;
    }

    function getUserTier(address user) external view returns (uint8) {
        uint256 tokenId = userTokenId[user];
        require(tokenId != 0, "No identity found");
        require(identities[tokenId].isValid, "Identity not valid");
        require(
            block.timestamp < identities[tokenId].expiresAt,
            "Identity expired"
        );
        return identities[tokenId].tier;
    }

    function getUserIdentity(address user)
        external
        view
        returns (CreditIdentity memory)
    {
        uint256 tokenId = userTokenId[user];
        require(tokenId != 0, "No identity found");
        return identities[tokenId];
    }

    // ============ Soulbound — Block all transfers ============

    function transferFrom(
        address,
        address,
        uint256
    ) public pure override {
        revert("Soulbound: Transfer not allowed");
    }

    function approve(address, uint256) public pure override {
        revert("Soulbound: Approval not allowed");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: Approval not allowed");
    }

    // ============ Metadata ============

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        CreditIdentity memory identity = identities[tokenId];
        string memory tierName = _getTierName(identity.tier);

        return string(
            abi.encodePacked(
                "data:application/json;utf8,",
                '{"name":"ZK Credit Identity #',
                _toString(tokenId),
                '","description":"Privacy-preserving credit identity on HashKey Chain","attributes":[{"trait_type":"Tier","value":"',
                tierName,
                '"},{"trait_type":"Valid","value":"',
                identity.isValid ? "true" : "false",
                '"}]}'
            )
        );
    }

    function _getTierName(uint8 tier) internal pure returns (string memory) {
        if (tier == 5) return "Excellent";
        if (tier == 4) return "Very Good";
        if (tier == 3) return "Good";
        if (tier == 2) return "Fair";
        return "Poor";
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}