import { Direction } from "../characters/Player";
import Player from "../characters/Player";
import { GridPhysics } from "./GridPhysics";

export class GridControls {
    constructor(
        //private input: Phaser.Input.InputPlugin,
        private gridPhysics: GridPhysics
        //private sprite: Player
    ) {}

    update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        //const cursors = this.input.keyboard.createCursorKeys();
        if (cursors.left.isDown) {
            this.gridPhysics.movePlayer(Direction.LEFT);
            // this.sprite.setVelocity(-100,0)
            // console.log(this.sprite.getPosition())
            // console.log(this.sprite.getCurrentGridPosition())
        } else if (cursors.right.isDown) {
            this.gridPhysics.movePlayer(Direction.RIGHT);
            // this.sprite.setVelocity(100,0)
            // console.log(this.sprite.getPosition())
            // console.log(this.sprite.getCurrentGridPosition())
        } else if (cursors.up.isDown) {
            this.gridPhysics.movePlayer(Direction.UP);
            // this.sprite.setVelocity(0,-100)
            // console.log(this.sprite.getPosition())
            // console.log(this.sprite.getCurrentGridPosition())
        } else if (cursors.down.isDown) {
            this.gridPhysics.movePlayer(Direction.DOWN);
            // this.sprite.setVelocity(0,100)
            // console.log(this.sprite.getPosition())
            // console.log(this.sprite.getCurrentGridPosition())
        } 
        // else {
        //     this.sprite.setVelocity(0,0)
        // }
    }
}