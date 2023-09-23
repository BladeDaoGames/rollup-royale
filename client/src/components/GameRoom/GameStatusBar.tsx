import React from 'react';
import {BsHourglassSplit, BsHandThumbsUpFill} from 'react-icons/bs';
import { CgUnavailable } from 'react-icons/cg';
import {FaPause, FaSkull} from 'react-icons/fa';
import {GiPodiumWinner} from 'react-icons/gi';
import { Tooltip } from 'flowbite-react';
import {useGameAndPlayerStatus} from '../../hooks/useGameAndPlayerStatus';
import { useAtomValue } from 'jotai';
import { createGameInfoAtom } from '../../atoms';
import { addressShortener } from '../../utils/addressShortener';


interface PlayerStatusIcon {
    playerId: number
    status: string
}

const PlayerStatusIcon = ({playerId, status}: PlayerStatusIcon )=>{
    return (
        <Tooltip content={`${status=="waiting"?"Waiting Player "+`${playerId}`
                :status=="ready"?"Player "+`${playerId} Ready`
                :status=="pause"?"Player "+`${playerId} Paused`
                :status=="dead"?"Player "+`${playerId} Dead`
                :status=="winner"?"Player "+`${playerId} is Winner!`
                :"Status NA"
                }`} 
                placement="bottom">
                    <div className={`
                    flex flex-row items-center
                    border rounded-md 
                    ${  
                        status=="winner"?
                        "bg-none border-prime2 text-prime2/80"
                        :
                        status=="dead"?
                        "bg-none border-purple-500/80 text-purple-500/80"
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
                            status=="winner"?
                            <GiPodiumWinner/>
                            :
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

const gameStatusMapper = {
    "prestart": "Pre-Start",
    "ongoing": "Game Started",
    "paused": "Paused",
    "ended": "Ended",
    "abandoned": "Abandoned"
}

const GameStatusBar = () => {
    const {gameStatus, playerStatus} = useGameAndPlayerStatus()
    const gameinfo = useAtomValue(createGameInfoAtom)

    if(import.meta.env.VITE_ENV=="dev")console.log("player status: ")
    if(import.meta.env.VITE_ENV=="dev")console.log(playerStatus)
    if(import.meta.env.VITE_ENV=="dev")console.log("game status")
    if(import.meta.env.VITE_ENV=="dev")console.log(gameStatus)
    return (
        <div className="flex flex-row
            justify-between items-center
            z-10 w-full
            ">

                {/* game status */}
                <div className="flex flex-row 
                justify-start items-center 
                text-white font-semibold text-base
                w-2/5 mx-2
                ">
                <span className="mr-2">{`${gameStatus=="ended"?"Winner:":"Game Status:"}`}</span> 
                <span className={`px-4 py-1 w-full
                    ${gameStatus=="prestart"?"bg-lightbeige text-background1":
                    gameStatus=="ongoing"?"bg-palegreen text-background1":
                    gameStatus=="paused"?"bg-prime1 text-background1":
                    gameStatus=="abandoned"? "bg-purple-500/80 text-background1":
                    "bg-prime2 text-background1"} 
                    rounded-lg
                    `}>{
                    gameStatus=="ended"?
                    addressShortener(gameinfo?.winner)??"0x0"
                    :gameStatusMapper[gameStatus as string]
                    }</span>
                </div>
                
                {/* players status */}
                <div className="flex flex-row
                justify-end items-center px-0
                ">
                <span className="text-white font-bold
                mx-2
                ">
                    Players Status: </span>
                
                <PlayerStatusIcon playerId={1} status={playerStatus[0]}/>
                <PlayerStatusIcon playerId={2} status={playerStatus[1]}/>
                <PlayerStatusIcon playerId={3} status={playerStatus[2]}/>
                <PlayerStatusIcon playerId={4} status={playerStatus[3]}/>
                

                </div>
            </div>
        )
}

export default GameStatusBar