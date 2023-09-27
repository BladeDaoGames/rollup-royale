import React, {useCallback, useEffect, useMemo} from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { addressShortener } from '../../utils/addressShortener';

import { createWalletClient, http, publicActions, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {InjectedConnector} from '@wagmi/core';
import { MockConnector } from 'wagmi/connectors/mock';

import {createDevPrivateKey, createBurnerKeyRegisteredFlagCount} from '../../atoms';
import { useAtomValue } from 'jotai';
import { supportedChains } from '../../config/supportedChains';
import { chainConfig } from '../../config/chainConfig';
import {useBurnerKey} from '../../hooks/useBurnerKey';
import {BiCopy} from 'react-icons/bi';
import { Tooltip } from 'flowbite-react';
import { toast } from 'react-hot-toast';

const CWButton = () => {
    const { address, isConnected } = useAccount()
    const { connect, connectors } = useConnect()
    const { disconnect } = useDisconnect()
    const burnerKeyRegisteredFlagCount = useAtomValue(createBurnerKeyRegisteredFlagCount)
    const { burnerKey, burnerAddress, updateBurnerKey} = useBurnerKey();
    const burnerIsConnected = (address?.toLowerCase()==burnerAddress?.toLowerCase())&&(isConnected)
    const shortAddress = addressShortener(address as string)

    const devPk = useAtomValue(createDevPrivateKey)
    
    const handleConnect = useCallback(() => {
        //if(!isConnected){
            //if in dev mode use dev pk
            if (import.meta.env.VITE_ENV == "dev"){
                const viemAccount = privateKeyToAccount(devPk)
                const cachedClient = createWalletClient({
                    account:viemAccount,
                    chain: chainConfig.chaindetails,
                    transport: http()
                }).extend(publicActions) 
            
                const cachedConnector = new MockConnector({
                    chains: supportedChains,
                    options: {
                        walletClient: cachedClient,
                    },
                })
                // connect to new PK
                connect({connector: cachedConnector})
                return
            }

            // if burner is already connected (edge case)
            if (burnerIsConnected) return

            //if burner wallet available, use burner to connect
            if(burnerKey !==null){
                const viemAccount = privateKeyToAccount(burnerKey) 
                const cachedClient = createWalletClient({
                    account: viemAccount,
                    chain: chainConfig.chaindetails,
                    transport: http()
                }).extend(publicActions) 
            
                const cachedConnector = new MockConnector({
                    chains: supportedChains,
                    options: {
                        flags:{
                            isAuthorized:true,
                        },
                        walletClient: cachedClient,
                    },
                })
                // connect to new PK
                connect({connector: cachedConnector})
                return
            }
            
            // else connect normally with metamask injected
            connect({ connector: connectors[0] })
            return
        //} 
        
        // else {
        //     disconnect()
        //     return
        // }
    },[devPk, connect, connectors, disconnect, burnerKey, 
        address, isConnected, burnerIsConnected])

    useEffect(()=>{
        // it is dev, auto connect
        if (import.meta.env.VITE_ENV == "dev"){
            handleConnect();
        }

        // if they got registered flag from the signup then connect them automatically
        //if(burnerKeyRegisteredFlagCount>0) handleConnect();

        // in the end we decided just auto connect everyone if not connected
        handleConnect();
        //!isConnected?handleConnect():null;

    },[burnerKeyRegisteredFlagCount, handleConnect, isConnected])

    return useMemo(()=>(
        <div className="flex flex-row flex-nowrap
        text-white
        font-medium text-sm md:text-base
        bg-prime1
        hover:bg-prime2 hover:text-background1
        rounded-lg
        ">
            <div
                className={`
                focus:ring-2 focus:outline-none focus:ring-lightbeige 
                
                ${isConnected?"pl-4 pr-2":"px-4"} py-2 text-center mr-3 md:mr-0
                max-w-[132px] md:max-w-none`}

                onClick={() => handleConnect()}
                >
                {isConnected ? 
                <div className="flex flex-row items-center">
                    <Tooltip content={address}>
                        <span>{shortAddress}</span>
                    </Tooltip>
                    
                    </div> 
                : "Connect Wallet"}
            </div>
            {isConnected?
            <button className={`
            flex flex-row items-center justify-center
            rounded-r-lg hover:bg-lightbeige
            hover:text-alertred1 hover:text-lg
            pl-2 pr-4`}
                onClick={()=>{
                    navigator.clipboard.writeText(address as string)
                    toast.success(
                        <div className="p-2 break-all">{`Address ${address} Copied!`}</div>
                        , {icon: '📋'})
                }}
                >
                <Tooltip content={"copy address to clipboard"}>
                <BiCopy className={`text-center align-middle`}/>
                </Tooltip>
            </button>
            :null}
        </div>
    ),[isConnected, address, burnerKey, burnerIsConnected, handleConnect])
}

export default CWButton