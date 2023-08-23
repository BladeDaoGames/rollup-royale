import React from 'react';
import { Tooltip } from 'flowbite-react';
import { addressShortener } from '../../utils/addressShortener';
import {useAtomValue} from 'jotai';
import {createGameInfoAtom, createPlayerFTs} from '../../atoms';
import { GameInfo } from './GameTypes';
import {useGameAndPlayerStatus} from '../../hooks/useGameAndPlayerStatus';


interface FtBar {
  playerId: number,
  ft: number,
  bgColor: string,
  textColor: string,
  gameStatus: string,
  playerStatus: string
}

const PlayerFTBar = ({playerId, ft, bgColor, textColor, gameStatus, playerStatus}: FtBar)=>{
    
    return(<div className={`${playerStatus=="unavailable"? "bg-greyness text-greyness":
            gameStatus!="prestart"&&playerStatus=="waiting"&&ft==0? "bg-greyness text-greyness":
            playerStatus=="dead"?  bgColor+"/50 "+textColor:
            bgColor+" "+textColor
        }
        flex justify-center
        `}>
          <Tooltip content={`${playerStatus=="unavailable"?"no player": 
            gameStatus!="prestart"&&playerStatus=="waiting"&&ft==0?"no player":
            "Player "+playerId+" FT"}`}>

            {`${gameStatus=="prestart"&&playerStatus=="waiting"&&ft==0?"join?" : 
              playerStatus=="waiting"&&ft==0?"XX" : 
              playerStatus=="unavailable"?"XX": 
              "P"+playerId+": "+ft}`}
          </Tooltip>
          </div>)
}

const FTstatusBar = () => {
  const gameInfo = useAtomValue(createGameInfoAtom)
  const playerFTs = useAtomValue(createPlayerFTs)
  const {gameStatus, playerStatus} = useGameAndPlayerStatus()

  return (
    <div className="
    flex flex-row justify-between items-center
    text-white font-semibold my-1 mt-2
    ">
    
    <div className="mx-2 w-2/5 pr-4
      flex justify-between items-center
    ">
      <span>Room Owner: </span> <span className="mx-1">
      {addressShortener(gameInfo?.gameCreator as string)}</span>
    </div>
    
    <div className="grid grid-flow-col flex-auto
    justify-stretch items-center mx-1
    rounded-md overflow-hidden
    ">
      <PlayerFTBar playerId={1} ft={playerFTs[0]} bgColor={"bg-prime3"} textColor={"text-white"} 
        gameStatus={gameStatus as string} playerStatus={playerStatus[0]} />
      <PlayerFTBar playerId={2} ft={playerFTs[1]} bgColor={"bg-yellow-300"} textColor={"text-gray-800"}
        gameStatus={gameStatus as string} playerStatus={playerStatus[1]} />
      <PlayerFTBar playerId={3} ft={playerFTs[2]} bgColor={"bg-palered"} textColor={"text-white"} 
        gameStatus={gameStatus as string} playerStatus={playerStatus[2]} />
      <PlayerFTBar playerId={4} ft={playerFTs[3]} bgColor={"bg-palegreen"} textColor={"text-gray-800"} 
        gameStatus={gameStatus as string} playerStatus={playerStatus[3]} />
    </div>

    </div>
  )
}

export default FTstatusBar