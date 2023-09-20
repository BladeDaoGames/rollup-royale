import React, {useEffect} from 'react';
import { Button, Tooltip } from 'flowbite-react';
import { BsPlayFill, BsFillPauseFill, BsFillHandThumbsUpFill} from 'react-icons/bs';
import {BiMoneyWithdraw} from 'react-icons/bi';
import { GiHighPunch, GiEntryDoor, GiExitDoor} from 'react-icons/gi';
import { Spinner } from 'flowbite-react';

import {useAtomValue} from 'jotai';
import {createGameInfoAtom, createPlayerIds,
    createPlayerReadiness, createPlayerPauseVote
} from '../../atoms';

import { useAccount, useContractWrite, useNetwork } from 'wagmi';
import { readContract } from '@wagmi/core';
import { chainConfig } from '../../config/chainConfig';
import { parseEther } from 'viem';
import toast from 'react-hot-toast';
import { ContractErrorMap } from '../../config/constants';

export const StakeAndEnterButton = ({room}:{room: number}) => {
    const {address} = useAccount()
    const { chain } = useNetwork()
    const gameinfo = useAtomValue(createGameInfoAtom)
    const playerIds = useAtomValue(createPlayerIds)
    const { data, isLoading, error, isSuccess, write: writeJoinGame } = useContractWrite({
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'joinGame',
    })

    const playerInGame = playerIds.includes(address?.toLowerCase()??"unknown")

    useEffect(() => {
        const playerInGameRoom = async () => {
            const playerIds = await readContract({
                address: chainConfig.royaleContractAddress,
                abi: chainConfig.royaleAbi,
                functionName: 'playerInGame',
                args: [address]
            }).then((res) => {
                //console.log(parseInt(res))
                if(parseInt(res)>0){
                    toast.error(`Can't Join Game.\nYou are currently in Room ${parseInt(res)}`, {icon: '🚨'})
                    return;
                }
            });
        }

        if (isSuccess) {
            toast.success("Game Joined SuccessFully", {icon: '👍'})
        } else if (error) {
            console.log(error)
            const error_code = error?.details?.split(": revert ")[1]
            if(error_code in ContractErrorMap){
                toast.error(ContractErrorMap[error_code], {icon: '🚨'})
                playerInGameRoom();
            }else{
                toast.error("Game Entry Failed", {icon: '🚨'})
            }
        }
    }, [isSuccess, error, isLoading, data, address])

    return (
        <Tooltip content={`~ Stake $${chain?.nativeCurrency.symbol} and Enter Game ~`}>
            <Button 
            disabled={playerInGame}
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
                        <BiMoneyWithdraw className="w-12 h-6"/>
                    </>
                }
            </Button>
    </Tooltip>
    )
}

export const LeaveRoomButton = ({room}:{room: number}) =>{
    const gameinfo = useAtomValue(createGameInfoAtom)
    const gameStarted =gameinfo?.hasStarted

    const { data, isLoading, error, isSuccess, write: writeLeaveGame } = useContractWrite({
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'leaveGameB4start',
    })

    useEffect(() => {

        if (isSuccess) {
            toast.success("Left Game SuccessFully", {icon: '👍'})
        } else if (error) {
            console.log(error)
            const error_code = error?.details?.split(": revert ")[1]
            if(error_code in ContractErrorMap){
                toast.error(ContractErrorMap[error_code], {icon: '🚨'})
            }else{
                toast.error("Game Leave Failed", {icon: '🚨'})
            }
        }
    }, [isSuccess, error, isLoading, data])

    return (
        <Tooltip content="Leave Room Before Game Start">
            <Button 
            disabled={gameStarted}
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
                <GiEntryDoor className="w-12 h-6"/>
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
    const playerId = playerIds.indexOf(address?.toLowerCase() as string)
    const playerReady = playerId>=0 ? playerReadiness[playerId] : false

    const { data, isLoading, error, isSuccess, write: writeToggleReady } = useContractWrite({
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'playerReadyUp',
    })

    useEffect(() => {
        if (isSuccess) {
            toast.success("Ready Up Set!", {icon: '👍'})
        } else if (error) {
            console.log(error)
            const error_code = error?.details?.split(": revert ")[1]
            if(error_code in ContractErrorMap){
                toast.error(ContractErrorMap[error_code], {icon: '🚨'})
            }else{
                toast.error("Ready Failed :(", {icon: '🚨'})
            }
        }
    }, [isSuccess, error, isLoading, data])
    
    return (
        <Tooltip content="Signal Ready Up To Let Owner Start Game">
            <Button 
            disabled={playerReady}
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

export const PlayerPauseButton = ({room}:{room: number})=>{
    const {address} = useAccount()
    const playerPauseVote = useAtomValue(createPlayerPauseVote)
    const playerIds = useAtomValue(createPlayerIds)

    //get player id
    const playerId = playerIds.indexOf(address?.toLowerCase() as string)
    const playerPlayerPaused = playerId>=0 ? playerPauseVote[playerId] : false

    const { data, isLoading, error, isSuccess, write: writeTogglePause } = useContractWrite({
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'playerTogglePause',
    })

    useEffect(() => {
        if (isSuccess) {
            toast.success("Pause Success", {icon: '👍'})
        } else if (error) {
            console.log(error)
            const error_code = error?.details?.split(": revert ")[1]
            if(error_code in ContractErrorMap){
                toast.error(ContractErrorMap[error_code], {icon: '🚨'})
            }else{
                toast.error("Pause Failed :(", {icon: '🚨'})
            }
        }
    }, [isSuccess, error, isLoading, data])

    return (
        <Tooltip content="Vote For Game Pause">
            <Button 
            className={`py-2 border rounded-lg  
            ${
                playerPlayerPaused?
            "border-yellow-300 text-background1 bg-yellow-300 hover:text-yellow-300 hover:bg-prime1/5"
                :
            "border-prime1 text-prime1 bg-background1 hover:text-background1 hover:bg-prime1"
            }
            
            `}
            
            onClick={()=>{
                writeTogglePause({
                    args: [room, address, false]
                })
            }}
            >   
            {
                isLoading?<Spinner color="failure"/>:
                <BsFillPauseFill className="w-12 h-6 "/>
            }
            </Button>
        </Tooltip>
    )
}

export const StartGameButton = ({room}:{room: number})=>{
    const {address} = useAccount()
    const gameinfo = useAtomValue(createGameInfoAtom)
    const { data, isLoading, error, isSuccess, write: writeStartGame } = useContractWrite({
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'startGame',
    })

    const playerIsRoomOwner = (gameinfo?.gameCreator.toLowerCase() == address?.toLowerCase()??"unknown")

    useEffect(() => {
        if (isSuccess) {
            toast.success("Game Start Success!", {icon: '👍'})
        } else if (error) {
            console.log(error)
            const error_code = error?.details?.split(": revert ")[1]
            if(error_code in ContractErrorMap){
                toast.error(ContractErrorMap[error_code], {icon: '🚨'})
            }else{
                toast.error("Game Start Failed :(", {icon: '🚨'})
            }
        }
    }, [isSuccess, error, isLoading, data])

    return (
        <Tooltip content="Only Owner Can Start Game">
            <Button 
            disabled={gameinfo?.hasStarted || !playerIsRoomOwner}
            className={`flex flex-row items-center justify-center py-2 
            border rounded-lg  

            ${ ((!gameinfo?.hasStarted)&&(playerIsRoomOwner)) ?
            "border-palered bg-palered text-white hover:bg-background1 hover:text-palered"
                :
            "border-palered bg-white/5 text-palered hover:bg-palered hover:text-white"
            }
            `}
            
            onClick={()=>{
                writeStartGame({
                    args: [room]
                })
            }}
            >
                {
                isLoading?<Spinner color="failure"/>:
                <>
                <BsPlayFill className="w-6 h-6 mx-0"/>
                <GiHighPunch className="w-6 h-6 mx-0"/>
                </>
                }
            </Button>
        </Tooltip>
    )
}