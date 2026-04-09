// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 1. التعريف يجب أن يكون خارج العقد
interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory input
    ) external view returns (bool);
}

// 2. بداية العقد
contract ReputationSBT {
    string public name = "DeFi Compass Badge";
    string public symbol = "DCB";
    address public verifierAddress;
    uint256 private _nextTokenId;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor(address _verifierAddress) {
        verifierAddress = _verifierAddress;
    }

    function mintSBT(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory input
    ) public {
        // التحقق باستخدام عنوان الموثق المنشور سابقا
        require(IVerifier(verifierAddress).verifyProof(a, b, c, input), "Invalid ZK Proof!");
        
        // التأكد أن الإثبات يخص صاحب المحفظة
        require(input[1] == uint256(uint160(msg.sender)), "Proof address mismatch!");
        
        // منع التكرار
        require(_balances[msg.sender] == 0, "SBT already minted for this wallet");

        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;

        emit Transfer(address(0), msg.sender, tokenId);
    }

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return _owners[tokenId];
    }
}