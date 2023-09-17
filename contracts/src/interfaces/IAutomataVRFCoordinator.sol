// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IAutomataVRFCoordinator {
    function DEFAULT_ADMIN_ROLE (  ) external view returns ( bytes32 );
    function SIGNER_ROLE (  ) external view returns ( bytes32 );
    function SUBMITTER_ROLE (  ) external view returns ( bytes32 );
    function drandPubKey ( uint256, uint256 ) external view returns ( uint256 );
    function getCurrentRound (  ) external view returns ( uint256 );
    function getLatestRandomWords ( uint32 numWords ) external view returns ( uint256[] memory randomWords );
    function getLatestRandomness (  ) external view returns ( uint256 );
    function getRoleAdmin ( bytes32 role ) external view returns ( bytes32 );
    function grantRole ( bytes32 role, address account ) external;
    function hasRole ( bytes32 role, address account ) external view returns ( bool );
    function hashToField (  ) external view returns ( address );
    function onTokenTransfer ( address, uint256, bytes memory) external pure;
    function renounceRole ( bytes32 role, address account ) external;
    function requestRandomWords ( bytes32, uint64, uint16, uint32, uint32 numWords ) external returns ( uint256 roundId );
    function revokeRole ( bytes32 role, address account ) external;
    //function submitRandomness ( tuple drand, tuple proof, uint256[7][2][2] hash_to_field, tuple oracleOutput ) external;
    function supportsInterface ( bytes4 interfaceId ) external view returns ( bool );
    function verifier (  ) external view returns ( address );
}