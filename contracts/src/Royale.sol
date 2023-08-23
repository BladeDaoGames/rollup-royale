// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Royale is Ownable {

    uint8 public constant MAX_PLAYERS = 4;
    uint8 public constant MAP_WIDTH = 10;
    uint8 public constant MAP_HEIGHT = 10;
    uint8 public constant TILE_COUNT = MAP_WIDTH * MAP_HEIGHT;
    uint16 public starting_FT = 100;
    address public burnerWallet;
    bool public useBurnerWallet = true;
    //bool public allUseBurnerWallet = true;

    event GameCreated(uint256 indexed _roomId, address indexed _creator);
    event GameAbandoned(uint256 _roomId); //
    event GameStarted(uint256 _roomId);
    event PlayerJoined(uint256 indexed _roomId, address indexed _player);
    event PlayerToggleReady(uint256 _roomId, address _player);
    event PlayerPaused(uint256 _roomId, address _player);
    event PlayerUnPaused(uint256 _roomId, address _player);
    event GamePaused(uint256 _roomId);
    event GameUnPaused(uint256 _roomId);
    event PlayerMoved(uint256 _roomId, address _player, uint8 _destinationTile);
    event PlayerKilled(uint256 _roomId, address _player);
    event PlayerLeft(uint256 _roomId, address _player);
    event ItemSpawned(uint256 _roomId, uint8 _itemId, uint8 _tile);
    event GameEnded(uint256 indexed _roomId, address indexed _winner);
    event RewardSent(uint256 indexed _roomId, address indexed _winner, uint256 indexed _reward);

    constructor(address _burnerWallet) Ownable(msg.sender){
        burnerWallet = _burnerWallet;
        games.push(); //pad with a dummy game
        games[0].info.hasEnded = true; // set dummy game to end
    }

    //array of all game rooms
    GameRoom[] public games;
    bool public worldPaused = false;
    uint8 public houseFee = 2;
    mapping(address => uint256) public playerInGame;
    enum Dir { DOWN, LEFT, UP, RIGHT } //using numpad 0, 1, 2, 3

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

    /* Modifiers */
    /*
    E1 - World is paused
    E2 - Insufficient funds for transaction
    E3 - Player is already in a game
    E4 - Game player count full
    E5 - Game has already started
    E6 - Game has already ended
    E7 - Game has been abandoned
    E8 - Game has not started
    E9 - Not Enough Players in Game
    E10 - Not all players are ready
    E11 - Player not in this game
    E12 - Cannot find player's id in game
    E13 - Player is dead
    E14 - Move is Out Of Bounds
    E15 - Move is Obstructed
    E16 - Prize not sent, Funds Not SAFU.
    E17 - Msg sender not Allowed Burner Wallet
    E18 - Game is paused
    */

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Not valid address");
        _;
    }

    modifier worldFunctioning() {
        require(!worldPaused, "E1");
        _;
    }

    modifier enoughFunds(uint256 _fee, uint256 minStake) {
        require(msg.value >= minStake, "E2");
        _;
    }

    modifier playerNotInGame() {
        require(playerInGame[msg.sender] == 0, "E3");
        _;
    }

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

    // getters
    function _allPlayersAreReady(uint256 _roomId) internal view returns (bool) {
        for (uint8 i = 0; i < games[_roomId].info.playersCount; i++) {
            if (games[_roomId].playerReady[i] == false) {
                return false;
            }
        }
        return true;
    }

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


    // setters
    function setBurnerWallet(address _burnerWallet) public onlyOwner {
        burnerWallet = _burnerWallet;
    }

    function setUseBurnerWallet(bool _useBurnerWallet) public onlyOwner {
        useBurnerWallet = _useBurnerWallet;
    }

    // function setAllUseBurnerWallet(bool _allUseBurnerWallet) public onlyOwner {
    //     allUseBurnerWallet = _allUseBurnerWallet;
    // }

    function setStartingFT(uint16 _startingFT) public onlyOwner {
        starting_FT = _startingFT;
    }

    function toggleWorldPause() public onlyOwner {
        worldPaused = !worldPaused;
    }

    function setHouseFee(uint8 _houseFee) public onlyOwner {
        houseFee = _houseFee;
    }

    

    // internal utils
    function _getRandomTile(uint256 _roomId, uint256 _seed) internal view returns (uint8) {
        // get random number
        uint8 random = uint8(
                uint256(keccak256(
                    abi.encodePacked(
                        block.timestamp, 
                        block.prevrandao,
                        _seed
                        )
                        )) % TILE_COUNT
                    );

        // if tile is not a wall
        if (games[_roomId].board[random].isWall == false) {
            // return tile
            return random;
        } else {
            // else get another random tile
            return _getRandomTile(_roomId, _seed+8);
        }
    }

    function _getUnoccupiedTile(uint256 _roomId, uint256 _seed) internal view returns (uint8) {
        // get random tile
        uint8 random = _getRandomTile(_roomId, _seed);
        // if tile is unoccupied
        if (games[_roomId].board[random].occupantId == 0) {
            // return tile
            return random;
        } else {
            // else get another random tile
            return _getUnoccupiedTile(_roomId, _seed+8);
        }
    }

    function _spawnItems(uint256 _roomId) internal returns (bool) {
        // get item count in game
        uint8 itemCount = games[_roomId].info.itemCount;
        // get number of players alive
        uint8 playersAlive = games[_roomId].info.playersCount;
        // get number of items to spawn (1 less than number of players on board)
        uint8 itemsToSpawn = playersAlive - itemCount - 1;
        // correct if itemsToSpawn is negative
        itemsToSpawn = itemsToSpawn > 0 ? itemsToSpawn : 0;

        // for each item position in positions, look for empty item position to spawn item
        for (uint8 i = 4; i < MAX_PLAYERS*2-1; i++) {
            // if position is not max value
            if (games[_roomId].positions[i] == type(uint8).max) {
                // get random tile
                uint8 random = _getUnoccupiedTile(_roomId, i);
                // set tile to new item id
                games[_roomId].board[random].occupantId = i;
                // set position to tile index
                games[_roomId].positions[i] = random;
                
                // increment item count
                games[_roomId].info.itemCount++;
                emit ItemSpawned(_roomId, i+1, random);
                itemsToSpawn--;
                // if itemsToSpawn hits 0, break loop
                if (itemsToSpawn == 0) {
                    break;
                }
            }
        }
        return true;
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

    function _getItemFtDiff(uint8 _seed) internal view returns (int8){
        // get random number between -50 to 50
        int8 random = int8(int256(
                uint256(keccak256(
                    abi.encodePacked(
                        block.timestamp, 
                        block.prevrandao,
                        _seed
                        )
                        )) % 100)
                    ) - 50;
        return random;
    }

    function _updatePlayerFT(uint256 _roomId, uint8 _tile, uint8 _playerId, int8 _ftDiff) internal returns (uint16) {
        // get player ft
        uint16 playerFT = games[_roomId].playerFTs[_playerId-1];

        // get final ft
        int16 finalFT = int16(playerFT) + _ftDiff;
        finalFT = finalFT < 0 ? int16(int8(0)) : finalFT; // if final ft is less than 0, set to 0

        // set player ft
        games[_roomId].playerFTs[_playerId-1] = uint16(finalFT);

        // if finalFT is 0, player is dead
        if (finalFT == 0) {
            games[_roomId].playerAlive[_playerId-1] = false;
            games[_roomId].info.playersCount--;
            games[_roomId].board[_tile].occupantId = 0; // remove player from tile
        }

        return uint16(finalFT);
        
    }

    function _getBattleResults(uint256 _roomId, uint8 playerId, uint8 occupantId) internal view returns (uint8) {
        // get player ft
        uint16 playerFT = games[_roomId].playerFTs[playerId-1];
        // get occupant ft
        uint16 occupantFT = games[_roomId].playerFTs[occupantId-1];
        // get total FT
        uint16 totalFT = playerFT + occupantFT;

        // chance of player winning is playerFT / totalFT
        uint256 chance = _perCentDivide(uint256(playerFT), uint256(totalFT));

        // get random number between 1 to 100
        uint256 random = (uint256(keccak256(
                    abi.encodePacked(
                        block.timestamp, 
                        block.prevrandao,
                        _roomId,
                        playerId,
                        occupantId
                        )
                        )) % 100) + 1;
        
        // if random number is less than chance, player wins
        if (random <= chance) {
            return playerId;
        } else {
            return occupantId;
        }
    }

    function _perCentDivide(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "division by zero will result in infinity.");
        return (a * 1e18 * 100) / b;
    }

    function _returnFundsToAll(uint256 _roomId) 
        onlyGameCreator(_roomId)
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
        onlyGameCreator(_roomId)
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

    function _endGame(uint256 _roomId) internal returns (bool) {
        // set game has ended
        games[_roomId].info.hasEnded = true;
        
        // get winner address
        for (uint8 i=0; i<games[_roomId].playerAlive.length; i++) {
            if (games[_roomId].playerAlive[i] == true) {
                address winnerAddress = games[_roomId].playerIds[i];
                // emit game over event
                emit GameEnded(_roomId, winnerAddress);
                //send winner staked funds
                uint256 winnerFunds = games[_roomId].info.totalStaked * (100-houseFee) / 100;
                (bool sent, ) = winnerAddress.call{value: winnerFunds}("");
                require(sent, "E16");
                emit RewardSent(_roomId, winnerAddress, winnerFunds);
                break;
            }
        }

        return _bootAllPlayers(_roomId);
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

    // public functions
    function createGame(uint256 _minStake) external payable 
        worldFunctioning()
        enoughFunds(msg.value, _minStake) 
        playerNotInGame()
        returns (uint256)
    {
        GameRoom memory game;
        game.info.gameCreator = msg.sender;
        game.info.totalStaked = msg.value;
        game.info.playersCount = 1;
        game.info.minStake = _minStake;
        game.playerIds[0] = msg.sender;
        game.playerFTs[0] = starting_FT;
        game.playerAlive[0] = true;
        games.push(game);

        uint8 roomId = uint8(games.length - 1);

        //initialize all postions to max
        for (uint8 i = 0; i < MAX_PLAYERS*2-1; i++) {
            games[roomId].positions[i] = type(uint8).max; // max value means not on board
        }

        // set player in game
        playerInGame[msg.sender] = roomId; // assume game length always game room id

        // set player at top left corner of board
        uint8 x = MAP_WIDTH / 3;
        uint8 y = MAP_HEIGHT / 3;
        uint8 spawnTile = (x - 1) + ((y-1) * MAP_WIDTH);
        // set player spawn
        games[roomId].board[spawnTile].occupantId = 1;
        games[roomId].positions[0] = spawnTile;

        emit GameCreated(roomId, msg.sender);
        return roomId;
    }

    function joinGame(uint256 _roomId) external payable 
        worldFunctioning()
        playerNotInGame()
        joinable(_roomId)
    {   
        games[_roomId].info.totalStaked += msg.value; // add to total staked
        games[_roomId].info.playersCount++; // increment player count
        uint8 playerId = games[_roomId].info.playersCount; // get player id
        games[_roomId].playerIds[playerId-1] = msg.sender; // set player id
        games[_roomId].playerFTs[playerId-1] = starting_FT; // set player FT
        games[_roomId].playerAlive[playerId-1] = true; // set player Alive
        playerInGame[msg.sender] = _roomId; // set player in game

        uint8 x;
        uint8 y;
        uint8 spawnTile;

        // if player is 2 set player at bottom right corner of board
        if (playerId == 1) {
            x = MAP_WIDTH - (MAP_WIDTH / 3);
            y = MAP_HEIGHT - (MAP_HEIGHT / 3);
            spawnTile = (x - 1) + ((y-1) * MAP_WIDTH);
        }

        // if player is 3 set player at bottom left corner of board
        if (playerId == 2) {
            x = MAP_WIDTH / 3;
            y = MAP_HEIGHT - (MAP_HEIGHT / 3);
            spawnTile = (x - 1) + ((y-1) * MAP_WIDTH);
        }

        // if player is 4 set player at top right corner of board
        if (playerId == 3) {
            x = MAP_WIDTH - (MAP_WIDTH / 3);
            y = MAP_HEIGHT / 3;
            spawnTile = (x - 1) + ((y-1) * MAP_WIDTH);
        }

        // set player spawn
        games[_roomId].board[spawnTile].occupantId = playerId;
        games[_roomId].positions[playerId-1] = spawnTile;

        emit PlayerJoined(_roomId, msg.sender);
    }

    function toggleReady(uint256 _roomId, address _player, bool _useBurner) external 
        worldFunctioning()
        playerIsInGame(_roomId, _player, _useBurner)
        allowedToUseBurner(_useBurner)
    {
        // get player id
        uint8 playerId = _getCallingPlayerId(_roomId, _player, _useBurner);
        require(playerId>0, "E11");

        // toggle player ready
        games[_roomId].playerReady[playerId-1] = !games[_roomId].playerReady[playerId-1];
        emit PlayerToggleReady(_roomId, (_useBurner? _player:msg.sender));
    }


    function tooglePlayerPause(uint256 _roomId, address _player, bool _useBurner) external 
        worldFunctioning()
        playerIsInGame(_roomId, _player, _useBurner)
        allowedToUseBurner(_useBurner)
    {
        // get player id
        uint8 playerId = _getCallingPlayerId(_roomId, _player, _useBurner);
        require(playerId>0, "E11");
        // set player paused
        games[_roomId].playerPauseVote[playerId-1] = !games[_roomId].playerPauseVote[playerId-1];
        emit PlayerPaused(_roomId, (_useBurner?_player:msg.sender));

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
    }

    function leaveGame(uint256 _roomId) external 
        gameNotStarted(_roomId)
        playerIsInGame(_roomId, msg.sender, false)
        returns (bool) 
    {
        // return player funds
        (bool sent, ) = msg.sender.call{value: games[_roomId].info.minStake}("");
        require(sent, "E16");
        // decrement player count
        games[_roomId].info.playersCount--;
        // get player id
        uint8 playerId = _getCallingPlayerId(_roomId, msg.sender, false);
        require(playerId !=0, "E12");

        // set player address to 0 in playerIds
        games[_roomId].playerIds[playerId-1] = address(0); // set player id
        // set player FT to 0 in playerFTs
        games[_roomId].playerFTs[playerId-1] = 0; // set player FT

        // set player ready to false in playerReady
        games[_roomId].playerReady[playerId-1] = false;
        // set player pause vote to false in playerPauseVote
        games[_roomId].playerPauseVote[playerId-1] = false;

        // set board tile occupant to 0
        games[_roomId].board[games[_roomId].positions[playerId-1]].occupantId = 0;
        // remove player position
        games[_roomId].positions[playerId-1] = type(uint8).max;

        // set player not in game
        playerInGame[msg.sender] = 0;

        return true;
    }

    function startGame(uint256 _roomId) external
        worldFunctioning 
        enoughPlayers(_roomId)
        allPlayersReady(_roomId)
        gameNotStarted(_roomId)
        gameNotAbandoned(_roomId)
        onlyGameCreator(_roomId)
    {          
        // spawn items
        _spawnItems(_roomId);
        emit GameStarted(_roomId);
    }

    function movePlayer(uint256 _roomId, Dir _direction, address _player, bool _useBurner) external 
        worldFunctioning 
        gameStarted(_roomId)
        playerIsInGame(_roomId, _player, _useBurner)
        playerIsAlive(_roomId,_player, _useBurner)
        gameNotPaused(_roomId)
        gameNotEnded(_roomId)
        allowedToUseBurner(_useBurner)
    {   
        // get player id
        uint8 playerId = _getCallingPlayerId(_roomId, _player, _useBurner); //already checked by playerIsInGame
        
        // get player position
        uint8 playerPosition = games[_roomId].positions[playerId-1];

        // get new position
        uint8 newPosition = uint8(int8(playerPosition) + _getIndexDiffFromDirection(_direction));

        // revert if new position is out of bounds
        require(newPosition>=0 && newPosition <TILE_COUNT, "E14");

        // if playerPosition is at left edge of board and direction is left, revert
        if (playerPosition % MAP_WIDTH == 0 && _direction == Dir.LEFT) {
            require(newPosition % MAP_WIDTH != MAP_WIDTH - 1, "E14");
        }
        // if playerPosition is at right edge of board and direction is right, revert
        if (playerPosition % MAP_WIDTH == MAP_WIDTH - 1 && _direction == Dir.RIGHT) {
            require(newPosition % MAP_WIDTH != 0, "E14");
        }

        // revert if new position is a wall
        require(games[_roomId].board[newPosition].isWall == false, "E15");

        // if new position is not occupied
        if (games[_roomId].board[newPosition].occupantId == 0) {
            // set new position to player id
            games[_roomId].board[newPosition].occupantId = playerId;
            // set old position to 0
            games[_roomId].board[playerPosition].occupantId = 0;
            // set player position to new position
            games[_roomId].positions[playerId-1] = newPosition;
            emit PlayerMoved(_roomId, (_useBurner?_player:msg.sender), newPosition);

        } else if (games[_roomId].board[newPosition].occupantId > 3){ 
            // if new position is occupied by item
                // remove item position value
                games[_roomId].positions[
                    games[_roomId].board[newPosition].occupantId-1] = type(uint8).max;

                // if playerNewFT is 0, set Tile occupantId to 0 else set to player id
                if(_updatePlayerFT(
                    _roomId, newPosition, playerId, _getItemFtDiff(newPosition)
                    ) == 0)
                {
                    games[_roomId].board[newPosition].occupantId = 0;
                    games[_roomId].info.playersCount--; //decrement player count
                    emit PlayerKilled(_roomId,  (_useBurner?_player:msg.sender));
                }else{
                    games[_roomId].board[newPosition].occupantId = playerId;
                    emit PlayerMoved(_roomId, (_useBurner?_player:msg.sender), newPosition);
                }

                // reduce item count
                games[_roomId].info.itemCount--;

                // spawn new items
                _spawnItems(_roomId);

        } else if (games[_roomId].board[newPosition].occupantId <= 3) { 
            // if new position is occupied by player

                // get player id of occupant
                uint8 occupantId = games[_roomId].board[newPosition].occupantId;

                // if winnerId is playerId, set Occupan FT to 0 and set to dead
                if (_getBattleResults(_roomId, playerId, occupantId) == playerId) {
                    games[_roomId].playerFTs[occupantId-1] = 0;
                    games[_roomId].playerAlive[occupantId-1] = false;
                    games[_roomId].info.playersCount--; // reduce playercount
                    emit PlayerKilled(_roomId, games[_roomId].playerIds[occupantId-1]);
                    emit PlayerMoved(_roomId,  (_useBurner?_player:msg.sender), newPosition);
                } else {
                    // else set player FT to 0 and set to dead
                    games[_roomId].playerFTs[playerId-1] = 0;
                    games[_roomId].playerAlive[playerId-1] = false;
                    games[_roomId].info.playersCount--; // reduce playercount
                    emit PlayerKilled(_roomId,  (_useBurner?_player:msg.sender));
                }

        }

        // check if game is over then end game and distribute prize
        if (games[_roomId].info.playersCount == 1) {
            _endGame(_roomId);
        }

    }

    function abandonGame(uint256 _roomId) external 
        worldFunctioning()
        gameNotStarted(_roomId)
        gameNotAbandoned(_roomId)
        onlyGameCreator(_roomId)
        returns (bool) 
    {
        _returnFundsToAll(_roomId);
        _bootAllPlayers(_roomId);
        games[_roomId].info.gameAbandoned = true;
        emit GameAbandoned(_roomId);
        return true;
    }

}
