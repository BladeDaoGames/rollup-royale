import React, {useMemo} from 'react';
import { useAccount, useBalance, useNetwork } from 'wagmi';
import { useBurnerKey } from '../../hooks/useBurnerKey';
import { chainConfig } from '../../config/chainConfig';

export const BalanceButton = () => {
    const { address, isConnected } = useAccount()
    const { data, isError, isLoading } = useBalance({address, watch: true})
    const { chain, chains } = useNetwork()
    const { burnerKey, burnerAddress, updateBurnerKey} = useBurnerKey();
    const hasBurnerKey = burnerKey !==null
    const usingBurner = hasBurnerKey && (
        address?.toLowerCase()==burnerAddress?.toLowerCase()) && isConnected

    return useMemo(()=>(
        <div className={`text-sm font-medium   
            ${(usingBurner && parseInt(data?.formatted)==0)?"md:bg-palered text-white":
            "md:bg-prime2 text-prime2 md:text-background1"}
            md:rounded-lg md:text-base md:px-4 md:py-2 md:text-center md:hover:bg-darkbeige
            `}>
                {
                (!isConnected || chain?.id != chainConfig.chaindetails?.id)?"Wrong Network":
                (usingBurner && parseInt(data?.formatted)==0)?"U have 0 $BLADE in burner. Click here for faucet!":
                `${chain?.nativeCurrency.symbol??"Balance"}: ${
                    data?.formatted?parseFloat(data?.formatted).toFixed(3):"0"
                    }`
                }</div>
    ),[address, isConnected, usingBurner, data?.formatted, chain?.nativeCurrency.symbol, chain?.id])
}