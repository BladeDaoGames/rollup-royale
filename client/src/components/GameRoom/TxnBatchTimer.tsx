import React, {useState, useEffect, useMemo} from 'react';
import {createTxnBatchInterval, createTxnSender} from '../../atoms';
import {useAtomValue, useSetAtom} from 'jotai';
import { useGameAndPlayerStatus } from '../../hooks/useGameAndPlayerStatus';

export const TxnBatchTimer = () => {
    const batchInterval = useAtomValue(createTxnBatchInterval)
    const setTxnSendFlag = useSetAtom(createTxnSender)
    const [timePassed, setTimePassed] = useState<number>(0)
    const progress = timePassed/batchInterval * 100
    const {gameStatus} = useGameAndPlayerStatus()

    useEffect(()=>{
        const intervalId = setInterval(()=>{
            setTimePassed((t)=>
            {
                if(t>=batchInterval){
                    setTxnSendFlag(true)
                    return 0
                }else{
                    return t+1
                }
            })
        }, 1000);
        return () => clearInterval(intervalId);
    },[])
    return useMemo(()=>
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
                <div className="text-sm">Time To Next Move</div>
                <div className="mt-1 mr-1 mx-0 w-full h-2 
                rounded-md overflow-hidden flex justify-start items-start
                border border-white
                ">
                    <span className={`
                ${gameStatus=="ongoing"?
                    progress>=100?"bg-palegreen":"bg-prime1":
                gameStatus=="prestart"?"bg-lightbeige":
                gameStatus=="paused"?"bg-prime1":
                gameStatus=="ended"?"bg-prime2":
                "bg-purple-500/80"} 
                h-full`} 
                style={{width: `${gameStatus=="ongoing"?progress:"100"}%`}}
                />
                </div>
            {/* </Tooltip> */}
                
            </div>
        ,[batchInterval, progress, gameStatus])
    }