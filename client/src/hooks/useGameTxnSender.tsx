import React, {useMemo, useCallback} from 'react';
import {createTxnSender} from '../atoms';
import {useAtom} from 'jotai';

export const useGameTxnSender = () => {
    const [sendTxnFlag, setSendTxnFlag] = useAtom(createTxnSender)

    
    return useMemo(()=>{
        console.log("txn sent.")
        setSendTxnFlag((prev)=>false)
        return ""
    },[sendTxnFlag])
}