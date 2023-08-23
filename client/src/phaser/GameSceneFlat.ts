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
    private player1!: Player
    private player2!: Player
    private player3!: Player
    private player4!: Player
    ground!: Phaser.Tilemaps.TilemapLayer
    private chest1!: Phaser.GameObjects.Sprite
    private gridControls!: GridControls
    private playerGridPhysics!: GridPhysics
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
        createPlayerAnims(this.anims)
        const map = this.make.tilemap({key: 'map10by10'})
        const tileset = map.addTilesetImage('Pixelarium', 'tiles')

        this.ground = map.createLayer('ground', tileset as Phaser.Tilemaps.Tileset,
        GameSceneFlat.TILE_SIZE*this.scalefactor, GameSceneFlat.TILE_SIZE*this.scalefactor
        )
        this.ground.scale = this.scalefactor


        this.player1 = this.add.player(
            0,0, 'hs-cyan', 'tile000.png', 'player1')
        this.player1.scale = this.scalefactor


        // enemy sprites
        // this.player2 = this.add.player(
        //     8,1, 's-yellow', 'tile000.png', 'player2')
        // this.player2.scale = this.scalefactor

        // this.player3 = this.add.player(
        //     1,8, 'm-red', 'tile000.png', 'player3')
        // this.player3.scale = this.scalefactor

        // this.player4 = this.add.player(
        //     8,8, 'op-cyan', 'tile000.png', 'player4')
        // this.player4.scale = this.scalefactor
        
        this.chest1 = this.add.chest(5,5, 'chest', 'tile000.png', 'chest1')

        this.playerGridPhysics = new GridPhysics(this.player1, map)
        // give control to player1 physics
        //this.gridControls = new GridControls(this.playerGridPhysics)
        //console.log(Phaser.Math.Vector2.DOWN)
        this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
            // record first click time
            // if time elapsed smaller than 350 milliseconds, considered as double click
            if((new Date().getTime() - this.prevclicktime)<350) {
                console.log("db clicked")

                //confirmed move
                //o. get move coordinates in Tile
                const { worldX, worldY } = pointer
                const targetGridTile = this.ground?.worldToTileXY(worldX, worldY)
                //1. check to see if move is allowed
                this.playerGridPhysics.movePlayer(
                    this.player1.setMoveIntent(targetGridTile)
                )


                //trigger smart contract move
                publishPhaserEvent("playerMoveIntentConfirmed", targetGridTile)
            }
            this.prevclicktime = new Date().getTime(); //cleanup clicktime
            
            // if single click, cancel any move
            this.player1.cancelMoveIntent();
            console.log("move canceled")

            // const { worldX, worldY } = pointer // coordinate system
            // const playerGridTile = this.ground?.worldToTileXY(this.player1.x, this.player1.y)
            // 

            // // trigger external event
            // 
        })

        // remember to clean up on Scene shutdown
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.input.off(Phaser.Input.Events.POINTER_UP)
        })
    }

    testExternalTrigger(){
        console.log("external trigger received")
    }

    update(t:number, dt:number){
        //this.gridControls.update(this.cursors)
        this.playerGridPhysics.update(dt)
    }

}

export default GameSceneFlat