import React, {useMemo} from 'react';
import { useContractEvent} from 'wagmi';
import { readContract } from '@wagmi/core';
import { chainConfig } from '../../config/chainConfig';
import {useAtom, useAtomValue} from 'jotai';
import {createTotalRoomsAtoom, createRoomAtom, 
    lobbyRoomPageCount, lobbyTextSearchInput} from '../../atoms';
import { addressShortener } from '../../utils/addressShortener';
import { Link } from 'react-router-dom';
import { formatUnits } from 'viem';
import { parseGameInfoObject } from '../../hooks/useFetchRooms';

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
                            status=="Spectate"?"bg-prime3 hover:bg-gameblue":
                            "bg-greyness hover: bg-greygreen"
                        } 
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
    const pageCount = useAtomValue(lobbyRoomPageCount)
    const searchInput = useAtomValue(lobbyTextSearchInput)

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
                args: [newRoomId] //this argument will return only 1 room
            }).then((res) => {
                // console.log("room info 2")
                //console.log(res)

                setRooms((prevRoomData)=>{

                    prevRoomData[newRoomId] = parseGameInfoObject(res, newRoomId);

                    return [...prevRoomData];

                })
            })
        },
    })

    const LobbyPageData = useMemo(()=>{
        const pageData = rooms?.map((x)=>x).reverse()?.filter(
            (el) => {
                //if no input then return the original
                if (searchInput === '') {
                    return el;
                }
                //return the item which contains the user input
                else {
                    return el?._creator?.toLowerCase().includes(searchInput)
                }
            })?.filter(
                (r,i)=>{
                    if(r.status=="Ended" || r.status=="Abandoned"){
                        return;
                    }else{return r;}
            })?.map(
                (r,i)=>{
            //console.log(i, r)
            return <TableRow
                        key={i}
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
        function paginate(array: (React.JSX.Element|undefined)[], page_size:number, page_number:number) {
            return array.slice((page_number - 1) * page_size, page_number * page_size);
        }

        return paginate(pageData, 4, pageCount)
    },[pageCount, searchInput, rooms])
    return useMemo(()=>(
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
                            Room
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Room Owner
                        </th>
                        <th scope="col" className="px-6 py-3 font-normal text-sm">
                            Stake(BLADE)
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
                    {LobbyPageData}
                </tbody>
            </table>
        </div>
    ),[LobbyPageData])
}

export default LobbyTableManual