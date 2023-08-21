import React from 'react';
import RoomSearch from './RoomSearch';
import TablePagination from './TablePagination';
import CreateRoomButton from './CreateRoomButton';

const TableBrowserPanel = () => {
    return (
        <div className="
        pt-2 pb-1 px-2
        grid grid-cols-3
        items-center
        ">
            <CreateRoomButton/>
            <TablePagination/>
            <RoomSearch/>
        </div>
    )
}

export default TableBrowserPanel