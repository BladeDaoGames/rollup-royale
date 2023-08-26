import React from 'react';
import { useContractRead, useContractEvent} from 'wagmi';
import { readContract } from '@wagmi/core';
import { chainConfig } from '../../config/chainConfig';
import {useAtom, useAtomValue} from 'jotai';
import {createTotalRoomsAtoom, createRoomAtom} from '../../atoms';
import { addressShortener } from '../../utils/addressShortener';
import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';

type RoomRowData ={
    roomId: number,
    owner: string, 
    stake: number, 
    boardc: number, 
    boardr: number, 
    playerCount: number, 
    maxPlayers: number, 
    status: string
}

const TableRow = ({
    roomId, owner, stake, boardc, boardr, 
    playerCount, maxPlayers, status}: RoomRowData) => 
    {
        return (
            <tr className="
            bg-lightbeige
            hover:bg-prime2 hover:text-alertred1
            h-[3.8rem] min-h-[3.8rem]
            ">  
                <td className="px-3 sm:px-6 text-left
                border-b border-b-purpgrey
                ">
                    {roomId}
                </td>
                <td className="px-3 sm:px-6 border-b border-b-purpgrey">
                    {addressShortener(owner)}
                </td>
                <td className="px-3 sm:px-6 border-b border-b-purpgrey">
                    {stake}
                </td>
                <td className="px-3 sm:px-6 border-b border-b-purpgrey">
                    {boardc+"x"+boardr}
                </td>
                <td className="px-3 sm:px-6 border-b border-b-purpgrey">
                    {playerCount+"/"+maxPlayers}
                </td>
                <td className="px-3 sm:px-6 border-b border-b-purpgrey">
                    <Link to={`/game/${roomId}`} className={
                            `rounded-lg text-white px-3 sm:px-6 py-1
                            ${status=="Join"?"bg-prime1 hover:bg-palegreen":
                            "bg-prime3 hover: bg-gameblue"} 
                    `}>
                            {status}
                        </Link>
                </td>
                    </tr>
        )
}

const LobbyTableManual = () => {

    const [totalRooms, setTotalRooms] = useAtom(createTotalRoomsAtoom)
    const [rooms, setRooms] = useAtom(createRoomAtom)

    const { data, isError, isLoading } = useContractRead({
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getTotalGames',
    })

    // listen to new room events and update rooms state
    useContractEvent({
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        eventName: 'GameCreated',
        async listener(log){
            //{_roomId: 2n, _creator: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'}
            const newRoomId = parseInt(log[0]?.args?._roomId)
            console.log("room: " + (newRoomId??"NaN")+"created")
            if(newRoomId > totalRooms) setTotalRooms(newRoomId) // first room at index 0 is placeholder

            await readContract({
                address: chainConfig.royaleContractAddress,
                abi: chainConfig.royaleAbi,
                functionName: 'games',
                args: [newRoomId]
            }).then((res) => {
                // console.log("room info")
                // console.log(res)

                setRooms((prevRoomData)=>{

                    prevRoomData[newRoomId] = {
                        _roomId: newRoomId,
                        _creator: res?.gameCreator,
                        stake: parseFloat(formatUnits(res?.minStake,18))/1.000??999,
                        boardrow: 10,
                        boardcol: 10,
                        players: parseInt(res?.playersCount)??1,
                        maxplayers: 4,
                        status: !res?.hasStarted ? "Join" : res?.hasEnded ? "Ended" : "Spectate",
                    }

                    return [...prevRoomData];

                })
            })
        },
    })

    console.log('rendering rooms data...')
    console.log("number of rooms:"+data??"NaN")

    return (
        <div className="relative shadow-md 
        overflow-y-auto  h-[300px]
        bg-lightbeige
        border-prime2 rounded-lg border-2
        ">
            <table className="w-full 
                table-auto
                text-xs 
                sm:text-sm
                md:text-base
                text-center text-gray-500
                sm:font-bold
            "
            >
                <thead className="
                    text-white font-bold
                    border-b border-prime2
                ">
                    <tr className="
                    bg-greygreen
                    ">
                        <th scope="col" className="pl-4 pr-3 py-3">
                            Room Id
                        </th>
                        <th scope="col" className="px-6 py-3">
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
                    {
                        rooms.map((r)=>{
                            if(r.status=="Ended") return;
                            return <TableRow
                                        roomId={r._roomId}
                                        owner={r._creator}
                                        stake={r.stake}
                                        boardc={r.boardcol}
                                        boardr={r.boardrow}
                                        playerCount={r.players}
                                        maxPlayers={r.maxplayers}
                                        status={r.status}
                                    />
                        })
                    }
                </tbody>
            </table>
        </div>
    )
}

export default LobbyTableManual