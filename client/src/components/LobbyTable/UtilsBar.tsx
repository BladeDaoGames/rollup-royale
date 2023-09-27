import React, {useMemo, useState} from 'react';
import { useContractReads, useAccount } from 'wagmi';
import {chainConfig} from '../../config/chainConfig';
import { NONE } from 'phaser';
import { useNavigate } from 'react-router-dom';
import {toast} from 'react-hot-toast';
import {Modal} from 'flowbite-react';
import { formatEther, formatUnits } from 'viem';
import { addressShortener } from '../../utils/addressShortener';

export const UtilsBar = () => {
    const [openStats, setOpenStats] = useState<string | undefined>(); // [openStats, setOpenStats
    const {address} = useAccount();
    const navigate = useNavigate();
    const { data, isError, isLoading } = useContractReads({
        contracts:[
            {
                address: chainConfig.royaleContractAddress,
                abi: chainConfig.royaleAbi,
                functionName: 'playerInGame',
                args: [address]
            },
            {
                address: chainConfig.royaleContractAddress,
                abi: chainConfig.royaleAbi,
                functionName: 'getTop10RanksByEarnings',
                args: []
            },
            {
                address: chainConfig.royaleContractAddress,
                abi: chainConfig.royaleAbi,
                functionName: 'getTop10RanksByWinnings',
                args: []
            },
            {
                address: chainConfig.royaleContractAddress,
                abi: chainConfig.royaleAbi,
                functionName: 'userStats',
                args: [address]
            }
        ],
        
    })
    const earningsRankings = useMemo(()=>data?.[1]?.result?.map((p:any)=>({
        player: p?.player,
        amount: parseFloat(formatEther(p?.amount??0))
    })
    ),[data?.[1]?.result])

    const winningsRankings = useMemo(()=>data?.[2]?.result?.map((p:any)=>({
        player: p?.player,
        amount: parseInt(formatUnits(p?.amount??0, 0))
    })
    ),[data?.[2]?.result])

    const userStats = useMemo(()=>{
        return {
            totalWins: parseInt(data?.[3]?.result?.[0]??0),
            totalLosses: parseInt(data?.[3]?.result?.[1]??0),
            totalGasEarned: (parseFloat(formatEther(data?.[3]?.result?.[2]??0)) - 
            parseFloat(formatEther(data?.[3]?.result?.[3]??0)) ).toFixed(2)
        }
    }, [data?.[3]?.result])

    console.log("user stats")
    console.log(userStats)
    const getRoomIdInput = () =>{
        const input = document.getElementById("room-router") as HTMLInputElement;
        if(input){
            if(input.value>0){
                navigate(`/game/${input.value}`)
            }else if (input.value.length>0){
                toast.error("Invalid room number. Pls input a room number from greater than 0.")
            }
            return input.value;
        }
        return NONE;
    }
    return <div className="
        mb-1
        flex flex-row w-full
        justify-between max-h-[3rem] z-20
        bg-background1/80
        items-end overflow-y-visible
        ">
            
            {/* room status */}
            <div className="bg-lightbeige text-background1
            rounded-md border border-prime2
            mr-1 flex flex-nowrap items-center">
                <span className="ml-2 mr-1 font-semibold
                ">Showing only last 88 rooms.</span>
                { parseInt(data?.[0]?.result??0)>0?
                <>
                <span className="
                rounded-md 
                bg-background1 text-white
                px-2 py-1
                ">You are in room: {parseInt(data?.[0]?.result??0)}</span>
                </>
                :<>
                <span className="
                rounded-md 
                bg-background1 text-white
                px-2 py-1
                ">You are not in any room.</span>
                </>
            } 
            </div>

            <Modal show={openStats==="showStats"}
            onClose={()=>setOpenStats(undefined)}
            size={"3xl"}
            position={"top-center"}
            className="pt-[80px] rounded-lg"
            >
                <Modal.Header className="
                bg-background1 
                border border-t-prime2 border-x-prime2 
                border-b-0
                rounded-t-lg
                ">
                    <div className="flex flex-row justify-start items-center
                    text-prime2 font-semibold
                    ">
                        Game Statistics
                    </div>

                </Modal.Header>
                <Modal.Body className="
                bg-background1 py-0 pb-1
                rounded-b-lg 
                border border-b-prime2 border-x-prime2 border-t-0
                "
                >
                
                <div className="grid grid-cols-3 mt-0">
                    
                    {/* earnings */}
                    <div className="
                    p-1 py-2.5 m-1 my-3 rounded-md flex flex-col
                    border border-prime2">
                        <div className="px-1.5 my-1 text-prime1">Top 10 Earnings</div>
                        <div className="flex flex-row items-center justify-start
                            px-1.5 text-xs my-2 text-white
                            ">
                                <span>Rank</span>
                                <span className="px-1">Address</span>
                                <span className="px-1 ml-auto mr-0">Winnings Earned</span>
                        </div>
                        {
                                earningsRankings?.map((p,i)=>(
                                    <div className="flex flex-row items-center justify-start
                                    px-1.5 text-sm text-prime2
                                    " key={i}>
                                        <span>{i+1}. </span>
                                        <span className="px-1">
                                            { p?.amount>0? addressShortener(p?.player)??"0x0": "0x??"}
                                        </span>
                                        <span className="px-1 ml-auto mr-0">{p?.amount>0? p?.amount.toFixed(2)??0 : "??"}</span>
                                    </div>
                                ))
                        }
                    </div>
                    {/* winnings */}
                    <div className="
                    p-1 py-2.5 m-1 my-3 rounded-md flex flex-col
                    border border-prime2">
                        <div className="px-1.5 my-1 text-prime1">Top 10 Winnings</div>
                        <div className="flex flex-row items-center justify-start
                            px-1.5 text-xs my-2 text-white
                            ">
                                <span>Rank</span>
                                <span className="px-1">Address</span>
                                <span className="px-1 ml-auto mr-0">Total Wins</span>
                        </div>
                        {
                                winningsRankings?.map((p,i)=>(
                                    <div className="flex flex-row items-center justify-start
                                    px-1.5 text-sm text-prime2
                                    " key={i}>
                                        <span>{i+1}. </span>
                                        <span className="px-1">
                                            { p?.amount>0? addressShortener(p?.player)??"0x0": "0x??"}
                                        </span>
                                        <span className="px-1 ml-auto mr-0">{p?.amount>0? p?.amount??0 : "??"}</span>
                                    </div>
                                ))
                        }
                    </div>

                    <div className="
                    p-1 py-2.5 m-1 my-3 rounded-md flex flex-col
                    border border-prime2">
                        <div className="px-1.5 my-1 mb-5 text-prime1">Your Current Stats</div>

                        <div className="flex flex-row flex-nowrap
                        items-center justify-between
                        px-1.5
                        text-lightbeige text-md font-medium
                        ">
                            <span>Total Wins: </span>
                            <span>{userStats.totalWins}</span>
                        </div>
                        <div className="flex flex-row flex-nowrap
                        items-center justify-between
                        px-1.5
                        text-lightbeige text-md font-medium
                        ">
                            <span>Total Losses: </span>
                            <span>{userStats.totalLosses}</span>
                        </div>
                        <div className="flex flex-row flex-nowrap
                        items-center justify-between
                        px-1.5
                        text-lightbeige text-md font-medium
                        ">
                            <span>$BLADE Earned: </span>
                            <span>{userStats.totalGasEarned}</span>
                        </div>
                    </div>
                </div>

                </Modal.Body>
            </Modal>

            {/* room router */}
            <div>
                {/* show stats */}
                <button className="
                bg-prime2 text-background1
                hover:bg-lightbeige
                rounded-md mx-1 px-2 py-1.5 font-semibold
                "
                onClick={()=>{
                    setOpenStats("showStats")
                }}
                >Show Stats</button>

                {/* join room */}
                <button className="
                rounded-md px-2 py-1 font-semibold
                border border-prime2
                text-background1
                bg-whitegreen hover:bg-palegreen
                "
                onClick={()=>{getRoomIdInput()}}
                ><span className="mr-1">{`Join Room >`} </span>
                <input type="text" id="room-router"
                className="mx-1 text-black text-xs py-0.5 w-[70px]" 
                onKeyUp={event => {
                    if (event.key === 'Enter') {
                        getRoomIdInput()
                    }
                }}
                />
                </button>
                
            </div>
        </div>
    }