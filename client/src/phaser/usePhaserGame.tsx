import React, {useEffect, useRef} from 'react';
import Phaser from 'phaser';

const usePhaserGame = (config: Phaser.Types.Core.GameConfig) => {
    const phaserGameRef = useRef<Phaser.Game | null>(null);
    useEffect(() => {
        if (phaserGameRef.current){
        return;
        }

        phaserGameRef.current =  new Phaser.Game(config);

        return () => {
            phaserGameRef.current?.destroy(true);
            phaserGameRef.current = null;
        };
    }, []/* only run once; config ref elided on purpose */);
    
    return phaserGameRef.current;
}

export default usePhaserGame