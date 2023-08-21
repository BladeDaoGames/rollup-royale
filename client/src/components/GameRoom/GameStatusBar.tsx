import React from 'react';
import {BsHourglassSplit} from 'react-icons/bs';
import { Tooltip } from 'flowbite-react';


const GameStatusBar = () => {
    return (
        <div className="flex flex-row
            justify-between items-center
            z-20
            ">

                {/* game status */}
                <div className="flex flex-row 
                justify-start items-center 
                text-white font-semibold text-base
                ">
                <span className="mx-2">Game Status:</span> 
                <span className="px-4 py-1 
                    bg-lightbeige text-background1
                    rounded-lg
                    ">Pre-Start</span>
                </div>
                
                {/* players status */}
                <div className="flex flex-row
                justify-end items-center px-0
                ">
                <span className="text-white font-bold
                mx-2
                ">
                    Players Status: </span>
                
                <Tooltip content="Waiting Player 1" 
                placement="bottom">
                    <div className="
                    flex flex-row items-center
                    border rounded-md border-prime1
                    text-prime1 h-8 py-1 px-2 mx-1
                    "><BsHourglassSplit/>
                    </div></Tooltip>

                <Tooltip content="Waiting Player 2" 
                placement="bottom">    
                <div className="
                flex flex-row items-center
                border rounded-md border-prime1
                text-prime1 h-8 py-1 px-2 mx-1
                "><BsHourglassSplit/>
                </div>
                </Tooltip>

                <Tooltip content="Waiting Player 3"
                placement="bottom">
                <div className="
                flex flex-row items-center
                border rounded-md border-prime1
                text-prime1 h-8 py-1 px-2 mx-1
                "><BsHourglassSplit/>
                </div>
                </Tooltip>

                <Tooltip content="Waiting Player 4"
                placement="bottom">
                <div className="
                flex flex-row items-center
                border rounded-md border-prime1
                text-prime1 h-8 py-1 px-2 mx-1
                "><BsHourglassSplit/>
                </div>
                </Tooltip>

                </div>
            </div>
        )
}

export default GameStatusBar