
import React, {useCallback} from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useBurnerKey } from '../../hooks/useBurnerKey';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount, generatePrivateKey  } from 'viem/accounts';
import { MockConnector } from 'wagmi/connectors/mock';

import { chainConfig } from '../../config/chainConfig';
import { useMutation } from 'react-query';
import { ethers } from 'ethers';
import { useSignTypedData } from 'wagmi';
import { readContracts, writeContract } from '@wagmi/core';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Spinner } from 'flowbite-react';
import {createBurnerKeyRegisteredFlagCount} from '../../atoms';
import { useSetAtom } from 'jotai';

export const SignUpButton = () => {
    const { address, isConnected } = useAccount();
    const { connect, isLoading: connectorIsLoading, pendingConnector } = useConnect()
    const { burnerKey, burnerAddress, updateBurnerKey} = useBurnerKey();
    const hasBurnderKey = burnerKey !==null
    const { isLoading: isWagmiLoading, signTypedDataAsync } = useSignTypedData();
    const burnerIsConnected = (address?.toLowerCase()==burnerAddress?.toLowerCase())&&(isConnected)
    const setBurnerKeyRegisteredFlagCount = useSetAtom(createBurnerKeyRegisteredFlagCount)
    

    const { isLoading, mutate: signup } = useMutation<void, any, void>({
        mutationFn: useCallback(async () => {
            console.log(`Burner Wallet is Connected: ${burnerIsConnected}`)
            if(import.meta.env.VITE_MODE == "web2"){
                updateBurnerKey(()=>generatePrivateKey())
                setBurnerKeyRegisteredFlagCount((count)=>count+1)
            }else{
                // check if already have address in local storage
                //quickfix: not checking if they link burner address to their wallet
                if(burnerIsConnected) return
                
                // if not connected to wallet then cannot run
                if(!isConnected) return

                // initate setup for registration
                const provider = new StaticJsonRpcProvider(chainConfig.chaindetails.rpcUrls.default.http[0]);
                
                let burnerAccount = ethers.Wallet.createRandom();

                burnerAccount = burnerAccount.connect(provider);

                // const privateKey = generatePrivateKey()
                // const targetAcct = privateKeyToAccount(privateKey)
                // const target = targetAcct.address
                const { address: target, privateKey } = burnerAccount;
                const contract = new ethers.Contract(
                    chainConfig.registryContractAddress,
                    chainConfig.registryAbi,
                    burnerAccount
                );

                // const data = await readContracts({
                //     contracts:[
                //         {
                //             address: chainConfig.registryContractAddress as `0x${string}`,
                //             abi: chainConfig.registryAbi,
                //             functionName: "eip712Domain",
                //         },
                //         {
                //             address: chainConfig.registryContractAddress as `0x${string}`,
                //             abi: chainConfig.registryAbi,
                //             functionName: "nonces",
                //             args:[address?.toString()]
                //         }
                //     ]
                // })
                
                //const [{result: [, name, version, chainId, verifyingContract, ,]}, {result: _nonce}]= data
                const [[, name, version, chainId, verifyingContract], _nonce] = await Promise.all([
                    contract.eip712Domain(),
                    contract.nonces(address),
                ]);

                const nonce = parseInt(_nonce)+1;
                const domain = {
                    name,
                    version,
                    chainId: parseInt(chainId),
                    verifyingContract,
                };
                
                const types = {
                    User: [
                        { name: 'signer', type: 'address' },
                        { name: 'nonce', type: 'uint256' },
                        { name: 'target', type: 'address' },
                    ],
                };
                
                const message = {
                    signer: address,
                    nonce,
                    target,
                };
                
                const signature = await signTypedDataAsync({ 
                    domain, types, primaryType:"User", message});

                //targetAcct
                // const burnerClient = createWalletClient({
                //     account:targetAcct,
                //     chain: chainConfig.chaindetails,
                //     transport: http()
                // }).extend(publicActions) 

                // const cachedConnector = new MockConnector({
                //     chains: supportedChains,
                //     options: {
                //         walletClient: burnerClient,
                //     },
                // })

                // const { request:registerRequest } = await burnerClient.simulateContract({
                //     address: chainConfig.registryContractAddress as `0x${string}`,
                //     abi: chainConfig.registryAbi,
                //     functionName: "register",
                //     args:[signature, address, nonce],
                //     account:targetAcct
                // })
                
                // await burnerClient.writeContract(registerRequest).then(
                //     (res)=>{
                //         console.log("new code.")
                //         updateBurnerKey(()=>privateKey as `0x${string}`)
                //         setBurnerKeyRegisteredFlagCount((count)=>count+1)
                //         // connect to new PK
                //         connect({connector: cachedConnector})
                // })
                
                // await provider.getFeeData().then((res)=>{
                //     console.log("fee data")
                //     console.log(res.maxFeePerGas) //3298198084 
                // })

                
                // await contract.register(signature, address, nonce, {
                //     gasPrice: 0,
                //     gasLimit: 2100000,
                //     maxFeePerGas: 3398198084
                // }).then((res)=>{

                //     updateBurnerKey(()=>privateKey as `0x${string}`)
                //     setBurnerKeyRegisteredFlagCount((count)=>count+1)

                //     const viemAccount = privateKeyToAccount(privateKey as `0x${string}`) 
                //     const cachedClient = createWalletClient({
                //         account:viemAccount,
                //         chain: chainConfig.chaindetails,
                //         transport: http()
                //     }).extend(publicActions) 
                
                //     const cachedConnector = new MockConnector({
                //         chains: supportedChains,
                //         options: {
                //             walletClient: cachedClient,
                //         },
                //     })

                //     // connect to new PK
                //     connect({connector: cachedConnector})

                // });
                console.log("called")
            }
            
            }, [
                address,
                chainConfig.registryContractAddress,
                chainConfig.chaindetails.rpcUrls.default.http[0],
                signTypedDataAsync,
                updateBurnerKey
            ]),

        onError(e: any) {
            console.error(e);
            //TODO: Toast fail
        },
    });
    


    return (
        <button type="button" 
            disabled={burnerIsConnected}
            className={`
            ${hasBurnderKey?
            "text-background1 bg-palegreen hover:bg-whitegreen "
            :
            "text-white bg-prime1 hover:bg-prime2 "
            }
            focus:ring-2 focus:outline-none focus:ring-lightbeige 
            font-medium rounded-lg text-xs md:text-base
            px-4 py-2 text-center mr-3 md:mr-0
            max-w-[132px] md:max-w-none
            `}

            onClick={()=>{
                if(hasBurnderKey) return
                signup()
            }}
        >
            {
            (isWagmiLoading || connectorIsLoading)?
                <Spinner color="failure" />
            :
            burnerIsConnected?"Using Burner: "
            :
            !isConnected?"Connect to Register A Burner=>":
            hasBurnderKey?"Has Burner":
            "Register a burner Wallet"}
        </button>
    )
}
