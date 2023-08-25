import Phaser from 'phaser';
import GameScene from '../GameSceneFlat';

declare global
{
	namespace Phaser.GameObjects
	{
		interface GameObjectFactory
		{
			chest(x: number, y: number, 
                texture: string, frame: string | number,
                entity:string): Chest
		}
	}
}


export default class Chest extends Phaser.Physics.Arcade.Sprite {

    private tilePos: Phaser.Math.Vector2
    private alive:boolean=true;
    private originXoffset = GameScene.TILE_SIZE*GameScene.SCALEFACTOR;
    private originYoffset = GameScene.TILE_SIZE*GameScene.SCALEFACTOR;
    private offsetX = (GameScene.TILE_SIZE/ 2)*GameScene.SCALEFACTOR;
    private offsetY = GameScene.TILE_SIZE*GameScene.SCALEFACTOR; 
    private bodyOffset = GameScene.TILE_SIZE/4 * GameScene.SCALEFACTOR// 4px from bottom of sprite (half of half of body)
    //static readonly inherentYoffset=GameScene.TILE_SIZE*GameScene.SCALEFACTOR; 
    entity: string

    constructor(scene: Phaser.Scene, x: number, y: number, 
        texture: string, frame: string | number, entity: string) {
        
        
        super(scene, x, y, texture, frame);

        // this.setPosition(
        //     this.originXoffset + this.offsetX + (
        //         x * GameScene.TILE_SIZE* GameScene.SCALEFACTOR),
        //     this.originYoffset + this.bodyOffset + (
        //         y * GameScene.TILE_SIZE* GameScene.SCALEFACTOR),
        // );

        this.contractSetPosition(x,y)
        
        this.entity = entity;
        this.setDepth(2);
        //this.anims.play(this.entity+'-idle-down');
        this.anims.play('chest-idle-down');
    }

    contractSetPosition(x:number, y:number){
        this.alive=true
        this.setVisible(this.alive)
        this.setPosition(
            this.scene?.ground?.tileToWorldX(x)+ this.offsetX,
            this.scene?.ground?.tileToWorldY(y)+this.bodyOffset
        )
    }

    setPiecePosition(x:number, y:number):void{
        this.contractSetPosition(x,y)
    }

    removePiece():void{
        this.alive=false
        this.setVisible(this.alive)
    }

}

Phaser.GameObjects.GameObjectFactory.register('chest', 
    function (this: Phaser.GameObjects.GameObjectFactory, x: number, y: number, 
        texture: string, frame: string | number,  entity: string) {
	
        var sprite = new Chest(this.scene, x, y, texture, frame, entity)

        this.displayList.add(sprite)
        this.updateList.add(sprite)

        this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

        // sprite.body.setSize(sprite.width * 0.5, sprite.height * 0.8)

        return sprite
})