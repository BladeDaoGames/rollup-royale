import React, { useEffect, useMemo } from 'react';
import { createTxnSender } from '../../atoms';
import { useAtom } from 'jotai';
import Phaser from 'phaser';
import { createGameSceneReadiness, createPlayerIds, createTxnQueue } from '../../atoms';
import { useAccount } from 'wagmi';
import { Direction } from '../../phaser/characters/Player';
import { chainConfig } from '../../config/chainConfig';
import { writeContract } from '@wagmi/core';
import { parseGwei } from 'viem';

export const TxnSenderHOC = ({game, roomId}:{game:Phaser.Game, roomId:number}) => {
    const {address, isConnected} = useAccount()
    const [sendTxnFlag, setSendTxnFlag] = useAtom(createTxnSender)
    const [gameSceneReady, setGameSceneReady] = useAtom(createGameSceneReadiness)
    const [ txnQueue, setTxnQueue] = useAtom(createTxnQueue)
    
    const [playerIds, setPlayerIds] = useAtom(createPlayerIds)
    const playerId = playerIds.indexOf(address?.toLowerCase() as string)
    const playerInGame = playerId>=0
    const gamescene = game?.scene?.keys?.GameSceneFlat
    const dirMapping = {
        "up": 0,
        "left": 1,
        "down": 2,
        "right": 3,
        "none":4
    }
    return useMemo(()=>{
        // check if player in game and game is ready(queriable)
        if(playerInGame&&gamescene?.player1){
            //check if user is already assigned to player
            const userEntity = gamescene?.user?.entity
            const userId = parseInt(userEntity?.substr(userEntity?.length - 1))??null

            //continue if the user is tagged to a game player
            if(userId==(playerId+1)){
                //check if he has intention to move by getting difference of posB4contract and
                //get his move intentPos from the game
                const userPosB4contractVec = gamescene?.user?.posB4contract
                const userMoveIntentVec = gamescene?.user?.moveIntentPos

                const dirForSmartContract = gamescene?.user?.directionForSmartContract
                //send txn as long as direction intent is not none
                if((dirForSmartContract!="none") && (txnQueue==0)){
                    setTxnQueue(()=>1)
                    const movePlayer= async()=>{
                        console.log("sending move txn...")
                        console.log(txnQueue)
                        await writeContract({
                            address: chainConfig.royaleContractAddress as `0x${string}`,
                            abi: chainConfig.royaleAbi,
                            functionName: 'movePlayer',
                            args:[
                                roomId, 
                                dirMapping[dirForSmartContract as string] as number, 
                                address,
                                false
                            ],
                            maxFeePerGas: parseGwei('20'),
                            maxPriorityFeePerGas: parseGwei('5'),

                        }).then(()=>{
                            setTxnQueue(()=>0)
                            console.log("txn complete")
                        })
                    }
                    movePlayer()
                }
                
            }
        }
        

        setSendTxnFlag(false)
        return(<></>)
    },[sendTxnFlag, gameSceneReady, playerInGame, gamescene, txnQueue])
}