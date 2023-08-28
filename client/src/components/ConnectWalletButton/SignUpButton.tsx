
import React, {useCallback} from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useBurnerKey } from '../../hooks/useBurnerKey';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount, generatePrivateKey, PrivateKeyAccount  } from 'viem/accounts';
import { MockConnector } from 'wagmi/connectors/mock';

import { chainConfig } from '../../config/chainConfig';
import { supportedChains } from '../../config/supportedChains';
import { useMutation } from 'react-query';
import { parseGwei } from 'viem';
import { ethers } from 'ethers';
import { useSignTypedData, useNetwork, useSwitchNetwork } from 'wagmi';
import { readContracts, writeContract } from '@wagmi/core';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Spinner } from 'flowbite-react';
import {createBurnerKeyRegisteredFlagCount} from '../../atoms';
import { useSetAtom } from 'jotai';
import toast from 'react-hot-toast';

export const SignUpButton = () => {
    const { address, isConnected } = useAccount();
    const { chain } = useNetwork();
    const { chains, error:chainError, switchNetwork } = useSwitchNetwork();
    
    const { connect, isLoading: connectorIsLoading, pendingConnector } = useConnect()
    if(import.meta.env.VITE_ENV == "devWeb3") localStorage.clear();
    const { burnerKey, burnerAddress, updateBurnerKey} = useBurnerKey();
    const hasBurnderKey = burnerKey !==null
    const { isLoading: isWagmiLoading, signTypedDataAsync } = useSignTypedData();
    const burnerIsConnected = (address?.toLowerCase()==burnerAddress?.toLowerCase())&&(isConnected)
    const setBurnerKeyRegisteredFlagCount = useSetAtom(createBurnerKeyRegisteredFlagCount)
    
    const { isLoading, mutate: signup } = useMutation<void, any, void>({
        mutationFn: useCallback(async () => {

            if(import.meta.env.VITE_MODE == "web2"){
                console.log("web2 mode.")
                updateBurnerKey(()=>generatePrivateKey())
                setBurnerKeyRegisteredFlagCount((count)=>count+1)
                toast.success("Burner Wallet Created!", {icon: '🎉'})
            }else{
                if(chain?.id!=chainConfig.chaindetails.chainId){

                    toast(`Current network not desired network: ${chainConfig.chaindetails.name} 
                    Switching to correct chain now. Pls check network you are in.
                    `, {icon: '🚨'})
    
                    await switchNetwork?.(chainConfig.chaindetails.chainId)
                    return
                }
                // check if already have address in local storage
                //quickfix: not checking if they link burner address to their wallet
                if(burnerIsConnected) return
                
                // if not connected to wallet then cannot run
                if(!isConnected) return

                // initate setup for registration

                // use ethers js way
                if(import.meta.env.VITE_REGISTRYWAY == "ethers"){
                    const provider = new StaticJsonRpcProvider(chainConfig.chaindetails.rpcUrls.default.http[0]);
                    
                    let burnerAccount;
                    if(import.meta.env.VITE_ENV == "devWeb3"){
                        burnerAccount = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
                    }else{
                        burnerAccount = ethers.Wallet.createRandom();
                    }

                    burnerAccount = burnerAccount.connect(provider);

                    
                    const { address: target, privateKey } = burnerAccount;
                    const contract = new ethers.Contract(
                        chainConfig.registryContractAddress,
                        chainConfig.registryAbi,
                        burnerAccount
                    );
                    
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
                    
                    //this part must prompt for correct chain id 
                    const signature = await signTypedDataAsync({ 
                        domain, types, primaryType:"User", message});
                    
                    // await provider.getFeeData().then((res)=>{
                    //     console.log("fee data")
                    //     console.log(res.maxFeePerGas) //3298198084 
                    // })
                    console.log("address")
                    console.log(target)
                    await contract.register(signature, address, nonce, {
                        gasLimit: 2100000,
                    }).then((res)=>{
                        console.log("registered!")
                        updateBurnerKey(()=>privateKey as `0x${string}`)
                        setBurnerKeyRegisteredFlagCount((count)=>count+1)

                        const viemAccount = privateKeyToAccount(privateKey as `0x${string}`) 
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

                    });
                }
                // using viem way
                else{
                    const privateKey = import.meta.env.VITE_ENV == "devWeb3"?
                                "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80": //foundry dev pk
                                generatePrivateKey()
                    const targetAcct = privateKeyToAccount(privateKey)
                    const target = targetAcct.address

                    const data = await readContracts({
                        contracts:[
                            {
                                address: chainConfig.registryContractAddress as `0x${string}`,
                                abi: chainConfig.registryAbi,
                                functionName: "eip712Domain",
                            },
                            {
                                address: chainConfig.registryContractAddress as `0x${string}`,
                                abi: chainConfig.registryAbi,
                                functionName: "nonces",
                                args:[target?.toString()]
                            }
                        ]
                    })
                    const [{result: [, name, version, chainId, verifyingContract, ,]}, {result: _nonce}]= data
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
                    //targetAcct
                    const burnerClient = createWalletClient({
                        account:targetAcct,
                        chain: chainConfig.chaindetails,
                        transport: http()
                    }).extend(publicActions) 

                    const cachedConnector = new MockConnector({
                        chains: supportedChains,
                        options: {
                            walletClient: burnerClient,
                        },
                    })

                    // this part must prompt for correct chain id 
                    const signature = await signTypedDataAsync({ 
                        domain, types, primaryType:"User", message})

                    const { request:registerRequest } = await burnerClient.simulateContract({
                        address: chainConfig.registryContractAddress as `0x${string}`,
                        abi: chainConfig.registryAbi,
                        functionName: "register",
                        args:[signature, address, nonce],
                        account:target,
                    })
                    
                    await burnerClient.writeContract(registerRequest).then(
                            (registerRq)=>{
                            console.log("sent registeration")
                            updateBurnerKey(()=>privateKey as `0x${string}`)
                            setBurnerKeyRegisteredFlagCount((count)=>count+1)
                            // connect to new PK
                            connect({connector: cachedConnector})
                    })
                }
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
            toast.error("Wallet Registration Error", {icon: '🚨'})
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
            burnerIsConnected?"Using Burner: ":
            hasBurnderKey?"Has Burner":
            !isConnected?"Connect to Register A Burner=>":
            
            "Register a burner Wallet"}
        </button>
    )
}
