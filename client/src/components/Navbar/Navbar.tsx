//import React from 'react';
import { Navbar } from 'flowbite-react';
import ConnectWalletButton from '../ConnectWalletButton/CWButton';
//import {VscFeedback} from 'react-icons/vsc';

const CustomNavBar = () => {
    return (
        <Navbar className='bg-background1 fixed w-full z-20 top-0 left-0 py-0'>
            <Navbar.Brand href={import.meta.env.VITE_HOSTSITE || "localhost:3000"}>
                <img
                    alt="Loot Royale Logo"
                    className="mr-3 h-20 fill-prime2"
                    src="/brownlogo.jpg"
                />
                <span className="text-2xl italic sm:text-3xl
                    font-bold text-prime2">
                    Loot Royale</span>
                </Navbar.Brand>
            
            <Navbar.Collapse className="ml-auto mr-2">
                <Navbar.Link href="#">
                    <div className="
                        text-prime2 md:text-background1
                        md:bg-lightbeige
                        font-medium md:rounded-lg text-sm md:text-base
                        md:px-4 md:py-2 md:text-center
                        md:hover:bg-darkbeige
                        ">
                        Game Rules</div>
                </Navbar.Link>
            </Navbar.Collapse>
            <div className="flex">
                <ConnectWalletButton/>
                <Navbar.Toggle className="fill-current text-prime2 hover:bg-prime2 hover:text-white" />
            </div>

            
            
        </Navbar>
    )
}

export default CustomNavBar