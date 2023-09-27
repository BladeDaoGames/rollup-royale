import React, {useMemo} from 'react';
import { useContractRead } from 'wagmi';
import {chainConfig} from '../../config/chainConfig';
import { useAccount } from 'wagmi';
import { NONE } from 'phaser';
import { useNavigate } from 'react-router-dom';
import {toast} from 'react-hot-toast';

export const UtilsBar = () => {
    const {address} = useAccount();
    const navigate = useNavigate();
    const { data: roomId, isError, isLoading } = useContractRead({
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'playerInGame',
        args: [address]
    })

    const getRoomIdInput = () =>{
        const input = document.getElementById("room-router") as HTMLInputElement;
        if(input){
            if(input.value>0){
                navigate(`/game/${input.value}`)
            }else if (input.value.length>0){
                toast.error("Invalid room number. Pls input a room number from greater than 0.")
            }
            return input.value;
        }
        return NONE;
    }
    return <div className="
        mb-1
        flex flex-row w-full
        justify-between max-h-[3rem] z-20
        bg-background1/80
        items-end overflow-y-visible
        ">
            
            {/* room status */}
            <div className="bg-lightbeige text-background1
            rounded-md border border-prime2
            mr-1 flex flex-nowrap items-center">
                <span className="ml-2 mr-1 font-semibold
                ">Showing only last 88 rooms.</span>
                { parseInt(roomId)>0?
                <>
                <span className="
                rounded-md 
                bg-background1 text-white
                px-2 py-1
                ">You are in room: {parseInt(roomId)}</span>
                </>
                :<>
                <span className="
                rounded-md 
                bg-background1 text-white
                px-2 py-1
                ">You are not in any room.</span>
                </>
            } 
            </div>

            {/* room router */}
            <div>
                <button className="
                rounded-md px-2 py-1 font-semibold
                border border-prime2
                text-background1
                bg-whitegreen hover:bg-palegreen
                "
                onClick={()=>{getRoomIdInput()}}
                ><span className="mr-1">{`Let me join room =>`} </span>
                <input type="text" id="room-router"
                className="mx-1 text-black text-xs py-0.5 w-[70px]" />
                </button>
                
            </div>
        </div>
    }