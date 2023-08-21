import React from 'react';
import { useAccount, useConnect, useEnsName, useDisconnect } from 'wagmi';
import { addressShortener } from '../../utils/addressShortener';

const CWButton = () => {
    const { address, isConnected } = useAccount()
    const { data: ensName } = useEnsName({ address })
    const { connect, connectors } = useConnect()
    const { disconnect } = useDisconnect()

    const shortAddress = addressShortener(address as string)
    
    const handleConnect = () => {
        !isConnected ? connect({ connector: connectors[0] }) : disconnect();
    }
    return (
        <button type="button" 
            className="text-white bg-prime1
            hover:bg-prime2 focus:ring-2 focus:outline-none focus:ring-lightbeige 
            font-medium rounded-lg text-sm md:text-base
            px-4 py-2 text-center mr-3 md:mr-0
            max-w-[132px] md:max-w-none
            "

            onClick={() => handleConnect()}
            >
            {isConnected ? (ensName ?? shortAddress) : "Connect Wallet"}
            </button>
    )
}

export default CWButton