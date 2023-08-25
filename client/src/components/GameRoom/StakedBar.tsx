import React, { useMemo } from 'react';
import { useAccount } from 'wagmi';
import {createPlayerIds, createGameInfoAtom} from '../../atoms';
import {useAtomValue} from 'jotai';
import { TxnBatchTimer} from './TxnBatchTimer';

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
    return useMemo(()=>
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
                    {`${playerInGame?"Player"+(parseInt(playerId)+1):"Spectator"}`}
                </span>
                </div>
            
            <div className="w-1/5 mx-0 px-0
            text-right pr-3.5
            ">
                Total Staked Gas:
            </div>

            <div className="grid grid-flow-col
                justify-stretch items-center 
                mx-0 w-1/6
                border border-palered
                py-2 px-4
                text-right
                rounded-md overflow-hidden
                ">
                {gameinfo?.totalStaked}
            </div>

            
                <TxnBatchTimer />

        </div>
    ,[gameinfo,address,playerIds])
}

export default StakedBar