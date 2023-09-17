// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
//import "./libraries/RoyaleBattleV1.sol";
import "./interfaces/IAutomataVRFCoordinator.sol";

contract RRoyale is 
    Initializable,
    PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    uint8 public constant MAX_PLAYERS = 4;
    uint8 public constant MAP_WIDTH = 10;
    uint8 public constant MAP_HEIGHT = 10;
    uint8 public constant TILE_COUNT = MAP_WIDTH * MAP_HEIGHT;
    uint16 public starting_FT = 100;
    address public burnerWallet;
    bool public useBurnerWallet = false;
    uint8 public houseFee = 2;
    bool public useVRF = false;
    address public vrfCoordinator;
    bool spawnDefault = true;
    

    //array of all game rooms
    GameRoom[] public games;
    //RoyaleBattleV1.GameRoom[] public games;
    mapping(address => uint256) public playerInGame; //track player
    mapping(address => UserStats) public userStats;
    RankingRow[10] public top10Earned;
    RankingRow[10] public top10Wins;
    enum Dir { DOWN, LEFT, UP, RIGHT }

    struct GameInfo {
        address gameCreator;
        uint8 playersCount;
        uint8 itemCount;
        uint256 minStake;
        uint256 totalStaked;
        bool hasStarted;
        bool hasEnded;
        bool gamePaused;
        bool gameAbandoned;
        //address winner;
    }

    struct Tile {
        uint8 occupantId; // 1 - 4 is player, > 4 is item, 0 is empty
        bool isWall;
    }

    struct GameRoom {
        GameInfo info;
        Tile[TILE_COUNT] board;
        address[MAX_PLAYERS] playerIds;
        uint16[MAX_PLAYERS] playerFTs;
        uint8[MAX_PLAYERS*2-1] positions;
        bool[MAX_PLAYERS] playerAlive;
        bool[MAX_PLAYERS] playerReady;
        bool[MAX_PLAYERS] playerPauseVote;
        uint256[MAX_PLAYERS] playerLastMoveTime;
    }

    struct UserStats {
        uint256 totalWins;
        uint256 totalLosses;
        uint256 totalGasEarned;
        uint256 totalGasLost;
    }

    struct RankingRow {
        address player;
        uint256 amount;
    }

    /*
    Board Layout
    00 01 02 03 04 05 06 07 08 09
    10 11 12 13 14 15 16 17 18 19
    20 21 22 23 24 25 26 27 28 29
    30 31 32 33 34 35 36 37 38 39
    40 41 42 43 44 45 46 47 48 49
    50 51 52 53 54 55 56 57 58 59
    60 61 62 63 64 65 66 67 68 69
    70 71 72 73 74 75 76 77 78 79
    80 81 82 83 84 85 86 87 88 89
    90 91 92 93 94 95 96 97 98 99
    */

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Not valid address");
        _;
    }

    //by: pauseUpgradeable -> whenNotPaused
    // modifier worldFunctioning() {
    //     require(!worldPaused, "E1");
    //     _;
    // }

    modifier enoughFunds(uint256 _fee, uint256 minStake) {
        require(msg.value >= minStake, "E2");
        _;
    }

    modifier playerNotInGame() {
        require(playerInGame[msg.sender] == 0, "E3");
        _;
    }

    // within player limit
    // game has not started
    // game has not ended
    // game has not been abandoned
    modifier joinable(uint256 _roomId) {
        require(games[_roomId].info.playersCount > 0 && 
            games[_roomId].info.playersCount < MAX_PLAYERS, "E4");
        require(games[_roomId].info.hasStarted == false, "E5");
        require(games[_roomId].info.hasEnded == false, "E6");
        require(games[_roomId].info.gameAbandoned == false, "E7");
        _;
    }

    modifier gameNotStarted(uint256 _roomId) {
        require(games[_roomId].info.hasStarted == false, "E5");
        _;
    }

    modifier gameStarted(uint256 _roomId) {
        require(games[_roomId].info.hasStarted == true, "E8");
        _;
    }

    modifier enoughPlayers(uint256 _roomId) {
        require(games[_roomId].info.playersCount > 1, "E9");
        _;
    }

    modifier allPlayersReady(uint256 _roomId) {
        require(_allPlayersAreReady(_roomId), "E10");
        _;
    }

    modifier gameNotPaused(uint256 _roomId) {
        require(games[_roomId].info.gamePaused == false, "E18");
        _;
    }

    modifier gameNotEnded(uint256 _roomId) {
        require(games[_roomId].info.hasEnded == false, "E6");
        _;
    }

    modifier gameNotAbandoned(uint256 _roomId) {
        require(games[_roomId].info.gameAbandoned == false, "E7");
        _;
    }

    modifier playerIsInGame(uint256 _roomId, address _player, bool _useBurner){
        require(playerInGame[(_useBurner? _player:msg.sender)] == _roomId, "E11");
        _;
    }

    modifier playerIsAlive(uint256 _roomId, address _player, bool _useBurner){
        require(_getCallingPlayerId(_roomId, _player, _useBurner)>0, "E12");
        require(games[_roomId].playerAlive[_getCallingPlayerId(_roomId, _player, _useBurner)-1] == true, "E13");
        _;
    }

    modifier onlyGameCreator(uint256 _roomId) {
        require(games[_roomId].info.gameCreator == msg.sender, "E12");
        _;
    }

    modifier allowedToUseBurner(bool _useBurner) {
        if(_useBurner){
            require(useBurnerWallet && burnerWallet == msg.sender, "E17");
        }
        _;
    }


    event GameCreated(uint256 indexed _roomId, address indexed _creator);
    event PlayerJoined(uint256 _roomId, address _player);
    event PlayerSpawned(uint256 _roomId, address _player, uint8 _tile);
    event GameAbandoned(uint256 indexed _roomId);
    event PlayerToggleReady(uint256 _roomId, address _player);
    event ItemSpawned(uint256 _roomId, uint8 _itemId, uint8 _tile);

    event GameStarted(uint256 indexed _roomId);
    event PlayerPaused(uint256 _roomId, address _player);
    event PlayerUnPaused(uint256 _roomId, address _player);
    event GamePaused(uint256 _roomId);
    event GameUnPaused(uint256 _roomId);

    event PlayerMoved(uint256 _roomId, address _player, uint8 _destinationTile);
    event PlayerKilled(uint256 _roomId, address _player);

    event GameEnded(uint256 indexed _roomId, address indexed _winner);
    event RewardSent(uint256 indexed _roomId, address indexed _winner, uint256 indexed _reward);
    event EarningsTopped(address indexed _player, uint256 _earnings);
    event WinningsTopped(address indexed _player, uint256 _winnings);

    constructor() {
        _disableInitializers();
    }


    // PROXY FUNCTIONS
    function initialize(address _burnerWallet) public initializer {
        __Pausable_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        burnerWallet = _burnerWallet;
        games.push(); //pad with a dummy game
        games[0].info.hasEnded = true; // set dummy game to end
        starting_FT = 100;
        houseFee = 2;
        spawnDefault = true;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        virtual
        override
        onlyOwner
    {}

    // function getImplementation() external view returns (address) {
    //     return _getImplementation();
    // }

    // ADMIN FUNCTIONS
    function setUseBurnerWallet(bool _useBurnerWallet) public onlyOwner {
        useBurnerWallet = _useBurnerWallet;
    }

    function setBurnerWallet(address _burnerWallet) public onlyOwner {
        burnerWallet = _burnerWallet;
    }

    function togglePause() public onlyOwner {
        paused() ? _unpause() : _pause();
    }

    function setHouseFee(uint8 _houseFee) public onlyOwner {
        houseFee = _houseFee;
    }

    function setSpawnDefault(bool _spawnDefault) public onlyOwner {
        spawnDefault = _spawnDefault;
    }

    function setStartingFT(uint16 _startingFT) public onlyOwner {
        starting_FT = _startingFT;
    }

    //TODO: add admin move player. (can do using burner)
    //TODO: add admin spawn item. 
    //TODO: add admin end game.
    function adminBootAll(uint256 _roomId) public onlyOwner returns(bool){
        _returnFundsToAll(_roomId);
        _bootAllPlayers(_roomId);
        games[_roomId].info.gameAbandoned = true;
        emit GameAbandoned(_roomId);
        return true;
    }

    function adminTransferFunds(uint256 _amount, address _to) public onlyOwner returns(bool){
        (bool sent, ) = payable(_to).call{value: _amount}("");
        return(sent);
    }

    function setUseVRF(bool _useVRF) public onlyOwner {
        useVRF = _useVRF;
    }

    function setVRFAddress(address _vrfCoordinator) public onlyOwner {
        vrfCoordinator = _vrfCoordinator;
    }

    // ===== INTERNAL HELPER FUNCTIONS =====
    function _getCallingPlayerId(uint256 _roomId, address _player, bool _useBurner) internal view returns (uint8){
        for (uint8 i = 0; i < games[_roomId].playerIds.length; i++) {
            if (games[_roomId].playerIds[i] == 
                (_useBurner? _player:msg.sender)
                ) {
                return i+1;
            }
        }
        return 0;
    }

    function _getPlayerPauseCount(uint256 _roomId) internal view returns (uint8) {
        uint8 count = 0;
        for (uint8 i=0; i<games[_roomId].playerPauseVote.length; i++) {
            if (games[_roomId].playerPauseVote[i] == true && 
                games[_roomId].playerAlive[i] == true) {
                count++;
            }
        }
        return count;
    }

    function _allPlayersAreReady(uint256 _roomId) internal view returns (bool) {
        for (uint8 i = 0; i < games[_roomId].info.playersCount; i++) {
            if (games[_roomId].playerReady[i] == false) {
                return false;
            }
        }
        return true;
    }

    function _getUnoccupiedTile(uint256 _roomId, uint160 _seed) internal view returns (uint8) {
        // get random tile
        uint8 random = _getRandomTile(_seed);
        //return random;
        //if tile is occupied search again
        if ((games[_roomId].board[random].occupantId != 0) || (games[_roomId].board[random].isWall)) {
            return _getUnoccupiedTile(_roomId, _seed*3);
        } else {
            // return tile
            return random;
        }
    }

    function _getBattleResults(uint256 _roomId, uint8 playerIndex, uint8 occupantIndex) internal view returns (uint8) {
        // get player ft
        uint16 playerFT = games[_roomId].playerFTs[playerIndex];
        // get occupant ft
        uint16 occupantFT = games[_roomId].playerFTs[occupantIndex];
        // get total FT
        uint16 totalFT = playerFT + occupantFT;

        // chance of player winning is playerFT / totalFT
        uint256 chance = _percentDivide(uint256(playerFT), uint256(totalFT));

        // get random number between 1 to 100
        uint256 random = (_getRandomUint256(88) % 100) + 1;
        
        // if random number is less than chance, player wins
        if (random <= chance) {
            return playerIndex;
        } else {
            return occupantIndex;
        }
    }

    function _getRandomUint256(uint160 _seed) internal view returns (uint256) {

        //TODO: Use Alt Layer VRF here when available
        if(useVRF){
            return uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp, 
                        block.prevrandao,
                        _seed,
                        IAutomataVRFCoordinator(vrfCoordinator).getLatestRandomness()
                        )
                    )
            );
        }

        return uint256(keccak256(
                    abi.encodePacked(
                        block.timestamp, 
                        block.prevrandao,
                        _seed
                        )
                    ));
    }

    // Math Utils

    function _getItemFtDiff() internal view returns (int16){
        // get random number between -50 to 50
        int16 random = int16(int256(_getRandomUint256(888)%130))-65;
        return random;
    }

    function _getIndexDiffFromDirection(Dir _direction) internal pure returns (int8){
        if (_direction == Dir.UP) {
            return int8(MAP_WIDTH);
        } else if (_direction == Dir.DOWN) {
            return int8(MAP_WIDTH) * -1;
        } else if (_direction == Dir.LEFT) {
            return -1;
        } else if (_direction == Dir.RIGHT) {
            return 1;
        } else {
            return 0;
        }
    }

    function _percentDivide(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "division by zero will result in infinity.");
        return ((a * 1e18 * 100) / (b* 1e18));
    }

    function _getRandomTile(uint160 _seed) internal view returns (uint8) {
        // get random number
        uint8 random = uint8(_getRandomUint256(_seed) % TILE_COUNT);
        // uint8 random = uint8(
        //         uint256(keccak256(
        //             abi.encodePacked(
        //                 block.timestamp, 
        //                 block.prevrandao
        //                 )
        //                 )) % TILE_COUNT
        //             );
        return random;
    }

    function _returnFundsToAll(uint256 _roomId)
        internal returns (bool) {
        // for each player
        for (uint8 i=0; i<games[_roomId].playerIds.length; i++) {
            // return funds to all players
            (bool sent, ) = games[_roomId].playerIds[i].call{value:
                games[_roomId].info.minStake
            }("");
            require(sent, "E16");
        }
        return true;
    }

    function _bootAllPlayers(uint256 _roomId)
        internal returns (bool) {
        // for each player
        for (uint8 i=0; i<games[_roomId].playerIds.length; i++) {
            // set playerIn Game to 0
            if(playerInGame[games[_roomId].playerIds[i]] == _roomId) {
                playerInGame[games[_roomId].playerIds[i]] = 0;
                games[_roomId].playerIds[i] = address(0);
            }
        }
        return true;
    }

    function _playerOneAbadonGame(uint256 _roomId) 
        gameNotStarted(_roomId)
        onlyGameCreator(_roomId) internal returns (bool)
    {
        _returnFundsToAll(_roomId);
        _bootAllPlayers(_roomId);
        games[_roomId].info.gameAbandoned = true;
        emit GameAbandoned(_roomId);
        return true;
    }

    function _endGame(uint256 _roomId) internal returns (bool) {
        // set game has ended
        games[_roomId].info.hasEnded = true;
        
        // get winner address
        for (uint8 i=0; i<games[_roomId].playerAlive.length; i++) {
            if (games[_roomId].playerAlive[i] == true) { //TODO: here it is assuming first alive is winner
                address winnerAddress = games[_roomId].playerIds[i];
                // emit game over event
                emit GameEnded(_roomId, winnerAddress);
                //send winner staked funds
                uint256 winnerFunds = games[_roomId].info.totalStaked * (100-houseFee) / 100;
                (bool sent, ) = winnerAddress.call{value: winnerFunds}("");
                require(sent, "E16");
                emit RewardSent(_roomId, winnerAddress, winnerFunds);
                //update winner stats
                userStats[winnerAddress].totalWins++;
                userStats[winnerAddress].totalGasEarned += winnerFunds - games[_roomId].info.minStake;

                if (userStats[winnerAddress].totalGasEarned > top10Earned[9].amount) 
                {
                    _insertIntoTop10EarnedSorted(winnerAddress);
                    emit EarningsTopped(winnerAddress, userStats[winnerAddress].totalGasEarned);
                }
                if (userStats[winnerAddress].totalWins > top10Wins[9].amount)
                {
                    _insertIntoTop10WinsSorted(winnerAddress);
                    emit WinningsTopped(winnerAddress, userStats[winnerAddress].totalWins);
                }

                break;
            }
        }

        return _bootAllPlayers(_roomId);
    }

    function _insertIntoTop10EarnedSorted(address winner) internal {
        uint256 winnerEarned = userStats[winner].totalGasEarned;
        uint256 i = 0;
        while (i < 10) {
            if (winnerEarned > top10Earned[i].amount) {
                for (uint256 j = 9; j > i; j--) {
                    top10Earned[j].player = top10Earned[j-1].player;
                    top10Earned[j].amount = top10Earned[j-1].amount;
                }
                top10Earned[i].player = winner;
                top10Earned[i].amount = winnerEarned;
                break;
            }
            i++;
        }
    }

    function _insertIntoTop10WinsSorted(address winner) internal {
        uint256 winnerWins = userStats[winner].totalWins;
        uint256 i = 0;
        while (i < 10) {
            if (winnerWins > top10Wins[i].amount) {
                for (uint256 j = 9; j > i; j--) {
                    top10Wins[j].player = top10Wins[j-1].player;
                    top10Wins[j].amount = top10Wins[j-1].amount;
                }
                top10Wins[i].player = winner;
                top10Wins[i].amount = winnerWins;
                break;
            }
            i++;
        }
    }

    // ===== VIEW FUNCTIONS =====
    function getTotalGames() public view returns (uint256) {
        return games.length;
    }

    function getGameInfo(uint256 _roomId) public view returns (GameInfo memory){
        return games[_roomId].info;
    }
    
    function getRoomPlayersCount(uint256 _roomId) public view returns (uint8) {
        return games[_roomId].info.playersCount;
    }

    function getRoomMinStake(uint256 _roomId) public view returns (uint256) {
        return games[_roomId].info.minStake;
    }

    function getRoomTotalStaked(uint256 _roomId) public view returns (uint256) {
        return games[_roomId].info.totalStaked;
    }

    function getRoomBoard(uint256 _roomId, uint8 _tilePos) public view returns (uint8, bool){
        return (games[_roomId].board[_tilePos].occupantId,
            games[_roomId].board[_tilePos].isWall
        );
    }

    function getPlayerIds(uint256 _roomId) public view returns (address[MAX_PLAYERS] memory){
        return games[_roomId].playerIds;
    }

    function getPlayerFTs(uint256 _roomId) public view returns (uint16[MAX_PLAYERS] memory){
        return games[_roomId].playerFTs;
    }

    function getPiecePositions(uint256 _roomId) public view returns (uint8[MAX_PLAYERS*2-1] memory){
        return games[_roomId].positions;
    }

    function getPlayerLives(uint256 _roomId) public view returns (bool[MAX_PLAYERS] memory){
        return games[_roomId].playerAlive;
    }

    function getPlayerReadiness(uint256 _roomId) public view returns (bool[MAX_PLAYERS] memory){
        return games[_roomId].playerReady;
    }

    function getPlayerPauseVote(uint256 _roomId) public view returns (bool[MAX_PLAYERS] memory){
        return games[_roomId].playerPauseVote;
    }

    function getPlayerLastMoveTime(uint256 _roomId) public view returns (uint256[MAX_PLAYERS] memory){
        return games[_roomId].playerLastMoveTime;
    }

    function getGamesArray() public view returns (GameRoom[] memory){
        return games;
    }

    function getTop10RanksByEarnings() public view returns (RankingRow[10] memory){
        return top10Earned;
    }

    function getTop10RanksByWinnings() public view returns (RankingRow[10] memory){
        return top10Wins;
    }

    function testVRF() public view returns (uint256){
        return IAutomataVRFCoordinator(vrfCoordinator).getLatestRandomness();
    }


    // ===== SETTER FUNCTIONS =====
    function _spawnItem(uint256 _roomId, uint8 itemIndex, uint160 _seed) internal returns (bool) {
        // get random tile
        uint8 random = _getUnoccupiedTile(_roomId, _seed);
        // set tile to new item id
        games[_roomId].board[random].occupantId = itemIndex+1;
        // set position to tile index
        games[_roomId].positions[itemIndex] = random;
        
        // increment item count
        games[_roomId].info.itemCount++;
        emit ItemSpawned(_roomId, itemIndex+1, random);
        return true;
    }

    function _spawnItems(uint256 _roomId) internal returns (bool) {
        // get item count in game
        uint8 itemCount;
        for (uint8 i = 4; i < games[_roomId].positions.length; i++) {
            if (games[_roomId].positions[i] != type(uint8).max) {
                itemCount++;
            }
        }
        //uint8 itemCount = game.info.itemCount;
        // get number of players alive
        uint8 playersAlive;
        for (uint8 i = 0; i < games[_roomId].playerAlive.length; i++) {
            if (games[_roomId].playerAlive[i] == true) {
                playersAlive++;
            }
        }
        //uint8 playersAlive = game.info.playersCount;
        // get number of items to spawn (1 less than number of players on board)
        int8 itemsToSpawn = int8(playersAlive) - int8(itemCount) - int8(1);
        // correct if itemsToSpawn is negative
        itemsToSpawn = itemsToSpawn > int8(0) ? itemsToSpawn : int8(0);
        //for each item position in positions, look for empty item position to spawn item
        for (uint8 i = 4; i < games[_roomId].positions.length; i++) {
            // if position is max value (meaning it is empty)
            if (games[_roomId].positions[i] == type(uint8).max) {

                // if itemsToSpawn hits 0, break loop
                if (itemsToSpawn <= 0) {
                    break;
                }
                _spawnItem(_roomId, i, uint8(uint160(msg.sender)));
                itemsToSpawn--;
            }
        }
        return true;
    }

    function _killPlayer(uint256 _roomId, uint8 playerIndex) internal returns (uint8){
        games[_roomId].playerAlive[playerIndex] = false;
        games[_roomId].board[games[_roomId].positions[playerIndex]].occupantId = 0; // remove player from tile
        games[_roomId].positions[playerIndex] = type(uint8).max; //reset position to null
        games[_roomId].playerFTs[playerIndex] = 0; //reset player ft for UI
        games[_roomId].info.playersCount--;
        emit PlayerKilled(_roomId, games[_roomId].playerIds[playerIndex]);

        //update winner stats
        userStats[games[_roomId].playerIds[playerIndex]].totalLosses++;
        userStats[games[_roomId].playerIds[playerIndex]].totalGasLost += games[_roomId].info.minStake;
        
        // allow player to join another game
        playerInGame[games[_roomId].playerIds[playerIndex]] = 0;
        return playerIndex;
    }

    function _updatePlayerFT(uint256 _roomId, uint8 playerIndex, int16 _ftDiff) internal returns (uint16) {
        // get player ft
        uint16 playerFT = games[_roomId].playerFTs[playerIndex];
        // get final ft
        int16 finalFT = int16(playerFT) + _ftDiff;
        //int16 finalFT = 0;
        //finalFT = finalFT < 0 ? int16(int8(0)) : finalFT; // if final ft is less than 0, set to 0
        // if finalFT is 0, kill player
        if (finalFT <= int16(0)) {
            _killPlayer(_roomId, playerIndex);
            finalFT=int16(0);
        } else {
            // set player ft
            games[_roomId].playerFTs[playerIndex] = uint16(finalFT);
        }
        return uint16(finalFT);
        // _killPlayer(_roomId, playerIndex);
        // return uint16(uint8(0));
    }

    function _movePlayerToTileWithoutDying(uint256 _roomId, uint8 playerIndex, uint8 newPosition) 
        internal returns (uint8) {
        // set old position to 0
        games[_roomId].board[
            games[_roomId].positions[playerIndex]
        ].occupantId = 0;

        // set new position to player id
        games[_roomId].board[newPosition].occupantId = playerIndex+1;
        
        // set player position to new position
        games[_roomId].positions[playerIndex] = newPosition;

        emit PlayerMoved(_roomId, games[_roomId].playerIds[playerIndex], newPosition);

        return newPosition;
    }

    function _playerInteractWithItem(uint256 _roomId, uint8 playerIndex, uint8 itemIndex) 
        internal returns (uint16) 
    {   
        // get item position
        uint8 newPosition = games[_roomId].positions[itemIndex];
        // remove item position from positions array
        games[_roomId].positions[itemIndex] = type(uint8).max;

        games[_roomId].board[newPosition].occupantId = 0; //remove item from tile
        // reduce item count
        games[_roomId].info.itemCount--;

        // if playerNewFT is not 0, move player to the tile
        // NOTE: updatePlayerFT will update player position/board and alive if he is killed
        uint16 finalFT = _updatePlayerFT(_roomId, playerIndex, _getItemFtDiff());

        if(finalFT != uint16(0)){_movePlayerToTileWithoutDying(_roomId, playerIndex, newPosition);
        } //else case is covered by updatePlayerFT

    
        // spawn new items
        _spawnItems(_roomId);
        return finalFT;
    }

    function _playerInteractWithPlayer(uint256 _roomId, uint8 playerIndex, uint8 occupantIndex)
        internal returns (uint8)
    {
        // get occupant position
        uint8 newPosition = games[_roomId].positions[occupantIndex];
        
        // if winnerId is playerId, set Occupan FT to 0 and set to dead
        if (_getBattleResults(_roomId, playerIndex, occupantIndex) == playerIndex) {
            // kill occupant
            _killPlayer(_roomId, occupantIndex);
            // move player to new tile
            _movePlayerToTileWithoutDying(_roomId, playerIndex, newPosition);
            return playerIndex;
        } else {
            _killPlayer(_roomId, playerIndex);
            return occupantIndex;
        }
    }

    function _spawnPlayer(uint256 _roomId, uint8 playerIndex) internal returns (uint8){
        // use random position when available
        uint8 spawnTile;
        if(playerIndex==0){
            spawnTile=22;
        }else if(playerIndex==1){
            spawnTile=77;
        }else if(playerIndex==2){
            emit PlayerSpawned(_roomId, games[_roomId].playerIds[playerIndex], 27);
            spawnTile=27;
        }else if(playerIndex==3){
            emit PlayerSpawned(_roomId, games[_roomId].playerIds[playerIndex], 72);
            spawnTile=72;
        }else{
            spawnTile=0;
        }
        // set player spawn
        games[_roomId].board[spawnTile].occupantId = playerIndex+1;
        games[_roomId].positions[playerIndex] = spawnTile;
        emit PlayerSpawned(_roomId, games[_roomId].playerIds[playerIndex], spawnTile);
        return spawnTile;
    }

    function _movePlayerDir(uint256 _roomId, uint8 playerIndex, Dir _dir) 
        internal returns (bool)
    {
        // get player position
        uint8 playerPosition = games[_roomId].positions[playerIndex];

        // calculate new position
        uint8 newPosition = uint8(int8(playerPosition) + _getIndexDiffFromDirection(_dir));
        // revert if new position is out of bounds
        require(newPosition>=0 && newPosition <games[_roomId].board.length, "E14");


        // if playerPosition is at left edge of board and direction is left, revert
        if (playerPosition % MAP_WIDTH == 0 && _dir == Dir.LEFT) {
            require(newPosition % MAP_WIDTH != MAP_WIDTH - 1, "E14");
        }
        // if playerPosition is at right edge of board and direction is right, revert
        if (playerPosition % MAP_WIDTH == MAP_WIDTH - 1 && _dir == Dir.RIGHT) {
            require(newPosition % MAP_WIDTH != 0, "E14");
        }

        // revert if new position is a wall
        require(games[_roomId].board[newPosition].isWall == false, "E15");

        // if new position is not occupied
        if (games[_roomId].board[newPosition].occupantId == 0) {
            _movePlayerToTileWithoutDying(_roomId, playerIndex, newPosition);
        // if new position is occupied by item
        } else if (games[_roomId].board[newPosition].occupantId > 4){ 
            _playerInteractWithItem(_roomId, playerIndex, games[_roomId].board[newPosition].occupantId-1);
        } else if (games[_roomId].board[newPosition].occupantId <= 4) { 
            // if new position is occupied by player
            _playerInteractWithPlayer(_roomId, playerIndex, games[_roomId].board[newPosition].occupantId-1); // returns winner index
        }

        return true;
    }

    // ===== GAME FUNCTIONS =====
    function createGame(uint256 _minStake) external payable 
        whenNotPaused
        enoughFunds(msg.value, _minStake) 
        playerNotInGame
        returns (uint256 gameId)
    {
        GameRoom memory game;

        // set game info
        game.info.gameCreator = msg.sender;  //1. set game creator
        game.info.playersCount = 1;         //2. set player count
        game.info.minStake = _minStake;    //3. set min stake
        game.info.totalStaked = _minStake;  //4. set total staked (TODO: get msg.value and return excess)
        
        // update array indexes
        game.playerIds[0] = msg.sender;     //1. set player id
        game.playerFTs[0] = starting_FT;    //2. set player FT

        //initialize all postions to max
        for (uint8 i = 0; i < MAX_PLAYERS*2-1; i++) {
            game.positions[i] = type(uint8).max; // max value means not on board
        }

        game.playerAlive[0] = true;         //3. set player to alive 
        games.push(game);

        uint8 roomId = uint8(games.length - 1);
        // set player in game
        playerInGame[msg.sender] = roomId; // assume game length always game room id

        // spawn player
        _spawnPlayer(roomId, 0);

        emit GameCreated(roomId, msg.sender);
        return roomId;
    }

    function joinGame(uint256 _roomId) external payable 
        whenNotPaused 
        //enoughFunds(msg.value, _minStake) //NOT NEEDED BECAUSE TRANSACTION WILL REVERT
        playerNotInGame
        joinable(_roomId)
        returns (address)
    {   
        // TODO: GET the next empty index of player
        // We cannot assume playercount is the next empty player

        // set game info
        games[_roomId].info.playersCount++; // increment player count
        games[_roomId].info.totalStaked += games[_roomId].info.minStake; //TODO: return excess from msg.value; // add to total staked
        
        // update array indexes
        uint8 playerIndex = games[_roomId].info.playersCount-1; // get player id
        games[_roomId].playerIds[playerIndex] = msg.sender; // set player id
        games[_roomId].playerFTs[playerIndex] = starting_FT; // set player FT
        games[_roomId].playerAlive[playerIndex] = true; // set player Alive
        
        // set player in game
        playerInGame[msg.sender] = _roomId; // set player in game

        // spawn player
        _spawnPlayer(_roomId, playerIndex);
        
        emit PlayerJoined(_roomId, msg.sender);
        return msg.sender;
    }

    function playerReadyUp(uint256 _roomId, address _player, bool _useBurner) 
        external 
        whenNotPaused 
        gameNotStarted(_roomId)
        playerIsInGame(_roomId, _player, _useBurner)
        allowedToUseBurner(_useBurner)
        returns (bool)
    {
        //get player id
        uint8 playerIndex = _getCallingPlayerId(_roomId, _player, _useBurner)-1;
        require(playerIndex+1>0, "E11");

        // toggle player ready
        games[_roomId].playerReady[playerIndex] = !games[_roomId].playerReady[playerIndex];
        emit PlayerToggleReady(_roomId, games[_roomId].playerIds[playerIndex]);
        return true;
    }

    function playerTogglePause(uint256 _roomId, address _player, bool _useBurner) 
        external 
        whenNotPaused 
        playerIsInGame(_roomId, _player, _useBurner)
        allowedToUseBurner(_useBurner)
        returns (bool)
    {
        // get player id
        uint8 playerIndex = _getCallingPlayerId(_roomId, _player, _useBurner)-1;
        require(playerIndex+1>0, "E11");
        // toggle player paused
        games[_roomId].playerPauseVote[playerIndex] = !games[_roomId].playerPauseVote[playerIndex];
        if(games[_roomId].playerPauseVote[playerIndex]){
            emit PlayerPaused(_roomId, (_useBurner?_player:msg.sender));
        } 

        // if all players voted to pause, set game paused
        if (games[_roomId].info.playersCount == _getPlayerPauseCount(_roomId)
            && !games[_roomId].info.gamePaused) 
        {
            games[_roomId].info.gamePaused = true;
            emit GamePaused(_roomId);
        } else {
            games[_roomId].info.gamePaused = false;
            emit GameUnPaused(_roomId);
        }

        return true;
    }

    function leaveGameB4start(uint256 _roomId) 
        external 
        whenNotPaused 
        gameNotStarted(_roomId)
        playerIsInGame(_roomId, msg.sender, false)
        returns (bool) 
    {   

        // get player id
        uint8 playerIndex = _getCallingPlayerId(_roomId, msg.sender, false)-1;
        if(playerIndex==0){
            _playerOneAbadonGame(_roomId);
            return true;
        }

        // return player funds
        (bool sent, ) = msg.sender.call{value: games[_roomId].info.minStake}("");
        require(sent, "E16");

        // Update gameroom info
        // decrement player count
        games[_roomId].info.playersCount--;
        games[_roomId].info.totalStaked -= games[_roomId].info.minStake;
        // Clear game arrays
        // set board tile occupant to 0
        games[_roomId].board[games[_roomId].positions[playerIndex]].occupantId = 0;
        // set player address to 0 in playerIds
        games[_roomId].playerIds[playerIndex] = address(0); // set player id
        // set player FT to 0 in playerFTs
        games[_roomId].playerFTs[playerIndex] = 0; // set player FT
        // remove player position
        games[_roomId].positions[playerIndex] = type(uint8).max;
        // set player alive
        games[_roomId].playerAlive[playerIndex] = false;
        // set player ready to false in playerReady
        games[_roomId].playerReady[playerIndex] = false;
        // set player pause vote to false in playerPauseVote
        games[_roomId].playerPauseVote[playerIndex] = false;

        // set player not in game
        playerInGame[msg.sender] = 0;

        return true;
    }

    function startGame(uint256 _roomId) 
        external 
        whenNotPaused 
        gameNotStarted(_roomId)
        enoughPlayers(_roomId)
        allPlayersReady(_roomId)
        gameNotAbandoned(_roomId)
        onlyGameCreator(_roomId)
        returns (bool) 
    {
        games[_roomId].info.hasStarted = true;
        // spawn items
        _spawnItems(_roomId);
        emit GameStarted(_roomId);
        return true;
    }

    function movePlayer(uint256 _roomId, Dir _dir, address _player, bool _useBurner) 
        external 
        whenNotPaused 
        gameStarted(_roomId)
        gameNotPaused(_roomId)
        gameNotEnded(_roomId)
        gameNotAbandoned(_roomId)
        playerIsInGame(_roomId, _player, _useBurner)
        playerIsAlive(_roomId,_player, _useBurner)
        allowedToUseBurner(_useBurner)
        returns (bool) 
    {
        // get player id
        uint8 playerIndex = _getCallingPlayerId(_roomId, _player, _useBurner)-1; //already checked by playerIsInGame

        // handle move with library
        _movePlayerDir(_roomId, playerIndex, _dir);

        // check if game is over then end game and distribute prize
        if (games[_roomId].info.playersCount == 1) {
            _endGame(_roomId);
        }

        games[_roomId].playerLastMoveTime[playerIndex] = block.timestamp;
        return true;
    }



}