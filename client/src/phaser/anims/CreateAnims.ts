import Phaser from 'phaser';

const createPlayerAnims = (anims: Phaser.Animations.AnimationManager) => {
    anims.create({
        key: 'chest-idle-down',
        frames: anims.generateFrameNames(
            'chest', {prefix: 'tile00', start: 0, end: 8, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });
    
    anims.create({
        key: 'player1-walk-down',
        frames: anims.generateFrameNames(
            'hs-cyan', {prefix: 'tile00', start: 0, end: 4, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player1-walk-right',
        frames: anims.generateFrameNames(
            'hs-cyan', {prefix: 'tile0', start: 48, end: 52, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player1-walk-up',
        frames: anims.generateFrameNames(
            'hs-cyan', {prefix: 'tile', start: 96, end: 100, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player1-walk-left',
        frames: anims.generateFrameNames(
            'hs-cyan', {prefix: 'tile', start: 144, end: 148, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player1-idle-down',
        frames: anims.generateFrameNames(
            'hs-cyan', {prefix: 'tile', start: 5, end: 23, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 4
    });

    // Player 2
    anims.create({
        key: 'player2-walk-down',
        frames: anims.generateFrameNames(
            's-yellow', {prefix: 'tile00', start: 0, end: 4, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player2-walk-right',
        frames: anims.generateFrameNames(
            's-yellow', {prefix: 'tile0', start: 48, end: 52, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player2-walk-up',
        frames: anims.generateFrameNames(
            's-yellow', {prefix: 'tile', start: 96, end: 100, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player2-walk-left',
        frames: anims.generateFrameNames(
            's-yellow', {prefix: 'tile', start: 144, end: 148, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player2-idle-down',
        frames: anims.generateFrameNames(
            's-yellow', {prefix: 'tile', start: 5, end: 23, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 4
    });

    // Player 3
    anims.create({
        key: 'player3-walk-down',
        frames: anims.generateFrameNames(
            'm-red', {prefix: 'tile00', start: 0, end: 4, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player3-walk-right',
        frames: anims.generateFrameNames(
            'm-red', {prefix: 'tile0', start: 48, end: 52, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player3-walk-up',
        frames: anims.generateFrameNames(
            'm-red', {prefix: 'tile', start: 96, end: 100, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player3-walk-left',
        frames: anims.generateFrameNames(
            'm-red', {prefix: 'tile', start: 144, end: 148, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player3-idle-down',
        frames: anims.generateFrameNames(
            'm-red', {prefix: 'tile', start: 5, end: 23, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 4
    });

    // Player 4
    anims.create({
        key: 'player4-walk-down',
        frames: anims.generateFrameNames(
            'op-cyan', {prefix: 'tile00', start: 0, end: 4, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player4-walk-right',
        frames: anims.generateFrameNames(
            'op-cyan', {prefix: 'tile0', start: 48, end: 52, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player4-walk-up',
        frames: anims.generateFrameNames(
            'op-cyan', {prefix: 'tile', start: 96, end: 100, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player4-walk-left',
        frames: anims.generateFrameNames(
            'op-cyan', {prefix: 'tile', start: 144, end: 148, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 8
    });

    anims.create({
        key: 'player4-idle-down',
        frames: anims.generateFrameNames(
            'op-cyan', {prefix: 'tile', start: 5, end: 23, zeroPad:3, suffix: '.png'}),
        repeat: -1,
        frameRate: 4
    });

};

export {
    createPlayerAnims
}