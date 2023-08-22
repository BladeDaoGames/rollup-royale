import {useCallback} from 'react';
import {useAtomValue} from 'jotai';
import {createGameInfoAtom, 
    createPlayerReadiness, 
    createPlayerAliveStatus,
    createPlayerPauseVote } from '../atoms';
import { GameInfo } from '../components/GameRoom/GameTypes';

export const useGameAndPlayerStatus = () => {
    console.log("getting game and player status...")
    const gameInfo = useAtomValue(createGameInfoAtom)
    const ready = useAtomValue(createPlayerReadiness)
    const alive = useAtomValue(createPlayerAliveStatus)
    const pause = useAtomValue(createPlayerPauseVote)
    
    const gameStatusFunction = useCallback((gameinfo: GameInfo)=>{
        const {hasStarted, gamePaused, hasEnded} = gameinfo
        if(!hasStarted && !gamePaused && !hasEnded){
            return "prestart"
        }else if(hasStarted && !gamePaused && !hasEnded){
            return "ongoing"
        }else if(hasStarted && gamePaused && !hasEnded){
            return "paused"
        }else if(hasStarted && hasEnded){
            return "ended"
        }
        return ""    
    },[gameInfo])
    const gameStatus = gameStatusFunction(gameInfo as GameInfo)
    console.log("THE GAME STATUS")
    console.log(gameStatus)
    const playerStatusFunction = useCallback((gameStatus:string, ready:boolean, pause:boolean, alive:boolean)=>{
        if(gameStatus=="prestart" && !ready){
            return "waiting"
        }else if(gameStatus=="prestart"&&ready){
            return "ready"
        }else if(gameStatus=="ongoing"&&!alive){
            return "dead"
        }else if(gameStatus=="ongoing"&&pause){
            return "pause"
        }else if(gameStatus=="ended"&&!alive){
            return "dead"
        }else{
            return "unavailable"
        }
        return "unavailable"
    },[gameStatus, ready, pause, alive])
    const playerStatus = alive.map((gs, i)=>{ return playerStatusFunction(gameStatus, ready[i], pause[i], alive[i])})
    return {gameStatus, playerStatus}
}