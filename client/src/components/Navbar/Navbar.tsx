//import React from 'react';
import { Navbar } from 'flowbite-react';
import ConnectWalletButton from '../ConnectWalletButton/CWButton';
import {SignUpButton} from '../ConnectWalletButton/SignUpButton';
//import {VscFeedback} from 'react-icons/vsc';
import {createDevPrivateKey} from '../../atoms';
import { useSetAtom } from 'jotai';
import { useAccount, useBalance, useNetwork } from 'wagmi';

const CustomNavBar = () => {
    const setDevPk = useSetAtom(createDevPrivateKey);
    const { address, isConnected } = useAccount()
    const { data, isError, isLoading } = useBalance({address, cacheTime: 2_000,})
    const { chain } = useNetwork()
    
    return (
        <Navbar className='top-0 left-0 z-20 w-full py-0 bg-background1'>
            <Navbar.Brand href={import.meta.env.VITE_HOSTSITE || "localhost:3000"}>
                <img
                    alt="Loot Royale Logo"
                    className="h-20 mr-3 fill-prime2"
                    src="/brownlogo.jpg"
                />
                <span className="text-2xl italic font-bold sm:text-3xl text-prime2">
                    Loot Royale</span>
                </Navbar.Brand>
                
                {/* Dev tooling */}
                {(import.meta.env.VITE_ENV == "dev")&&
            <button className="w-10 h-10 bg-red-700"
            onClick={()=>{setDevPk("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d")}}></button>}


            <Navbar.Collapse className="ml-auto mr-2">
                <Navbar.Link href="#">
                    <div className="text-sm font-medium  text-prime2 md:text-background1 md:bg-lightbeige md:rounded-lg md:text-base md:px-4 md:py-2 md:text-center md:hover:bg-darkbeige">
                        Game Rules</div>
                </Navbar.Link>
            </Navbar.Collapse>
            <Navbar.Collapse className="mr-2">
                <Navbar.Link href="#">
                    <div className="text-sm font-medium  text-prime2 md:text-background1 md:bg-prime2 md:rounded-lg md:text-base md:px-4 md:py-2 md:text-center md:hover:bg-darkbeige">
                        {`$${chain?.nativeCurrency.symbol}: ${parseFloat(data?.formatted).toFixed(3)??"??"}`}</div>
                </Navbar.Link>
            </Navbar.Collapse>
            <Navbar.Collapse className="mr-2">
                <SignUpButton />
            </Navbar.Collapse>
            <div className="flex">
                <ConnectWalletButton/>
                <Navbar.Toggle className="fill-current text-prime2 hover:bg-prime2 hover:text-white" />
            </div>

            
            
        </Navbar>
    )
}

export default CustomNavBar