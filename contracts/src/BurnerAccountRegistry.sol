// SPDX-License-Identifier: UNLICENSED
// SEE LICENSE IN https://files.altlayer.io/Alt-Research-License-1.md
// Copyright Alt Research Ltd. 2023. All rights reserved.
//
// You acknowledge and agree that Alt Research Ltd. ("Alt Research") (or Alt
// Research's licensors) own all legal rights, titles and interests in and to the
// work, software, application, source code, documentation and any other documents
pragma solidity ^0.8.18;

import {ECDSAUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

/// @title Registry for Burner Accounts
contract BurnerAccountRegistry is EIP712Upgradeable {
    // Mapping from burner account to associated user address
    mapping(address => address) public ownerAccounts;
    // Mapping to keep track of used nonces
    mapping(address => uint256) public nonces;

    // Error for invalid signatures
    error InvalidSignature();
    // Error for used nonce
    error UsedNonce();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes EIP-712.
    function initialize() external initializer {
        __EIP712_init("BurnerAccountRegistry", "0.1.0");
    }

    /// @notice Registers a new burner account.
    /// @dev Verifies the signature, updates the user's burner account, and records the nonce used.
    /// @param signature The user's signed data.
    /// @param signer The address of the signer.
    /// @param nonce The nonce associated with the user.
    function register(
        bytes memory signature,
        address signer,
        uint256 nonce
    ) external {
        // Ensure the nonce is not reused
        if (nonce <= nonces[signer]) {
            revert UsedNonce();
        }

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "User(address signer,uint256 nonce,address target)"
                    ),
                    signer,
                    nonce,
                    msg.sender
                )
            )
        );

        // Recover the signer's address from the signature
        address recoveredSigner = ECDSAUpgradeable.recover(digest, signature);

        // Check if the recovered address matches the signer's address
        if (recoveredSigner != signer) {
            revert InvalidSignature();
        }

        // Update the nonce for the signer
        nonces[signer] = nonce;

        ownerAccounts[msg.sender] = signer;
    }
}
