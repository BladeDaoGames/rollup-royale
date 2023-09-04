import React from 'react';
import LobbyTable from '../components/LobbyTable/LobbyTableManual';
import TableBrowserPanel from '../components/LobbyTable/TableBrowserPanel';
import ChatWindow from '../components/ChatWindow/ChatWindow';
import {RankingsDropdown} from '../components/LobbyTable/RankingsDropdown';

const Lobby = () => {
    return (
        <div className="w-full md:w-[768px] mx-auto
            flex flex-col
            p-0 h-screen
        ">  
            < RankingsDropdown />
            <LobbyTable/>
            <TableBrowserPanel />
            
            <div className="
                h-1/3 min-h-[240px] mt-1
                rounded-b-lg
            ">
                
            <ChatWindow room="lobby1" msgLimit={100} />
            </div>
        </div>
    )
}

export default Lobby