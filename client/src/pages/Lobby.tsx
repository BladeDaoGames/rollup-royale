import React from 'react';
import LobbyTable from '../components/LobbyTable/LobbyTableManual';
import TableBrowserPanel from '../components/LobbyTable/TableBrowserPanel';
import ChatWindow from '../components/ChatWindow/ChatWindow';
import {RankingsDropdown} from '../components/LobbyTable/RankingsDropdown';
import { UtilsBar } from '../components/LobbyTable/UtilsBar';
import { useRankingsValues } from '../hooks/useRankingsValues';

const Lobby = () => {
    console.log("lobby refresh.")
    //useRankingsValues();
    return (
        <div className="w-full md:w-[768px] mx-auto
            flex flex-col
            p-0 h-screen
        ">  
            {/* < RankingsDropdown /> */}
            < UtilsBar />
            <LobbyTable/>
            <TableBrowserPanel />
            
            <div className="
                h-2/5 min-h-[240px] mt-1
                rounded-b-lg
            ">
            
            <ChatWindow room="lobby1" msgLimit={100} />
            </div>
        </div>
    )
}

export default Lobby