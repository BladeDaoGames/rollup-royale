import React, {useEffect} from 'react';
import {earningsRankArray, winningsRankArray} from '../atoms';
import { watchReadContracts } from '@wagmi/core';
import { useSetAtom } from 'jotai';
import { chainConfig } from '../config/chainConfig';
import { formatEther, formatUnits } from 'viem';

export const useRankingsValues = () => {
    const setEarningsRankings = useSetAtom(earningsRankArray)
    const setWinningsRankings = useSetAtom(winningsRankArray)
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
    console.log("useRankings refresh")
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

    return null
}