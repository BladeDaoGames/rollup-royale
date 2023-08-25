import Phaser from 'phaser';
import { createPlayerAnims} from './anims/CreateAnims';
import Player from './characters/Player';
import Chest from './characters/Chest';
import './characters/Player'; //as typing
import './characters/Chest'; //as typing
import { GridControls } from './movement/GridControls';
import { GridPhysics } from './movement/GridPhysics';
import { publishPhaserEvent } from './EventsCenter';

class GameSceneFlat extends Phaser.Scene {
    player1!: Player
    player2!: Player
    player3!: Player
    player4!: Player
    user!:Player
    ground!: Phaser.Tilemaps.TilemapLayer
    private chest1!: Phaser.GameObjects.Sprite
    private gridControls!: GridControls
    private userGridPhysics!: GridPhysics
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private scalefactor : number = 3
    readonly maxTileX = 9
    readonly maxTileY = 9
    private prevclicktime:number =new Date().getTime();
    static readonly SCALEFACTOR = 3;
    static readonly TILE_SIZE = 16;

    constructor(){
        super('GameSceneFlat')
        this.scalefactor = GameSceneFlat.SCALEFACTOR
    }

    preload(){
        this.load.image('tiles', '/tiles/groundtiles.png')
        this.load.tilemapTiledJSON('map10by10', '/maps/lr10by10.json')

        this.load.atlas('hs-cyan','/characters/hscyan.png', '/characters/hscyan.json')
        this.load.atlas('s-yellow', '/characters/syellow.png', '/characters/syellow.json')
        this.load.atlas('m-red', '/characters/mred.png', '/characters/mred.json')
        this.load.atlas('op-cyan', '/characters/opcyan.png', '/characters/opcyan.json')

        this.load.atlas('chest','/characters/chest.png', '/characters/chest.json')

        this.cursors= this.input.keyboard.createCursorKeys()
    }

    create(){
        this.input.mouse.disableContextMenu();
        createPlayerAnims(this.anims)
        const map = this.make.tilemap({key: 'map10by10'})
        const tileset = map.addTilesetImage('Pixelarium', 'tiles')

        this.ground = map.createLayer('ground', tileset as Phaser.Tilemaps.Tileset,
        GameSceneFlat.TILE_SIZE*this.scalefactor, GameSceneFlat.TILE_SIZE*this.scalefactor
        )
        this.ground.scale = this.scalefactor

        // create the players but set visible to false
        this.player1 = this.add.player(
            1,1, 'hs-cyan', 'tile000.png', 'player1')
        this.player1.scale = this.scalefactor
        // //this.player1.killPlayer()

        this.player2 = this.add.player(
            8,1, 's-yellow', 'tile000.png', 'player2')
        this.player2.scale = this.scalefactor
        //this.player2.killPlayer()

        this.player3 = this.add.player(
            1,8, 'm-red', 'tile000.png', 'player3')
        this.player3.scale = this.scalefactor
        //this.player3.killPlayer()

        this.player4 = this.add.player(
            8,8, 'op-cyan', 'tile000.png', 'player4')
        this.player4.scale = this.scalefactor
        
        this.chest1 = this.add.chest(5,5, 'chest', 'tile000.png', 'chest1')

        this.userGridPhysics = new GridPhysics(this.user, map)
        // give control to player1 physics
        //this.gridControls = new GridControls(this.userGridPhysics)
        //console.log(Phaser.Math.Vector2.DOWN)
        this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
            // //if is rightclick, then cancel move
            if(pointer.rightButtonReleased()){
                console.log("right clicked")
                //this.user.cancelMoveIntent()
                this.user.cancelMoveIntent()
                return
            }

            //else if left click
            //o. get move coordinates in Tile
            const { worldX, worldY } = pointer
            const targetGridTile = this.ground?.worldToTileXY(worldX, worldY)
            console.log(targetGridTile)
            //1. check to see if move is allowed
            if(this.user?.isMoveAllowed(targetGridTile)){
                console.log("moving player")
                //2. move player if allowed
                this.userGridPhysics?.movePlayer(
                    this.user?.setMoveIntent(targetGridTile)
                )
            }
            
            //trigger smart contract move
            publishPhaserEvent("playerMoveIntentConfirmed","")
            return 
        },this)

        // remember to clean up on Scene shutdown
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.input.off(Phaser.Input.Events.POINTER_UP)
        })
        publishPhaserEvent("playersLoaded", "no data")
    }

    setUserToPlayer(playerId:number){
        const playerArray = [
            this.player1, this.player2,
            this.player3, this.player4]
        this.user = playerArray[playerId];
        this.user.spawnUserPlayer()
        this.userGridPhysics.player = playerArray[playerId];
        console.log("user set to: "+(playerId+1))
    }
    contractSetPlayerLoc(x:number,y:number){
        this.user.contractSetPosition(x,y)
    }

    update(t:number, dt:number){
        //this.gridControls.update(this.cursors)
        this.userGridPhysics.update(dt)
    }

}

export default GameSceneFlat