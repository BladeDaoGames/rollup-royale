import React from 'react';
import { useAccount } from 'wagmi';
import {createPlayerIds, createGameInfoAtom} from '../../atoms';
import {useAtomValue} from 'jotai';
import { Progress, Tooltip } from 'flowbite-react';

const StakeAmtDiv = ({stakeamt})=>{
    return (<div className="flex
        justify-center items-center
        ">
            {stakeamt}</div>)
}

const StakedBar = () => {
    const {address} = useAccount()
    const gameinfo = useAtomValue(createGameInfoAtom)
    const playerIds = useAtomValue(createPlayerIds)
    const playerId = playerIds.indexOf(address?.toLowerCase() as string)
    const playerInGame = playerId>=0
    const playerColor= playerId==0?"bg-prime3":playerId==1?"bg-yellow-300":playerId==2?"bg-palered":
    playerId==3?"bg-palegreen":"bg-greyness"
    return (
        <div className="flex flex-row justify-start items-center
        text-white font-semibold my-1 mt-2
        ">

            {/* player indicator */}
            <div className="mx-2 mr-4 w-1/5
                flex justify-start items-center
                ">
                <span>You are: </span> 
                <span className={`mx-1 ml-2 w-full px-1 py-2
                rounded-lg text-center
                ${playerColor} text-background1
                `}>
                    {`${playerInGame?"Player"+playerId+1:"Spectator"}`}
                </span>
                </div>
            
            <div className="w-1/5 mx-0 px-0
            text-left
            ">
                Total Staked Gas:
            </div>

            <div className="grid grid-flow-col
                justify-stretch items-center 
                mx-0 w-1/6
                border border-white
                py-2 px-4
                text-right
                rounded-md overflow-hidden
                ">
                {gameinfo?.totalStaked}
            </div>

            
                <div 
                className="
                    flex flex-col justify-start items-start
                    px-2 py-1 ml-2 mr-1 grow
                    border border-white
                    rounded-md text-sm
                    relative
                    ">
                {/* <Tooltip content="Time to next Move"
                > */}
                    <div className="text-sm">Time To Next Move . . .</div>
                    <div className="mt-1 mr-1 mx-0 w-full h-2 
                    rounded-md overflow-hidden
                    bg-prime1/70 
                    "/>
                {/* </Tooltip> */}
                    
                </div>

        </div>
    )
}

export default StakedBar