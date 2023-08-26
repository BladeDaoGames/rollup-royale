import {useEffect, useRef} from 'react';
import { readContract } from '@wagmi/core';
import { formatUnits } from 'viem';
import RoyaleABI from '../config/abis/Royale.json';
import {ROYALE_ADDRESS} from '../config/constants';
import {useAtom, useSetAtom} from 'jotai';
import { createTotalRoomsAtoom, createRoomAtom, createProgressBar } from '../atoms';

const useFetchRooms = () => {
    const setTotalRooms = useSetAtom(createTotalRoomsAtoom)
    const setRooms = useSetAtom(createRoomAtom)
    const [progressBarValue, setProgressBarValue] = useAtom(createProgressBar)
    const fetchTimes = useRef<number>(0);
    //const fetchDone = useRef<boolean>(false);

    useEffect(()=>{
        //console.log(progressBarValue)
        if(progressBarValue<100){
            setTimeout(()=>{
                setProgressBarValue((t)=>{
                    if(t<100){
                        return t+1
                    }else{
                        return t
                    }
                })
            }, 10)
        }
    },[progressBarValue])

    useEffect(() => {
        //if(fetchDone.current) return;
        console.log(`getting total rooms data...(x${fetchTimes.current}`)
        fetchTimes.current +=1;

        let newTotalRooms = 0;
        //1. get total rooms now
        async function fetchAndPopulateRooms(newTotalRooms:number){
                
            // simulate long loading time
            // await new Promise(()=>{
            //     setTimeout(()=>{console.log("timeout")},30000)
            // })

            // actual fetch
            await Promise.all(
                Array.apply(null, Array(newTotalRooms))
                    .map(
                        async (_, roomId)=>{
                            return await await readContract({
                                address: ROYALE_ADDRESS,
                                abi: RoyaleABI.abi,
                                functionName: 'games',
                                args: [roomId]
                            }).then((res) => {
                                // console.log("room info")
                                // console.log(res)
                                return {
                                    _roomId: roomId,
                                    _creator: res?.gameCreator as string,
                                    stake: parseFloat(formatUnits(res?.minStake, 18))/1.000??999 as number,
                                    boardrow: 10,
                                    boardcol: 10,
                                    players: parseInt(res?.playersCount)??1,
                                    maxplayers: 4,
                                    status: res?.hasEnded ? "Ended" : !res?.hasStarted ? "Join" : "Spectate",
                                }
                                
                            });
                            }
                        )
                    ).then((res)=>{
                        setRooms(res)
                        setProgressBarValue(()=>100)
                    })
            }

        async function getTotalRooms(){
            return await readContract({
                address: ROYALE_ADDRESS,
                abi: RoyaleABI.abi,
                functionName: 'getTotalGames',
            }).then((res)=>{
                //set total rooms
                newTotalRooms = parseInt(res as BigInt);
                setTotalRooms(newTotalRooms);

                //2. update rooms data by looping through all rooms
                fetchAndPopulateRooms(newTotalRooms);
        })}

        setProgressBarValue(()=>0)
        getTotalRooms()
        
        //fetchDone.current = true;
    },[])
}

export default useFetchRooms