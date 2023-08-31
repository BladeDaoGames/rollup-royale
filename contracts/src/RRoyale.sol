// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./libraries/RoyaleBattleV1.sol";

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
    bool spawnDefault = true;

    //array of all game rooms
    RoyaleBattleV1.GameRoom[] public games;
    mapping(address => uint256) public playerInGame; //track player
    //enum Dir { DOWN, LEFT, UP, RIGHT }

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
                break;
            }
        }

        return _bootAllPlayers(_roomId);
    }

    // ===== VIEW FUNCTIONS =====


    // ===== SETTER FUNCTIONS =====


    // ===== GAME FUNCTIONS =====
    function createGame(uint256 _minStake) external payable 
        whenNotPaused
        enoughFunds(msg.value, _minStake) 
        playerNotInGame
        returns (uint256 gameId)
    {
        RoyaleBattleV1.GameRoom memory game;

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
        RoyaleBattleV1.spawnPlayer(roomId, games[roomId], 0);

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
        RoyaleBattleV1.spawnPlayer(_roomId, games[_roomId], playerIndex);
        
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
        RoyaleBattleV1.spawItems(_roomId, games[_roomId]);
        emit GameStarted(_roomId);
        return true;
    }

    function movePlayer(uint256 _roomId, RoyaleBattleV1.Dir _dir, address _player, bool _useBurner) 
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
        RoyaleBattleV1.movePlayerDir(_roomId, games[_roomId], playerIndex, _dir, MAP_WIDTH);

        // check if game is over then end game and distribute prize
        if (games[_roomId].info.playersCount == 1) {
            _endGame(_roomId);
        }

        games[_roomId].playerLastMoveTime[playerIndex] = block.timestamp;
        return true;
    }



}