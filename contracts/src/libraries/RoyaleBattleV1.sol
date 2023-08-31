// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


library RoyaleBattleV1 {
    uint8 public constant MAX_PLAYERS = 4;
    uint8 public constant MAP_WIDTH = 10;
    uint8 public constant MAP_HEIGHT = 10;
    uint8 public constant TILE_COUNT = MAP_WIDTH * MAP_HEIGHT;
    uint16 public constant starting_FT = 100;

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

    enum Dir { DOWN, LEFT, UP, RIGHT }

    event PlayerSpawned(uint256 _roomId, address _player, uint8 _tile);
    event ItemSpawned(uint256 _roomId, uint8 _itemId, uint8 _tile);
    event PlayerMoved(uint256 _roomId, address _player, uint8 _destinationTile);
    event PlayerKilled(uint256 _roomId, address _player);

    // ===== Calculated Views ===== 
    function getUnoccupiedTile(uint256 _roomId, GameRoom memory game) internal view returns (uint8) {
        // get random tile
        uint8 random = getRandomTile(_roomId, game);
        // if tile is unoccupied
        if (game.board[random].occupantId == 0) {
            // return tile
            return random;
        } else {
            // else get another random tile
            return getUnoccupiedTile(_roomId, game);
        }
    }

    function getIndexDiffFromDirection(Dir _direction, uint8 map_width) internal pure returns (int8){
        if (_direction == Dir.UP) {
            return int8(map_width);
        } else if (_direction == Dir.DOWN) {
            return int8(map_width) * -1;
        } else if (_direction == Dir.LEFT) {
            return -1;
        } else if (_direction == Dir.RIGHT) {
            return 1;
        } else {
            return 0;
        }
    }

    function getItemFtDiff() internal view returns (int8){
        // get random number between -50 to 50
        int8 random = int8(int256(getRandomUint256() % 100)) - 50;
        return random;
    }

    function getBattleResults(GameRoom memory game, uint8 playerIndex, uint8 occupantIndex) internal view returns (uint8) {
        // get player ft
        uint16 playerFT = game.playerFTs[playerIndex];
        // get occupant ft
        uint16 occupantFT = game.playerFTs[occupantIndex];
        // get total FT
        uint16 totalFT = playerFT + occupantFT;

        // chance of player winning is playerFT / totalFT
        uint256 chance = percentDivide(uint256(playerFT), uint256(totalFT));

        // get random number between 1 to 100
        uint256 random = (getRandomUint256() % 100) + 1;
        
        // if random number is less than chance, player wins
        if (random <= chance) {
            return playerIndex;
        } else {
            return occupantIndex;
        }
    }

    // ===== State Changes ===== 
    function spawnItem(uint256 _roomId, uint8 itemIndex, GameRoom storage game) internal returns (bool) {
        // get random tile
        uint8 random = getUnoccupiedTile(_roomId, game);
        // set tile to new item id
        game.board[random].occupantId = itemIndex+1;
        // set position to tile index
        game.positions[itemIndex] = random;
        
        // increment item count
        game.info.itemCount++;
        emit ItemSpawned(_roomId, itemIndex+1, random);
        return true;
    }

    function spawItems(uint256 _roomId, GameRoom storage game) internal returns (bool) {
        // get item count in game
        uint8 itemCount = game.info.itemCount;
        // get number of players alive
        uint8 playersAlive = game.info.playersCount;
        // get number of items to spawn (1 less than number of players on board)
        uint8 itemsToSpawn = playersAlive - itemCount - 1;
        // correct if itemsToSpawn is negative
        itemsToSpawn = itemsToSpawn > 0 ? itemsToSpawn : 0;

        // for each item position in positions, look for empty item position to spawn item
        for (uint8 i = 4; i < game.positions.length; i++) {
            // if position is max value (meaning it is empty)
            if (game.positions[i] == type(uint8).max) {
                spawnItem(_roomId, i, game);
                itemsToSpawn--;
                // if itemsToSpawn hits 0, break loop
                if (itemsToSpawn == 0) {
                    break;
                }
            }
        }
        return true;
    }

    function spawnPlayer(uint256 _roomId, GameRoom storage game, uint8 playerIndex) internal returns (uint8){
        // use random position when available
        uint8 spawnTile;
        if(playerIndex==0){
            spawnTile=22;
        }else if(playerIndex==1){
            spawnTile=77;
        }else if(playerIndex==2){
            emit PlayerSpawned(_roomId, game.playerIds[playerIndex], 27);
            spawnTile=27;
        }else if(playerIndex==3){
            emit PlayerSpawned(_roomId, game.playerIds[playerIndex], 72);
            spawnTile=72;
        }else{
            spawnTile=0;
        }
        // set player spawn
        game.board[spawnTile].occupantId = playerIndex+1;
        game.positions[playerIndex] = spawnTile;
        emit PlayerSpawned(_roomId, game.playerIds[playerIndex], spawnTile);
        return spawnTile;
    }

    function killPlayer(uint256 _roomId, GameRoom storage game, uint8 playerIndex) internal returns (uint8){
        game.playerAlive[playerIndex] = false;
        game.board[game.positions[playerIndex]].occupantId = 0; // remove player from tile
        game.positions[playerIndex] = type(uint8).max; //reset position to null
        game.info.playersCount--;
        emit PlayerKilled(_roomId,  game.playerIds[playerIndex]);
        return playerIndex;
    }

    function updatePlayerFT(uint256 _roomId, GameRoom storage game, uint8 playerIndex, int8 _ftDiff) internal returns (uint16) {
        // get player ft
        uint16 playerFT = game.playerFTs[playerIndex];
        // get final ft
        int16 finalFT = int16(playerFT) + _ftDiff;
        finalFT = finalFT < 0 ? int16(int8(0)) : finalFT; // if final ft is less than 0, set to 0
        // if finalFT is 0, kill player
        if (finalFT == 0) {
            killPlayer(_roomId, game, playerIndex);
        } else {
            // set player ft
            game.playerFTs[playerIndex] = uint16(finalFT);
        }
        return uint16(finalFT);
    }

    function movePlayerToTileWithoutDying(uint256 _roomId, GameRoom storage game, uint8 playerIndex, uint8 newPosition) 
        internal returns (uint8) {
        // set old position to 0
        game.board[
            game.positions[playerIndex]
        ].occupantId = 0;

        // set new position to player id
        game.board[newPosition].occupantId = playerIndex+1;
        
        // set player position to new position
        game.positions[playerIndex] = newPosition;

        emit PlayerMoved(_roomId, game.playerIds[playerIndex], newPosition);

        return newPosition;
    }

    function playerInteractWithItem(uint256 _roomId, GameRoom storage game, uint8 playerIndex, uint8 itemIndex) 
        internal returns (uint16) 
    {   
        // get item position
        uint8 newPosition = game.positions[itemIndex];
        // remove item position from positions array
        game.positions[itemIndex] = type(uint8).max;

        game.board[newPosition].occupantId = 0; //remove item from tile
        // reduce item count
        game.info.itemCount--;

        // if playerNewFT is not 0, move player to the tile
        // NOTE: updatePlayerFT will update player position/board and alive if he is killed
        uint16 finalFT = updatePlayerFT(_roomId, game, playerIndex, getItemFtDiff());

        if(finalFT != 0){movePlayerToTileWithoutDying(_roomId, game, playerIndex, newPosition);}
    
        // spawn new items
        spawItems(_roomId, game);
        return finalFT;
    }

    function playerInteractWithPlayer(uint256 _roomId, GameRoom storage game, uint8 playerIndex, uint8 occupantIndex)
        internal returns (uint8)
    {
        // get occupant position
        uint8 newPosition = game.positions[occupantIndex];
        
        // if winnerId is playerId, set Occupan FT to 0 and set to dead
        if (getBattleResults(game, playerIndex, occupantIndex) == playerIndex) {
            // kill occupant
            killPlayer(_roomId, game, occupantIndex);
            // move player to new tile
            movePlayerToTileWithoutDying(_roomId, game, playerIndex, newPosition);
            return playerIndex;
        } else {
            killPlayer(_roomId, game, playerIndex);
            return occupantIndex;
        }
    }

    function movePlayerDir(uint256 _roomId, GameRoom storage game, uint8 playerIndex, Dir _dir, uint8 map_width) 
        internal returns (bool)
    {
        // get player position
        uint8 playerPosition = game.positions[playerIndex];

        // calculate new position
        uint8 newPosition = uint8(int8(playerPosition) + getIndexDiffFromDirection(_dir, map_width));
        // revert if new position is out of bounds
        require(newPosition>=0 && newPosition <game.board.length, "E14");


        // if playerPosition is at left edge of board and direction is left, revert
        if (playerPosition % map_width == 0 && _dir == Dir.LEFT) {
            require(newPosition % map_width != map_width - 1, "E14");
        }
        // if playerPosition is at right edge of board and direction is right, revert
        if (playerPosition % map_width == map_width - 1 && _dir == Dir.RIGHT) {
            require(newPosition % map_width != 0, "E14");
        }

        // revert if new position is a wall
        require(game.board[newPosition].isWall == false, "E15");

        // if new position is not occupied
        if (game.board[newPosition].occupantId == 0) {
            movePlayerToTileWithoutDying(_roomId, game, playerIndex, newPosition);
        // if new position is occupied by item
        } else if (game.board[newPosition].occupantId > 4){ 
            playerInteractWithItem(_roomId, game, playerIndex, game.board[newPosition].occupantId-1);
        } else if (game.board[newPosition].occupantId <= 4) { 
            // if new position is occupied by player
            playerInteractWithPlayer(_roomId, game, playerIndex, game.board[newPosition].occupantId-1); // returns winner index
        }

        return true;
    }

    // Math Utils
    function percentDivide(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "division by zero will result in infinity.");
        return (a * 1e18 * 100) / b;
    }

    function getRandomUint256() internal view returns (uint256) {

        //TODO: Use Alt Layer VRF here when available

        return uint256(keccak256(
                    abi.encodePacked(
                        block.timestamp, 
                        block.prevrandao,
                        "seed88"
                        )
                    ));
    }

    function getRandomTile(uint256 _roomId, GameRoom memory game) internal view returns (uint8) {
        // get random number
        uint8 random = uint8(getRandomUint256() % game.board.length);

        // if tile is not a wall
        if (game.board[random].isWall == false) {
            // return tile
            return random;
        } else {
            // else get another random tile
            return getRandomTile(_roomId, game);
        }
    }




}