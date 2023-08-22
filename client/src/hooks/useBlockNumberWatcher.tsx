import {useEffect} from 'react';
import {watchBlockNumber } from '@wagmi/core';
import {useAtom} from 'jotai';

const useBlockNumberWatcher = () => {
    useEffect(()=>{
        const unwatchBlockNumber = watchBlockNumber(
            {
                listen: true, 
            },
            (blockNumber)=> console.log(blockNumber),
        )
        return ()=>{
            unwatchBlockNumber();
        }
    },[])
    return "BlockTime"
}

export default useBlockNumberWatcher