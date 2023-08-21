import Phaser from 'phaser';
import { createPlayerAnims} from './anims/CreateAnims';
import Player from './characters/Player';
import Chest from './characters/Chest';
import './characters/Player'; //as typing
import './characters/Chest'; //as typing
import { GridControls } from './movement/GridControls';
import { GridPhysics } from './movement/GridPhysics';

class GameSceneFlat extends Phaser.Scene {
    private player1!: Player
    private player2!: Player
    private player3!: Player
    private player4!: Player
    private chest1!: Phaser.GameObjects.Sprite
    private gridControls!: GridControls
    private playerGridPhysics!: GridPhysics
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private scalefactor : number = 3
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

        const ground = map.createLayer('ground', tileset as Phaser.Tilemaps.Tileset,
        GameSceneFlat.TILE_SIZE*this.scalefactor, GameSceneFlat.TILE_SIZE*this.scalefactor
        )
        ground.scale = this.scalefactor


        this.player1 = this.add.player(
            1,1, 'hs-cyan', 'tile000.png', 'player1')
        this.player1.scale = this.scalefactor


        // enemy sprites
        this.player2 = this.add.player(
            8,1, 's-yellow', 'tile000.png', 'player2')
        this.player2.scale = this.scalefactor

        this.player3 = this.add.player(
            1,8, 'm-red', 'tile000.png', 'player3')
        this.player3.scale = this.scalefactor

        this.player4 = this.add.player(
            8,8, 'op-cyan', 'tile000.png', 'player4')
        this.player4.scale = this.scalefactor
        
        this.chest1 = this.add.chest(5,5, 'chest', 'tile000.png', 'chest1')

        this.playerGridPhysics = new GridPhysics(this.player1, map)
        // give control to player1 physics
        this.gridControls = new GridControls(this.playerGridPhysics)
        //console.log(Phaser.Math.Vector2.DOWN)
    }

    update(t:number, dt:number){
        this.gridControls.update(this.cursors)
        this.playerGridPhysics.update(dt)
    }

}

export default GameSceneFlat