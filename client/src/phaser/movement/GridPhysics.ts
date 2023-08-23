import { Direction } from "../characters/Player";
import Player from "../characters/Player";
import GameScene from "../GameSceneFlat";

const Vector2 = Phaser.Math.Vector2;
type Vector2 = Phaser.Math.Vector2;

export class GridPhysics {

    private movementDirectionVectors: {
        [key in Direction]?: Vector2;
    } = {
        [Direction.DOWN]: Vector2.DOWN,
        [Direction.LEFT]: Vector2.LEFT,
        [Direction.UP]: Vector2.UP,
        [Direction.RIGHT]: Vector2.RIGHT,
    }

    private movementDirection: Direction = Direction.NONE;

    private readonly speedPixelsPerSecond: number = (GameScene.TILE_SIZE 
                                                    * GameScene.SCALEFACTOR
                                                        * 2);
    private tileSizePixelsWalked: number = 0;

    private lastMovementIntent = Direction.NONE;

    constructor(
        private player: Player,
        private tileMap: Phaser.Tilemaps.Tilemap,
    ) {}
    
    // THERE IS NO TARGET POSITION. IT ONLY CHECKS IF UPDATE CROSSES BORDER FOR EACH MOVE
    // Player TilePos Does not matter if there is no blocking effects

    movePlayer(direction: Direction) {
        
        //ensure no more moves after first move intent
        if(this.player.getBoardMoveCount()!=0) return;

        this.lastMovementIntent = direction;
        if(this.isMoving()) return; //if direction key is held down, continue with update
        // if(this.isBlockingDirection(direction)){
        //     this.player.stopAnimation(direction);
        // } else {
        //     this.startMoving(direction);
        // }
        this.startMoving(direction);
    }

    update(delta: number) {
        if (this.isMoving()) {
            this.updatePlayerPosition(delta);
        }
        this.lastMovementIntent = Direction.NONE;
    }

    private isMoving(): boolean {
        return this.movementDirection != Direction.NONE;
    }

    directionToKey(direction: Direction): string {
        return direction.toLowerCase();
    }

    private startMoving(direction: Direction): void {
        this.player.anims.play(
            this.player.entity + '-walk-' + this.directionToKey(direction)
            );
        this.movementDirection = direction;
        this.updatePlayerTilePos();
    }

    private updatePlayerPosition(delta: number) {
        const pixelsToWalkThisUpdate = this.getPixelsToWalkThisUpdate(delta);
        if (!this.willCrossTileBorderThisUpdate(pixelsToWalkThisUpdate)) {
            this.movePlayerSprite(pixelsToWalkThisUpdate);
        } else if (this.shouldContinueMoving()) { //checks for this.movementDirection == this.lastMovementIntent
            this.movePlayerSprite(pixelsToWalkThisUpdate);
            this.updatePlayerTilePos();
        } else {
            this.movePlayerSprite(
                (GameScene.TILE_SIZE*GameScene.SCALEFACTOR) - this.tileSizePixelsWalked);
            this.stopMoving();
        }
    }

    private updatePlayerTilePos() {
        this.player.setTilePos(
            this.player
                .getTilePos()
                .add(this.movementDirectionVectors[
                    this.movementDirection] as Vector2
                    )
        );
    }

    private movePlayerSprite(pixelsToMove: number) {
        const directionVec = this.movementDirectionVectors[this.movementDirection].clone();
        const movementDistance = directionVec.multiply(new Vector2(pixelsToMove));
        
        // new position is based on offsets from origin this.player.x so need to adjust
        const newX = this.player.getPosition().x + movementDistance.x
        const newY = (this.player.getPosition().y - 
        (GameScene.TILE_SIZE*GameScene.SCALEFACTOR) + movementDistance.y)
        this.player.setPosition(newX,newY);
        this.tileSizePixelsWalked += pixelsToMove;
        this.tileSizePixelsWalked %= (GameScene.TILE_SIZE*GameScene.SCALEFACTOR);
    }

    private getPixelsToWalkThisUpdate(delta: number): number {
        const deltaInSeconds = delta / 1000;
        return this.speedPixelsPerSecond * deltaInSeconds;
    }

    private stopMoving(): void {
        this.player.stopAnimation(this.movementDirection);
        this.movementDirection = Direction.NONE;
        this.player.setBoardMoveCount(this.player.getBoardMoveCount()+1);
    }

    private willCrossTileBorderThisUpdate(
        pixelsToWalkThisUpdate: number
    ): boolean {
        return (
        this.tileSizePixelsWalked + pixelsToWalkThisUpdate >= (GameScene.TILE_SIZE*GameScene.SCALEFACTOR)
        );
    }

    private shouldContinueMoving(): boolean {
        return (
            // this.movementDirection == this.lastMovementIntent &&
            // !this.isBlockingDirection(this.lastMovementIntent)
            this.movementDirection == this.lastMovementIntent
        );
    }

    private isBlockingDirection(direction: Direction): boolean {
        return this.hasBlockingTile(this.tilePosInDirection(direction));
    }

    private tilePosInDirection(direction: Direction): Vector2 {
        return this.player
        .getTilePos()
        .add(this.movementDirectionVectors[direction] as Vector2);
    }

    private hasBlockingTile(pos: Vector2): boolean {
        if (this.hasNoTile(pos)) return true;
        return this.tileMap.layers.some((layer) => {
        const tile = this.tileMap.getTileAt(pos.x, pos.y, false, layer.name);
        return tile && tile.properties.collides;
        });
    }

    private hasNoTile(pos: Vector2): boolean {
        return !this.tileMap.layers.some((layer) =>
        this.tileMap.hasTileAt(pos.x, pos.y, layer.name)
        );
    }

}