import {BsHourglassSplit, BsHandThumbsUpFill} from 'react-icons/bs';
import { CgUnavailable } from 'react-icons/cg';
import {FaPause, FaSkull} from 'react-icons/fa';
import { Tooltip } from 'flowbite-react';
import {useGameAndPlayerStatus} from '../../hooks/useGameAndPlayerStatus';


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
    "ended": "Ended"
}

const GameStatusBar = () => {
    const {gameStatus, playerStatus} = useGameAndPlayerStatus()

    if(import.meta.env.VITE_ENV=="dev")console.log("player status: ")
    if(import.meta.env.VITE_ENV=="dev")console.log(playerStatus)
    if(import.meta.env.VITE_ENV=="dev")console.log("game status")
    if(import.meta.env.VITE_ENV=="dev")console.log(gameStatus)
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
                <span className={`px-4 py-1 w-full
                    ${gameStatus=="prestart"?"bg-lightbeige text-background1":
                    gameStatus=="ongoing"?"bg-palegreen text-background1":
                    gameStatus=="paused"?"bg-prime1 text-background1"
                    :"bg-prime3 text-background1"} 
                    rounded-lg
                    `}>{gameStatusMapper[gameStatus as string]}</span>
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