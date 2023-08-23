import React from 'react';
import { Button, Tooltip } from 'flowbite-react';
import { BsPlayFill, BsFillPauseFill, BsFillHandThumbsUpFill} from 'react-icons/bs';
import {BiMoneyWithdraw} from 'react-icons/bi';
import { GiHighPunch, GiEntryDoor, GiExitDoor} from 'react-icons/gi';
import { Spinner } from 'flowbite-react';

import {useAtomValue} from 'jotai';
import {createGameInfoAtom, createPlayerIds,
    createPlayerReadiness
} from '../../atoms';

import { useAccount, useContractWrite } from 'wagmi';
import RoyaleABI from '../../config/abis/Royale.json';
import {ROYALE_ADDRESS} from '../../config/constants';
import { parseEther } from 'viem';

export const StakeAndEnterButton = ({room}:{room: number}) => {
    const {address} = useAccount()
    const gameinfo = useAtomValue(createGameInfoAtom)
    const playerIds = useAtomValue(createPlayerIds)
    const { data, isLoading, isSuccess, write: writeJoinGame } = useContractWrite({
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'joinGame',
    })

    const playerInGame = playerIds.includes(address?.toLowerCase()??"unknown")

    return (
        <Tooltip content="~ Stake and Enter Game ~">
            <Button 
            disable={playerInGame}
            className={`flex flex-row items-center justify-center py-2 
            border rounded-lg  
            ${
                playerInGame?
            "border-prime2 text-prime2 bg-background1 hover:text-background1 hover:bg-prime2"
                :
            "border-prime2 text-background1 bg-prime2 hover:text-prime2 hover:bg-background1/5"
            }
            `}
            onClick={()=>{
                writeJoinGame({
                    args: [room],
                    value: parseEther(gameinfo?.minStake.toString()??"0"),
                })
            }}
            >
                {   isLoading?<Spinner color="failure"/>:
                    <>
                        <BiMoneyWithdraw className="w-8 h-6"/>
                        <GiEntryDoor className="w-8 h-6"/>
                    </>
                }
            </Button>
    </Tooltip>
    )
}

export const LeaveRoomButton = ({room}:{room: number}) =>{
    const gameinfo = useAtomValue(createGameInfoAtom)
    const gameStarted =gameinfo?.hasStarted

    const { data, isLoading, isSuccess, write: writeLeaveGame } = useContractWrite({
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'leaveGame',
    })

    // check if player in game first

    return (
        <Tooltip content="Leave Room Before Game Start">
            <Button 
            disable={!gameStarted}
            className="py-2 border rounded-lg  
            border-prime3 text-background1 bg-prime3 hover:text-prime3 hover:bg-prime3/5
            "
            onClick={()=>{
                writeLeaveGame({
                    args: [room]
                })
            }}
            >
            {
                isLoading?<Spinner color="success"/>:
                <GiExitDoor className="w-12 h-6"/>
            }
            
            </Button>
        </Tooltip>
    )
}

export const ReadyUpButton = ({room}:{room: number})=>{
    const {address} = useAccount()
    const playerReadiness = useAtomValue(createPlayerReadiness)
    const playerIds = useAtomValue(createPlayerIds)

    //get player id
    const playerId = playerIds.indexOf(address?.toLocaleLowerCase() as string)
    const playerReady = playerId>=0 ? playerReadiness[playerId] : false

    const { data, isLoading, isSuccess, write: writeToggleReady } = useContractWrite({
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'toggleReady',
    })

    return (
        <Tooltip content="Signal Ready Up">
            <Button 
            disable={playerReady}
            className={`py-2 border rounded-lg 
            ${playerReady?
            
            "border-palegreen text-background1 bg-palegreen hover:text-palegreen hover:bg-background1"
                :
            "border-whitegreen text-background1 bg-whitegreen hover:text-whitegreen hover:bg-background1"
            }
            
            `}
            onClick={()=>{
                writeToggleReady({
                    args: [room, address, false]
                })
            }}
            >
                {
                    isLoading?<Spinner color="failure"/>:
                    <BsFillHandThumbsUpFill className="w-12 h-6 "/>
                }
            
            </Button>
        </Tooltip>
    )
}

export const PauseButton = ({room}:{room: number})=>{
    const {address} = useAccount()
    const playerReadiness = useAtomValue(createPlayerReadiness)
    const playerIds = useAtomValue(createPlayerIds)

    //get player id
    const playerId = playerIds.indexOf(address?.toLocaleLowerCase() as string)
    const playerReady = playerId>=0 ? playerReadiness[playerId] : false

    const { data, isLoading, isSuccess, write: writeToggleReady } = useContractWrite({
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'toggleReady',
    })

    return (
        <Tooltip content="Signal Ready Up">
            <Button 
            disable={playerReady}
            className={`py-2 border rounded-lg 
            ${playerReady?
            
            "border-palegreen text-background1 bg-palegreen hover:text-palegreen hover:bg-background1"
                :
            "border-whitegreen text-background1 bg-whitegreen hover:text-whitegreen hover:bg-background1"
            }
            
            `}
            onClick={()=>{
                writeToggleReady({
                    args: [room, address, false]
                })
            }}
            >
                {
                    isLoading?<Spinner color="failure"/>:
                    <BsFillHandThumbsUpFill className="w-12 h-6 "/>
                }
            
            </Button>
        </Tooltip>
    )
}