import React, {useEffect, useState} from 'react';
import { Dropdown } from 'flowbite-react';
import { BsChevronDown } from 'react-icons/bs';
import { watchReadContracts } from '@wagmi/core';
import { chainConfig } from '../../config/chainConfig';
import {earningsRankArray, winningsRankArray} from '../../atoms';
import { useAtom } from 'jotai';
import { formatEther } from 'viem';
import { addressShortener } from '../../utils/addressShortener';

export const RankingsDropdown = () => {
    const [showRankings, setRankingsDropdown] = useState(false);
    const [earningsRankings, setEarningsRankings] = useAtom(earningsRankArray);
    const [winningsRankings, setWinningsRankings] = useAtom(winningsRankArray);

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
            console.log("rankings...")
            console.log(data_)
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
                        amount: parseFloat(formatEther(p?.amount??0))
                    })
                    )
                )
            }
        })

        return ()=>{
            unwatch();
        }
    },[])

    return (
        <div className="
        mb-1
        border-2 border-prime2 rounded-lg
        flex flex-row w-full
        justify-end 
        items-center overflow-hidden
        ">

                <div className="
                flex-auto
                flex flex-row justify-start 
                text-white font-medium
                min-h-[1.8rem]
                overflow-x-hidden
                mr-2
                "
                >   
                {showRankings?null:
                    <>
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
                                            <span className="px-1">{p?.amount>0? p?.amount.toFixed(2)??0 : "??"}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </>
                }
                </div>
                
                <div className="
                flex-auto
                flex flex-row justify-start 
                text-white font-medium
                min-h-[1.8rem]
                overflow-x-hidden
                "
                >   
                {showRankings?null:
                    <>
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
                                            p?.amount>0? p?.amount??0 : "??"}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </>
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
    )
}
