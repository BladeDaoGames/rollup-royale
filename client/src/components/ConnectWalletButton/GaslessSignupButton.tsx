
import React, {useCallback, useEffect} from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useBurnerKey } from '../../hooks/useBurnerKey';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount, generatePrivateKey, PrivateKeyAccount  } from 'viem/accounts';
import { MockConnector } from 'wagmi/connectors/mock';

import { chainConfig } from '../../config/chainConfig';
import { supportedChains } from '../../config/supportedChains';
import { useMutation } from 'react-query';
import { parseGwei } from 'viem';
import { ethers } from 'ethers';
import { useSignTypedData, useNetwork } from 'wagmi';
import { readContracts, writeContract, switchNetwork  } from '@wagmi/core';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Spinner } from 'flowbite-react';
import {createBurnerKeyRegisteredFlagCount} from '../../atoms';
import { useSetAtom } from 'jotai';
import toast from 'react-hot-toast';

export const GaslessSignUpButton = () => {
    const { address, isConnected } = useAccount();
    const { chain } = useNetwork();
    //const { chains, error:chainError, switchNetwork } = useSwitchNetwork();
    
    const { connect, isLoading: connectorIsLoading, pendingConnector, connectors } = useConnect();
    const {disconnect} = useDisconnect();
    if(import.meta.env.VITE_ENV == "devWeb3") localStorage.clear();
    const { burnerKey, burnerAddress, updateBurnerKey} = useBurnerKey();
    const hasBurnerKey = burnerKey !==null
    const { isLoading: isWagmiLoading, signTypedDataAsync } = useSignTypedData();
    const burnerIsConnected = (address?.toLowerCase()==burnerAddress?.toLowerCase())&&(isConnected)
    const setBurnerKeyRegisteredFlagCount = useSetAtom(createBurnerKeyRegisteredFlagCount)
    
    const { isLoading, mutate: signup } = useMutation<void, any, void>({
        mutationFn: useCallback(async () => {
            console.log("signing up for burner wallet...")
            // if(chain?.id!=chainConfig.chaindetails.id){

            //     toast.error(`Current network not desired network: ${chainConfig.chaindetails.name} 
            //     Switching to correct chain now. Pls check network you are in.
            //     `, {icon: '🚨', duration: 7000})

            //     await switchNetwork?.(chainConfig.chaindetails.id);
            //     disconnect();
            //     return 
            // }
            if(import.meta.env.VITE_MODE == "web2"){
                console.log("web2 mode.")
                updateBurnerKey(()=>generatePrivateKey())
                setBurnerKeyRegisteredFlagCount((count)=>count+1)
                toast.success("Burner Wallet Created!", {icon: '🎉'})
            }else{
                
                // check if already have address in local storage
                //quickfix: not checking if they link burner address to their wallet
                if(burnerIsConnected) return

                // if he has burner but not connect it, then connect it
                if(hasBurnerKey){
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
                    return;
                }
                
                // if not connected to wallet connect for them
                if(!isConnected) return

                // initate setup for registration

                // check if network need switch to registry chain
                if(chain?.id!=chainConfig.specificRegistryChainDetails.id){
                    toast(`Currently not on Burner Registry Chain: ${chainConfig.specificRegistryChainDetails.name} 
                    Switching to correct chain now for registration...`, {icon: '🚨', duration: 5000})
                    await switchNetwork({chainId: chainConfig.specificRegistryChainDetails.id});
                }

                // use ethers js way
                const provider = new StaticJsonRpcProvider(chainConfig.specificRegistryChainDetails?.rpcUrls.default.http[0]);
                let burnerAccount;
                if(import.meta.env.VITE_ENV == "devWeb3"){
                    burnerAccount = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
                }else{
                    burnerAccount = ethers.Wallet.createRandom();
                }
                console.log("burner account: "+burnerAccount.address)
                burnerAccount = burnerAccount.connect(provider);

                
                const { address: target, privateKey } = burnerAccount;
                const contract = new ethers.Contract(
                    chainConfig.specificRegistryAddress,
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
                console.log("burner address")
                console.log(target)
                await contract.register(signature, address, nonce, {
                    gasPrice: 0,
                    gasLimit: 2100000,
                });

                console.log("burner registered!")
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
                toast.success(`Burner Wallet Created! Switching back to Game Chain: ${chainConfig.chaindetails.id}`, {icon: '🎉'})
                await switchNetwork({chainId: chainConfig.chaindetails.id})
                connect({connector: cachedConnector});
            }
            
            
            }, [
                address,
                chainConfig.registryContractAddress,
                chainConfig.chaindetails.rpcUrls.default.http[0],
                signTypedDataAsync,
                updateBurnerKey,
                chain?.id
            ]),

        onError(e: any) {
            console.error(e);
            //TODO: Toast fail
            toast.error("Wallet Registration Error", {icon: '🚨'})
        },
    });
    
    useEffect(()=>{
        if(!isConnected){
            connect({ connector: connectors[0] });
        }
        if(!burnerIsConnected){
            signup();
        }
    },[])
    

    return (
        <button type="button" 
            
            className={`
            ${burnerIsConnected?
            "text-background1 bg-palegreen hover:bg-whitegreen "
            :
            hasBurnerKey?
            "text-background1 bg-prime1 hover:bg-orange-500"
            :
            "text-white bg-palered hover:bg-prime2 "
            }
            focus:ring-2 focus:outline-none focus:ring-lightbeige 
            font-medium rounded-lg text-xs md:text-base
            px-4 py-2 text-center mr-3 md:mr-0
            max-w-[132px] md:max-w-none
            `}

            onClick={()=>{
                if(hasBurnerKey) return
                signup()
            }}
        >
            {
            (isWagmiLoading || connectorIsLoading || isLoading)?
                <Spinner color="failure" />
            :
            burnerIsConnected?"Using Burner: ":
            hasBurnerKey?"Has Burner":
            !isConnected?"Connect to link Wallet to a Burner=>":
            
            <u>Click here to Register Burner and Link it to Current Wallet</u>}
        </button>
    )
}
