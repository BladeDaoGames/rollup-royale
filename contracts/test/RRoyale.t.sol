// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/RRoyale.sol";
import "../src/UUPSProxy.sol";
import "forge-std/console.sol";
import "forge-std/Vm.sol";

contract RoyaleHarness is RRoyale {
    function setPlayerPosition(uint256 _roomId, uint8 _playerIndex, uint8 _position) external {
        //uint8 prevPosition = games[_roomId].positions[_playerIndex];
        games[_roomId].board[games[_roomId].positions[_playerIndex]].occupantId = 0;
        games[_roomId].positions[_playerIndex] = _position;
        games[_roomId].board[_position].occupantId = _playerIndex+1;
    }

    function setPlayerFT(uint256 _roomId, uint8 _playerIndex, uint16 _newFT) external {
        games[_roomId].playerFTs[_playerIndex] = _newFT;
    }

    function getPercentDivide(uint256 a, uint256 b) external returns(uint256){
        return _percentDivide(a, b);
    }

    function getRandomUint256() external returns(uint256){
        return _getRandomUint256(88);
    }
}
contract RoyaleTest is Test {
    RRoyale implementationV1;
    UUPSProxy rRoyaleProxy;
    RRoyale rroyale;

    RoyaleHarness harness;
    UUPSProxy rrHarnessProxy;
    RoyaleHarness rrHarnessRoyale;
    

    address player1 = makeAddr("player1");
    address player2 = makeAddr("player2");
    address player3 = makeAddr("player3");
    address player4 = makeAddr("player4");

    function setUp() public {
        implementationV1 = new RRoyale();
        harness = new RoyaleHarness();

        rRoyaleProxy = new UUPSProxy(address(implementationV1), "");
        rroyale = RRoyale(address(rRoyaleProxy));
        rroyale.initialize(msg.sender);

        rrHarnessProxy = new UUPSProxy(address(harness), "");
        rrHarnessRoyale = RoyaleHarness(address(rrHarnessProxy));
        rrHarnessRoyale.initialize(msg.sender);

        console.logAddress(player1);
        console.logAddress(player2);
        console.logAddress(player3);
        console.logAddress(player4);
    }

    function test_CheckGameInfo0() public {
        rroyale.getGameInfo(0);
    }

    function test_CheckGameRoomPlayerCount() public {
        assertEq(rroyale.getRoomPlayersCount(0), 0);
    }

    function test_createGame() public {
        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
    }

    function test_joinGameTo2players() public {
        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rroyale.joinGame{value: 100}(1);
    }

    function test_joinGameTo3players() public {
        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rroyale.joinGame{value: 100}(1);
        hoax(player3, 100 ether);
        rroyale.joinGame{value: 100}(1);
    }

    function test_joinGameTo4players() public {

        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rroyale.joinGame{value: 100}(1);
        hoax(player3, 100 ether);
        rroyale.joinGame{value: 100}(1);
        hoax(player4, 100 ether);
        rroyale.joinGame{value: 100}(1);
        rroyale.getPlayerIds(1);
    }

    function test_2playersReadyUp() public {
        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rroyale.joinGame{value: 100}(1);
        vm.prank(player1);
        rroyale.playerReadyUp(1, player1, false);
        vm.prank(player2);
        rroyale.playerReadyUp(1, player2, false);
        rroyale.getPlayerReadiness(1);
    }

    function test_3playersReadyUp() public {
        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rroyale.joinGame{value: 100}(1);
        hoax(player3, 100 ether);
        rroyale.joinGame{value: 100}(1);
        vm.prank(player1);
        rroyale.playerReadyUp(1, player1, false);
        vm.prank(player2);
        rroyale.playerReadyUp(1, player2, false);
        vm.prank(player3);
        rroyale.playerReadyUp(1, player3, false);
        rroyale.getPlayerReadiness(1);
    }

    function test_4playersReadyUp() public {
        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rroyale.joinGame{value: 100}(1);
        hoax(player3, 100 ether);
        rroyale.joinGame{value: 100}(1);
        hoax(player4, 100 ether);
        rroyale.joinGame{value: 100}(1);
        vm.prank(player1);
        rroyale.playerReadyUp(1, player1, false);
        vm.prank(player2);
        rroyale.playerReadyUp(1, player2, false);
        vm.prank(player3);
        rroyale.playerReadyUp(1, player3, false);
        vm.prank(player4);
        rroyale.playerReadyUp(1, player4, false);
        rroyale.getPlayerReadiness(1);
    }

    function test_2playersStartGame() public returns (uint8[7] memory) {
        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rroyale.joinGame{value: 100}(1);
        vm.prank(player1);
        rroyale.playerReadyUp(1, player1, false);
        vm.prank(player2);
        rroyale.playerReadyUp(1, player2, false);
        
        vm.prank(player1);
        rroyale.startGame(1);

        uint8[7] memory positions = rroyale.getPiecePositions(1);
        // console.logUint(positions[0]);
        // console.logUint(positions[1]);
        // console.logUint(positions[2]);
        // console.logUint(positions[3]);
        // console.logUint(positions[4]);
        // console.logUint(positions[5]);
        // console.logUint(positions[6]);

        return positions;
    }

    function test_3playersStartGame() public returns (uint8[7] memory) {
        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rroyale.joinGame{value: 100}(1);
        hoax(player3, 100 ether);
        rroyale.joinGame{value: 100}(1);
        vm.prank(player1);
        rroyale.playerReadyUp(1, player1, false);
        vm.prank(player2);
        rroyale.playerReadyUp(1, player2, false);
        vm.prank(player3);
        rroyale.playerReadyUp(1, player3, false);
        
        vm.prank(player1);
        rroyale.startGame(1);

        uint8[7] memory positions = rroyale.getPiecePositions(1);
        // console.logUint(positions[0]);
        // console.logUint(positions[1]);
        // console.logUint(positions[2]);
        // console.logUint(positions[3]);
        // console.logUint(positions[4]);
        // console.logUint(positions[5]);
        // console.logUint(positions[6]);

        return positions;
    }

    function test_4playersStartGame() public returns (uint8[7] memory) {
        hoax(player1, 100 ether);
        rroyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rroyale.joinGame{value: 100}(1);
        hoax(player3, 100 ether);
        rroyale.joinGame{value: 100}(1);
        hoax(player4, 100 ether);
        rroyale.joinGame{value: 100}(1);
        vm.prank(player1);
        rroyale.playerReadyUp(1, player1, false);
        vm.prank(player2);
        rroyale.playerReadyUp(1, player2, false);
        vm.prank(player3);
        rroyale.playerReadyUp(1, player3, false);
        vm.prank(player4);
        rroyale.playerReadyUp(1, player4, false);
        
        vm.prank(player1);
        rroyale.startGame(1);

        uint8[7] memory positions = rroyale.getPiecePositions(1);
        // console.logUint(positions[0]);
        // console.logUint(positions[1]);
        // console.logUint(positions[2]);
        // console.logUint(positions[3]);
        // console.logUint(positions[4]);
        // console.logUint(positions[5]);
        // console.logUint(positions[6]);

        return positions;
    }

    function test_playerGetItem() public returns (uint8[7] memory) {
        hoax(player1, 100 ether);
        rrHarnessRoyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rrHarnessRoyale.joinGame{value: 100}(1);
        vm.prank(player1);
        rrHarnessRoyale.playerReadyUp(1, player1, false);
        vm.prank(player2);
        rrHarnessRoyale.playerReadyUp(1, player2, false);
        
        vm.prank(player1);
        rrHarnessRoyale.startGame(1);
        

        rrHarnessRoyale.setPlayerPosition(1, 0, 55);
        vm.prank(player1);
        rrHarnessRoyale.movePlayer(1, RRoyale.Dir.RIGHT, player1,false);
        uint8[7] memory positions = rrHarnessRoyale.getPiecePositions(1);
        // console.logUint(positions[0]);
        // console.logUint(positions[1]);
        // console.logUint(positions[2]);
        // console.logUint(positions[3]);
        // console.logUint(positions[4]);
        // console.logUint(positions[5]);
        // console.logUint(positions[6]);

        return positions;
    }

    function test_pKp() public returns (uint8[7] memory) {
        hoax(player1, 100 ether);
        rrHarnessRoyale.createGame{value: 100}(100);
        hoax(player2, 100 ether);
        rrHarnessRoyale.joinGame{value: 100}(1);
        vm.prank(player1);
        rrHarnessRoyale.playerReadyUp(1, player1, false);
        vm.prank(player2);
        rrHarnessRoyale.playerReadyUp(1, player2, false);
        
        vm.prank(player1);
        rrHarnessRoyale.startGame(1);
        

        rrHarnessRoyale.setPlayerPosition(1, 0, 55);
        rrHarnessRoyale.setPlayerPosition(1, 1, 56);
        rrHarnessRoyale.setPlayerFT(1, 1, 10000);
        vm.prank(player1);
        rrHarnessRoyale.movePlayer(1, RRoyale.Dir.RIGHT, player1,false);
        uint8[7] memory positions = rrHarnessRoyale.getPiecePositions(1);
        uint16[4] memory fts = rrHarnessRoyale.getPlayerFTs(1);
        console.logUint(fts[0]);
        console.logUint(fts[1]);
        console.log(rrHarnessRoyale.getTop10RanksByWinnings()[0].amount);
        return positions;
    }

    function test_percdivide() public returns (uint256) {
        return rrHarnessRoyale.getPercentDivide(91, 193);
        //return (rrHarnessRoyale.getRandomUint256()%100);
    }

    function test_transferGasOut() public {
        vm.deal(address(rroyale), 100 ether);
        console.log(address(rroyale).balance);
        rroyale.adminTransferFunds(1 ether, player1);
        console.log((player1).balance);
    }
}
