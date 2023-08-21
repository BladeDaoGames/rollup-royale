import Phaser from 'phaser';
import GameScene from '../GameSceneFlat';

declare global
{
	namespace Phaser.GameObjects
	{
		interface GameObjectFactory
		{
			player(x: number, y: number, 
                texture: string, frame: string | number,
                entity:string): Player
		}
	}
}

export enum Direction
    {
        DOWN="down", 
        LEFT="left", 
        UP="up", 
        RIGHT="right", 
        NONE = "none"
        //using numpad 0, 1, 2, 3, 4
    }


export default class Player extends Phaser.Physics.Arcade.Sprite {

    private direction: Direction = Direction.DOWN;
    private tilePos: Phaser.Math.Vector2
    private originXoffset = GameScene.TILE_SIZE*GameScene.SCALEFACTOR;
    private originYoffset = GameScene.TILE_SIZE*GameScene.SCALEFACTOR;
    private offsetX = (GameScene.TILE_SIZE/ 2)*GameScene.SCALEFACTOR;
    private offsetY = GameScene.TILE_SIZE*GameScene.SCALEFACTOR; 
    private bodyOffset = 0//GameScene.TILE_SIZE/4 * GameScene.SCALEFACTOR// 4px from bottom of sprite (half of half of body)
    //static readonly inherentYoffset=GameScene.TILE_SIZE*GameScene.SCALEFACTOR; 
    entity: string

    constructor(scene: Phaser.Scene, x: number, y: number, 
        texture: string, frame: string | number, entity: string) {
        
        
        super(scene, x, y, texture, frame);
        //this.setOrigin(0.5, 1);
        // scene.add.existing(this);
        // scene.physics.add.existing(this);

        // the y-origin of the sprite is at its body's center (48px from bottom of sprite)
        // the x-origin is center of sprite (24px from left of sprite)
        // center of 1 tile of 16px and scale of 3 is 16/2 * 3 = 24
        // moving 1 tile is 16px * 3 = 48px
        // with scale of 3, player at 0,0 is at 0,48 (bottomCenter)
        this.setPosition(
            this.originXoffset + this.offsetX + (
                x * GameScene.TILE_SIZE* GameScene.SCALEFACTOR),
            
            //originYoffset + offsetY
            this.originYoffset + this.bodyOffset + (
                y * GameScene.TILE_SIZE* GameScene.SCALEFACTOR),
            
            //0,0
        );
        this.tilePos = new Phaser.Math.Vector2(x, y);
        this.entity = entity;
        this.setDepth(3);
        this.anims.play(this.entity+'-idle-down');
        console.log('player position at:'+ this.getPosition().x + ', ' + this.getPosition().y)
    }

    // preUpdate(t:number, dt:number) {
    //     super.preUpdate(t, dt);
    // }

    getPosition(): Phaser.Math.Vector2 {
        return this.getBottomCenter();
    }

    getCurrentGridPosition(): Phaser.Math.Vector2 {
        const currentVector = this.getPosition();
        const currentX = currentVector.x;
        const currentY = currentVector.y;

        const gridX = Math.floor(
            ((currentX-this.originXoffset-this.offsetX) / (GameScene.TILE_SIZE* GameScene.SCALEFACTOR)));
        const gridY = Math.floor(
            ((currentY-this.originYoffset-this.offsetY-this.bodyOffset
                ) / (GameScene.TILE_SIZE* GameScene.SCALEFACTOR)));
        console.log(gridX)
        return new Phaser.Math.Vector2(gridX, gridY);
    }

    //already available
    // setPosition(position: Phaser.Math.Vector2): void {
    //     this.setPosition(position);
    // }
    
    stopAnimation(direction: Direction) {
        // const animationManager = this.anims.animationManager;
        // const standingFrame = animationManager.get(direction).frames[1].frame.name;
        // this.anims.stop();
        // this.setFrame(standingFrame);
        this.anims.play(this.entity+'-idle-down');
    }
    
    startAnimation(direction: Direction) {
        this.anims.play(this.entity+"-walk-"+direction.toLowerCase());
    }
    
    getTilePos(): Phaser.Math.Vector2 {
        return this.tilePos.clone();
    }
    
    setTilePos(tilePosition: Phaser.Math.Vector2): void {
        this.tilePos = tilePosition.clone();
        console.log('player tile set to: '+ this.tilePos.x + ', ' + this.tilePos.y)
    }

}

Phaser.GameObjects.GameObjectFactory.register('player', 
    function (this: Phaser.GameObjects.GameObjectFactory, x: number, y: number, 
        texture: string, frame: string | number,  entity: string) {
	
        var sprite = new Player(this.scene, x, y, texture, frame, entity)

        this.displayList.add(sprite)
        this.updateList.add(sprite)

        this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

        // sprite.body.setSize(sprite.width * 0.5, sprite.height * 0.8)

        return sprite
})