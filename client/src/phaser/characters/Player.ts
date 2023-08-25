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

const Vector2 = Phaser.Math.Vector2;
type Vector2 = Phaser.Math.Vector2;

export default class Player extends Phaser.Physics.Arcade.Sprite {

    private direction: Direction = Direction.DOWN;
    private tilePos: Vector2;

    posB4contract!: Vector2;
    moveIntentPos!:Vector2;
    private boardMoveCount:number =0;
    directionForSmartContract: Direction = Direction.NONE;
    private alive:boolean=true;
    private renderMoveGuide:boolean=false;

    private originXoffset = GameScene.TILE_SIZE*GameScene.SCALEFACTOR;
    private originYoffset = GameScene.TILE_SIZE*GameScene.SCALEFACTOR;
    private offsetX = (GameScene.TILE_SIZE/ 2)*GameScene.SCALEFACTOR;
    private offsetY = GameScene.TILE_SIZE*GameScene.SCALEFACTOR; 
    private bodyOffset = 0//GameScene.TILE_SIZE/4 * GameScene.SCALEFACTOR// 4px from bottom of sprite (half of half of body)
    //static readonly inherentYoffset=GameScene.TILE_SIZE*GameScene.SCALEFACTOR; 

    private dirVec:Vector2[]=[Vector2.DOWN, Vector2.LEFT,Vector2.UP, Vector2.RIGHT,]
    private overlays:Phaser.GameObjects.Rectangle[]=[]
    
    entity: string

    constructor(scene: Phaser.Scene, x: number, y: number, 
        texture: string, frame: string | number, entity: string) {
        
        
        super(scene, x, y, texture, frame);
        //this.setOrigin(0.5, 0.5);
        // scene.add.existing(this);
        // scene.physics.add.existing(this);

        // the y-origin of the sprite is at its body's center (48px from bottom of sprite)
        // the x-origin is center of sprite (24px from left of sprite)
        // center of 1 tile of 16px and scale of 3 is 16/2 * 3 = 24
        // moving 1 tile is 16px * 3 = 48px
        // with scale of 3, player at 0,0 is at 0,48 (bottomCenter)
        this.contractSetPosition(x,y)
        
        // this.setPosition(
        //     this.scene?.ground?.tileToWorldX(x)+ this.offsetX,
        //     this.scene?.ground?.tileToWorldY(y)
        // );
        this.tilePos = new Phaser.Math.Vector2(x, y);
        this.entity = entity;
        this.setDepth(3);
        this.anims.play(this.entity+'-idle-down');
        // console.log("CURRENT GRID POSITION")
        // console.log(this.getCurrentGridPosition())
        // console.log(this.getAvailableMovesArray())
        //console.log('player tilePos at worldXY: '+ this.scene.ground.getTileAtWorldXY(x,y))
    }

    // preUpdate(t:number, dt:number) {
    //     super.preUpdate(t, dt);
    // }

    getAvailableMovesArray(): Vector2[]{
        const possibleMoves: Phaser.Math.Vector2[]=[]
        this.dirVec.forEach((v) => {
            const curX = this.getCurrentGridPosition().x;
            const curY = this.getCurrentGridPosition().y;
            const x = curX + v.x
            const y = curY + v.y
            if((x>=0)&&(x<=this.scene.maxTileX)&&
            (y>=0)&&(y<=this.scene.maxTileY))
            {   
                possibleMoves.push(new Vector2(x,y))
            }             
        });
        return possibleMoves;
    }

    getAvailableMovesTupleArray():number[][]{
        return this.getAvailableMovesArray().map((v)=>([v.x,v.y]))
    }

    isMoveAllowed(moveIntent: Vector2):boolean{
        return this.getAvailableMovesArray().some((el)=>{
            return JSON.stringify(el)===JSON.stringify(moveIntent)
        })
    }

    setMoveIntent(moveIntent:Vector2){
        if(!this.isMoveAllowed(moveIntent)) console.log("move not allowed")
        this.moveIntentPos.x = moveIntent.x
        this.moveIntentPos.y = moveIntent.y

        //get direction
        this.directionForSmartContract = this.computeMoveIntentDirection(
            this.moveIntentPos)
        
        return this.directionForSmartContract
    }

    computeMoveIntentDirection(moveIntent:Vector2){
        const DirX = moveIntent.x - this.posB4contract.x
        const DirY = moveIntent.y - this.posB4contract.y
        if((DirX==0)&&(DirY==1)){
            return Direction.DOWN
        }else if((DirX==-1)&&(DirY==0)){
            return Direction.LEFT
        }else if((DirX==0)&&(DirY==-1)){
            return Direction.UP
        }else if((DirX==1)&&(DirY==0)){
            return Direction.RIGHT
        }else{
            return Direction.NONE
        }
    }

    contractSetPosition(x:number, y:number){
        this.setVisible(this.alive)
        this.setPosition(
            this.scene?.ground?.tileToWorldX(x)+ this.offsetX,
            this.scene?.ground?.tileToWorldY(y)
        )
        this.tilePos=this.scene.ground.worldToTileXY(this.x, this.y)
        this.posB4contract=this.scene.ground.worldToTileXY(this.x, this.y)
        this.moveIntentPos=this.scene.ground.worldToTileXY(this.x, this.y)
        this.directionForSmartContract=Direction.NONE
        this.boardMoveCount=0

        //remove previous overlays
        this.overlays.forEach((o)=>{
            o.destroy()
        })
        this.overlays=[]

        //add square overlays for each possible move
        this.getAvailableMovesArray().forEach((v)=>{
            if(v!=null){
                this.overlays.push(this.scene?.add.rectangle(0,0,
                    GameScene.TILE_SIZE*GameScene.SCALEFACTOR,
                    GameScene.TILE_SIZE*GameScene.SCALEFACTOR,
                    0xffff00, 0.35
                    ).setOrigin(0,0).setPosition(
                        this.scene?.ground?.tileToWorldX(v.x),
                        this.scene?.ground?.tileToWorldY(v.y)
                    ).setVisible(this.renderMoveGuide)
                )
            }
        })

    }

    cancelMoveIntent(){
        this.contractSetPosition(this.posB4contract.x, this.posB4contract.y)
    }

    getPosition(): Vector2 {
        return this.getBottomCenter();
    }

    getCurrentGridPosition(): Vector2 {
        return this.scene.ground.worldToTileXY(this.x, this.y);
    }
    
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
    
    setTilePos(tilePosition: Vector2): void {
        this.tilePos = tilePosition.clone();
        console.log('player tile set to: '+ this.tilePos.x + ', ' + this.tilePos.y)
    }

    getBoardMoveCount():number{
        return this.boardMoveCount;
    }
    setBoardMoveCount(count:number):void{
        this.boardMoveCount = count;
    }
    
    spawnUserPlayer():void{
        this.alive=true
        this.renderMoveGuide=true
        this.cancelMoveIntent()
    }

    setPiecePosition(x:number, y:number):void{
        this.alive=true
        this.contractSetPosition(x,y)
    }

    removePiece():void{
        this.alive = false
        this.renderMoveGuide=false
        this.cancelMoveIntent()
    }

}

Phaser.GameObjects.GameObjectFactory.register('player', 
    function (this: Phaser.GameObjects.GameObjectFactory, x: number, y: number, 
        texture: string, frame: string | number,  entity: string) {
	
        var sprite = new Player(this.scene, x, y, texture, frame, entity)

        this.displayList.add(sprite)
        this.updateList.add(sprite)

        //this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

        // sprite.body.setSize(sprite.width * 0.5, sprite.height * 0.8)

        return sprite
})