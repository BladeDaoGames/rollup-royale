import React from 'react';
import { useContractRead, useContractEvent} from 'wagmi';
import { readContract } from '@wagmi/core';
import RoyaleABI from '../../config/abis/Royale.json';
import {ROYALE_ADDRESS} from '../../config/constants';
import {useAtom} from 'jotai';
import {createTotalRoomsAtoom, createRoomAtom} from '../../atoms';

const TableRow = () => {
    return (
        <tr className="
        bg-lightbeige
        hover:bg-prime2 hover:text-alertred1
        border-purpgrey
        h-[3.8rem] min-h-[3.8rem]
        ">
                    
                    <td className="px-3 sm:px-6 py-4">
                        0123456789
                    </td>
                    <td className="px-3 sm:px-6">
                        0.1
                    </td>
                    <td className="px-3 sm:px-6">
                        10 x 10
                    </td>
                    <td className="px-3 sm:px-6">
                        2/4
                    </td>
                    <td className="px-3 sm:px-6">
                        <button className="
                                bg-prime1 rounded-lg text-white px-3 sm:px-6 py-1
                                hover:bg-palegreen
                            ">
                                Join
                            </button>
                    </td>
                </tr>
    )
}

const LobbyTableManual = () => {

    const [totalRooms, setTotalRooms] = useAtom(createTotalRoomsAtoom)
    const [rooms, setRooms] = useAtom(createRoomAtom)

    const { data, isError, isLoading } = useContractRead({
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'getTotalGames',
    })

    // listen to new room events and update rooms state
    useContractEvent({
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        eventName: 'GameCreated',
        async listener(log){
            //{_roomId: 2n, _creator: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'}
            const newRoomId = parseInt(log[0]?.args?._roomId)
            console.log("room: " + newRoomId??"NaN"+"created")
            if(newRoomId > totalRooms) setTotalRooms(newRoomId) // first room at index 0 is placeholder

            await readContract({
                address: ROYALE_ADDRESS,
                abi: RoyaleABI.abi,
                functionName: 'games',
                args: [newRoomId]
            }).then((res) => {
                // console.log("room info")
                // console.log(res)

                const newRoomsData = [...rooms]
                newRoomsData[newRoomId] = {
                    _roomId: newRoomId,
                    _creator: res?.gameCreator,
                    stake: parseInt(res?.minStake)??999,
                    boardrow: 10,
                    boardcol: 10,
                    players: parseInt(res?.playersCount)??1,
                    maxplayers: 4,
                    status: !res?.hasStarted ? "Join" : res?.hasEnded ? "Ended" : "Spectate",
                }

                // sample res
                // const sampleRes = {

                //     gameAbandoned: false,
                //     gameCreator: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                //     gamePaused: false,
                //     hasEnded: false,
                //     hasStarted: false,
                //     itemCount: 0,
                //     minStake: 100000000000000000n,
                //     playersCount: 1,
                //     totalStaked: 100000000000000000n,
                // }


            })

            // let newRoomData = [...rooms]
            // rooms[newRooms] = {
            //     ...log?.args,
            //     stake: 
            //     boardrow: number;
            //     boardcol: number;
            //     players: number;
            //     maxplayers: number;
            //     status: string;

            // }
        },
    })

    return (
        <div className="relative shadow-md 
        overflow-y-auto  h-[300px]
        bg-lightbeige
        border-prime2 rounded-lg border-2
        "><div>{parseInt(data as BigInt)}</div>
            <table className="w-full 
                table-auto
                text-xs 
                sm:text-sm
                md:text-base
                text-center text-gray-500
                sm:font-bold
            ">
                <thead className="
                    text-white font-bold
                    border-b border-prime2
                ">
                    <tr className="
                    bg-greygreen
                    ">
                        <th scope="col" className="pl-4 pr-3 py-3">
                            Room Owner
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Stake (ETH)
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Board
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Players
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    <TableRow/>
                    <TableRow/>
                    <TableRow/>
                    <TableRow/>
                </tbody>
            </table>
        </div>
    )
}

export default LobbyTableManual