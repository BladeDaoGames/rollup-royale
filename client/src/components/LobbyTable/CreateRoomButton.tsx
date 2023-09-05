import React, {useState, useEffect} from 'react';
import {Button, Modal} from 'flowbite-react';
import { chainConfig } from '../../config/chainConfig';
import { parseEther } from 'viem';
import { useAccount, useContractWrite, usePrepareContractWrite, useNetwork} from 'wagmi';
import { Spinner } from 'flowbite-react';
import toast from 'react-hot-toast';
import {lobbyRoomPageCount} from '../../atoms';
import { useSetAtom } from 'jotai';

const CreateRoomButton = () => {
    const [openModal, setOpenModal] = useState<string | undefined>();
    const props = { openModal, setOpenModal };
    const {address, isConnected} = useAccount();
    const { chain } = useNetwork()
    const setRoomPageCount = useSetAtom(lobbyRoomPageCount)
    const { data, isLoading, error, isSuccess, write } = useContractWrite({
        address: chainConfig?.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'createGame',
    })

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const roomname = e.currentTarget.roomowner.value;
        const boardheight = e.currentTarget.boardrows.value;
        const boardwidth = e.currentTarget.boardcols.value;
        const gameplayernums = e.currentTarget.maxplayers.value;
        const minstake = parseEther(e.currentTarget.minstake.value);
        // console.log("create room params")
        // console.log("roomname: "+ roomname)
        // console.log("board size: "+ boardheight+"x"+boardwidth)
        // console.log("max players: "+ gameplayernums)
        console.log("minimum stake: "+ minstake)
        
        write({
            args: [minstake.toString()],
            value: minstake,
        })
    }

    useEffect(() => {
        if (isSuccess && props.openModal === 'createGameRoom') {
            console.log("create room success")
            toast.success("Room Created Successfully", 
                {icon: '🎉', style:{}})
            props.setOpenModal(undefined);
            setRoomPageCount(1);
        } else if (error) {
            console.log(error)
            toast.error("Room Creation Failed", {icon: '🚨'})
        }


    }, [isSuccess, error, isLoading, data, address])

    return (
        <>
            <Button 
                disabled={!isConnected}
                onClick={() => props.setOpenModal('createGameRoom')}
                className="px-4 py-0
                            text-xs sm:text-sm md:text-base
                            text-white font-semibold
                            bg-prime1
                            border-orange-500 rounded-lg
                            h-full w-[8rem] sm:w-auto mx-0 md:mr-7
                            align-middle
                            hover:bg-prime2 hover:text-white
                            focus:ring-palegreen focus:border-palegreen
                            focus:border-2
                    ">
                        {
                            isLoading?<Spinner color="failure"/>
                            :
                            isConnected?`Create Game + `: 
                        'Connect Wallet to Play'}</Button>
            
            
            <Modal show={props.openModal === 'createGameRoom'} onClose={() => props.setOpenModal(undefined)}
                className="text-background1 font-semibold"
                size="lg"
            >   
                <form onSubmit={handleSubmit}>
                    <Modal.Header className="bg-lightbeige
                    rounded-t-xl border border-background1
                    " >Create Game Room</Modal.Header>
                        <Modal.Body className="bg-lightbeige
                        border border-x-background1 px-10
                        ">
                            <div className="flex flex-col
                            w-full justify-start items-center
                            ">  
                                {/* owner */}
                                <div className="
                                flex flex-row justify-between items-center
                                w-full mx-2 my-1
                                ">
                                    <label className="mx-2 ml-0">Room Owner</label> 
                                    <input type="text"
                                        defaultValue={address}
                                        className="rounded-lg
                                        align-middle text-right
                                        px-2 w-2/3 text-sm
                                        bg-gray-500/70
                                        "
                                        disabled={true}
                                        name="roomowner"
                                    />
                                    </div>

                                {/* stake */}
                                <div className="
                                flex flex-row justify-between items-center
                                w-full mx-2 my-1
                                ">
                                    <label className="mx-2 ml-0">Minimum 
                                        <span className="bg-prime2 
                                        border border-background1 rounded-md 
                                        px-2 py-1 mx-1
                                        text-white
                                        ">
                                            {`$${chain?.nativeCurrency.symbol}`}
                                        </span>
                                        Stake
                                    </label> 
                                    <input type="number"
                                        defaultValue={0.1}
                                        step={0.01}
                                        min={0.1}
                                        className="rounded-lg
                                        align-middle text-right
                                        px-2 w-1/3
                                        "
                                        name="minstake"
                                    />
                                    </div>
                                
                                {/* Board Size */}
                                <div className="
                                flex flex-row justify-end items-center
                                w-full mx-2 my-1
                                ">
                                    <label className="ml-0 mr-auto">Board Size</label> 
                                    <input type="number"
                                        defaultValue={10}
                                        step={1}
                                        min={2}
                                        className="rounded-lg
                                        align-middle text-right
                                        px-2 w-1/5
                                        bg-gray-500/70
                                        "
                                        disabled={true}
                                        name="boardrows"
                                    />
                                    <span className="mx-2">X</span>
                                    <input type="number"
                                        defaultValue={10}
                                        step={1}
                                        min={2}
                                        className="rounded-lg
                                        align-middle text-right
                                        px-2 w-1/5
                                        bg-gray-500/70
                                        "
                                        disabled={true}
                                        name="boardcols"
                                    />
                                    </div>
                                
                                {/* max players */}
                                <div className="
                                flex flex-row justify-between items-center
                                w-full mx-2 my-1
                                ">
                                    <label className="mx-2 ml-0">Maximum Players</label> 
                                    <input type="number"
                                        defaultValue={4}
                                        step={1}
                                        min={2}
                                        className="rounded-lg
                                        align-middle text-right
                                        px-2 w-1/3
                                        bg-gray-500/70
                                        "
                                        disabled={true}
                                        name="maxplayers"
                                    />
                                    </div>


                            </div>
                        </Modal.Body>
                    <Modal.Footer className="bg-lightbeige
                        rounded-b-xl border border-background1
                    ">
                        <button className="
                        bg-prime1 text-white
                        py-2 px-4 rounded-lg
                        font-semibold
                        hover:text-background1
                        hover:bg-prime2
                        "
                        type="submit"
                        >Create</button>
                    </Modal.Footer>
                </form>
            </Modal>
        </>
    )
}

export default CreateRoomButton