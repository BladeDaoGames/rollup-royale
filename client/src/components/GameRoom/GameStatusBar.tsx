import React from 'react';
import {BsHourglassSplit, BsHandThumbsUpFill} from 'react-icons/bs';
import { CgUnavailable } from 'react-icons/cg';
import {FaPause, FaSkull} from 'react-icons/fa';
import { Tooltip } from 'flowbite-react';
import {useAtomValue} from 'jotai';
import {createGameInfoAtom, 
    createPlayerReadiness, 
    createPlayerAliveStatus,
    createPlayerPauseVote} from '../../atoms';
import { GameInfo } from './GameTypes';


interface PlayerStatusIcon {
    playerId: number
    status: string
}

const PlayerStatusIcon = ({playerId, status}: PlayerStatusIcon )=>{
    return (
        <Tooltip content={`Waiting Player ${playerId}`} 
                placement="bottom">
                    <div className={`
                    flex flex-row items-center
                    border rounded-md 
                    ${
                        status=="dead"?
                        "bg-none border-prime3 text-prime3"
                        :
                        status=="pause"?
                        "bg-alertred1 border-alertred1 text-background1"
                        :
                        status=="ready"?
                        "bg-palegreen border-palegreen text-background1"
                        :
                        status=="waiting"?
                        "bg-none border-prime1 text-prime1"
                        :
                        "bg-greyness border-greyness text-background1"
                    } 
                    h-8 py-1 px-2 mx-1
                    `}>
                        
                        {   
                            status=="dead"?
                            <FaSkull/>
                            :
                            status=="pause"?
                            <FaPause/>
                            :
                            status=="ready"?
                            <BsHandThumbsUpFill/>
                            :
                            status=="waiting"?
                            <BsHourglassSplit/>
                            :
                            <CgUnavailable/>
                        }
                        
                    </div>
        </Tooltip>
    )
}

interface PlayerStatusFunction {
    gameStatus: string
    ready: boolean
    pause: boolean
    alive: boolean
}
const playerStatusFunction = (gameStatus:string, ready:boolean, pause:boolean, alive:boolean)=>{
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
}

const gameStatusFunction = (gameinfo: GameInfo)=>{

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
}

const gameStatusMapper = {
    "prestart": "Pre-Start",
    "ongoing": "On-Going",
    "paused": "Paused",
    "ended": "Ended"
}

const GameStatusBar = () => {
    const gameInfo = useAtomValue(createGameInfoAtom)
    const ready = useAtomValue(createPlayerReadiness)
    const alive = useAtomValue(createPlayerAliveStatus)
    const pause = useAtomValue(createPlayerPauseVote)
    const gameStatus = gameStatusFunction(gameInfo as GameInfo)
    return (
        <div className="flex flex-row
            justify-between items-center
            z-20
            ">

                {/* game status */}
                <div className="flex flex-row 
                justify-start items-center 
                text-white font-semibold text-base
                ">
                <span className="mx-2">Game Status:</span> 
                <span className="px-4 py-1 
                    bg-lightbeige text-background1
                    rounded-lg
                    ">{gameStatusMapper[gameStatus as string]}</span>
                </div>
                
                {/* players status */}
                <div className="flex flex-row
                justify-end items-center px-0
                ">
                <span className="text-white font-bold
                mx-2
                ">
                    Players Status: </span>
                
                <PlayerStatusIcon playerId={1} status={playerStatusFunction(
                    gameStatus as string, ready[0], pause[0], alive[0])}/>
                <PlayerStatusIcon playerId={2} status={playerStatusFunction(
                    gameStatus as string, ready[1], pause[1], alive[1])}/>
                <PlayerStatusIcon playerId={3} status={playerStatusFunction(
                    gameStatus as string, ready[2], pause[2], alive[2])}/>
                <PlayerStatusIcon playerId={4} status={playerStatusFunction(
                    gameStatus as string, ready[3], pause[3], alive[3])}/>
                

                </div>
            </div>
        )
}

export default GameStatusBar