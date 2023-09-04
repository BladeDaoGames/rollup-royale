import React, {useEffect, useMemo, useState} from 'react';
import { Dropdown } from 'flowbite-react';
import { BsChevronDown } from 'react-icons/bs';
import { useNetwork } from 'wagmi';
import { watchReadContracts } from '@wagmi/core';
import { chainConfig } from '../../config/chainConfig';
import {earningsRankArray, winningsRankArray} from '../../atoms';
import { useAtom } from 'jotai';
import { formatEther, formatUnits } from 'viem';
import { addressShortener } from '../../utils/addressShortener';

export const RankingsDropdown = () => {
    const [showRankings, setRankingsDropdown] = useState(false);
    const [earningsRankings, setEarningsRankings] = useAtom(earningsRankArray);
    const [winningsRankings, setWinningsRankings] = useAtom(winningsRankArray);
    const { chain } = useNetwork();
    const contractCallConfig = {
        contracts:[
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
        ],
        listenToBlock: true,
    }

    // start a listener on rankings views
    useEffect(()=>{
        const unwatch = watchReadContracts(contractCallConfig, (data_)=>{
            // console.log("rankings...")
            // console.log(data_)
            if(data_[0]?.status=="success"){
                setEarningsRankings(
                    data_[0]?.result?.map((p:any)=>({
                        player: p?.player,
                        amount: parseFloat(formatEther(p?.amount??0))
                    })
                    )
                )
            }

            if(data_[1]?.status=="success"){
                setWinningsRankings(
                    data_[1]?.result?.map((p:any)=>({
                        player: p?.player,
                        amount: parseInt(formatUnits(p?.amount??0, 0))
                    })
                    )
                )
            }
        })

        return ()=>{
            unwatch();
        }
    },[])

    return useMemo(()=>{return(
        <div className="
        mb-1
        border-2 border-prime2 rounded-lg
        flex flex-row w-full
        justify-end max-h-[2rem] z-20
        bg-background1/80
        items-start overflow-y-visible
        ">
            <div className="
            min-h-[1.8rem] flex-1
            flex flex-row text-sm
            items-start justify-start
            overflow-x-hidden
            ">
                {showRankings?null:
                    <>
                <div className="
                flex-auto
                flex flex-row justify-start
                text-white font-medium
                min-h-[1.8rem]
                overflow-x-hidden
                "
                > 
                        <div className="
                        px-2 flex-none grow-0
                        flex items-center text-prime1
                        ">Earnings Rank: </div>
                        <div className="
                        px-1
                        flex overflow-x-hidden
                        ">
                            <div className="
                            font-normal text-lightbeige
                            flex flex-row flex-nowrap items-center 
                            animate-marquee whitespace-nowrap">
                                {
                                    earningsRankings?.map((p,i)=>(
                                        <div className="flex flex-row items-center mr-1
                                        px-1.5
                                        " key={i}>
                                            <span>{i+1}. </span>
                                            <span className="px-1">
                                                { p?.amount>0? addressShortener(p?.player)??"0x0": "0x??"}
                                            </span>
                                            <span className="px-1">{p?.amount>0? p?.amount.toFixed(2)??0 : "??"}$BLADE</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    
                </div>
                
                <div className="
                flex-auto
                flex flex-row justify-start 
                text-white font-medium
                min-h-[1.8rem]
                overflow-x-hidden
                "
                >   
                <div className="
                    px-2 flex-none grow-0
                    flex items-center text-prime1
                    ">Winnings Rank: </div>
                    <div className="
                    px-1
                    flex overflow-x-hidden
                    ">
                        <div className="
                        font-normal text-lightbeige
                        flex flex-row flex-nowrap items-center 
                        animate-marquee whitespace-nowrap">
                            {
                                winningsRankings?.map((p,i)=>(
                                    <div className="flex flex-row items-center mr-1
                                    px-1.5
                                    " key={i}>
                                        <span>{i+1}. </span>
                                        <span className="px-1">
                                            { p?.amount>0? addressShortener(p?.player)??"0x0": "0x??"}
                                        </span>
                                        <span className="px-1">{
                                        p?.amount>0? p?.amount??0 : "??"}wins</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
                    </>
                }

                {!showRankings?null:
                    <div className="grid grid-cols-2 gap-1 m-1 px-3
                    flex-auto font-semibold text-white
                    rounded-md bg-background1/90 
                    z-20 pt-4 pb-2
                    border-rbl-2 border-prime2
                    ">
                        <div className="
                        p-1 py-2.5 m-1 my-3 rounded-md flex flex-col
                        border border-prime2">
                            <div className="px-1.5 my-1 text-prime1">Top 10 Earnings</div>
                            <div className="flex flex-row items-center justify-start
                                px-1.5 text-xs my-2
                                ">
                                    <span>Rank</span>
                                    <span className="px-1">Address</span>
                                    <span className="px-1 ml-auto mr-0">Winnings Earned</span>
                            </div>
                            {
                                    earningsRankings?.map((p,i)=>(
                                        <div className="flex flex-row items-center justify-start
                                        px-1.5
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
                        <div className="
                        p-1 m-1 my-3 rounded-md flex flex-col
                        border border-prime2">
                            <div className="px-1.5 my-1 text-prime1">Top 10 Winnings</div>
                            <div className="flex flex-row items-center justify-start
                                px-1.5 text-xs my-2
                                ">
                                    <span>Rank</span>
                                    <span className="px-1">Address</span>
                                    <span className="px-1 ml-auto mr-0">Total Wins</span>
                            </div>
                            {
                                    winningsRankings?.map((p,i)=>(
                                        <div className="flex flex-row items-center justify-start
                                        px-1.5
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
                    </div>
                }
            </div>
                <button className="
                mx-2 py-2 text-white font-bold
                h-[1.8rem]
                "
                onClick={()=>{setRankingsDropdown((p)=>!p)}}
                >
                <BsChevronDown/>
                </button>

        </div>
    )},[earningsRankings, winningsRankings, showRankings])
}
