import React from 'react';
import { Table } from 'flowbite-react';
import TableRow from './TableRow';

const LobbyTable = () => {
    return (
        <Table hoverable className="table-fixed overflow-y-scroll
        max-h-[400px] min-h-[400px] rounded-lg
        ">
            <Table.Head className="text-white">
                <Table.HeadCell className="bg-greygreen">
                Creator
                </Table.HeadCell>
                <Table.HeadCell className="bg-greygreen">
                Stake (ETH)
                </Table.HeadCell>
                <Table.HeadCell className="bg-greygreen">
                Board
                </Table.HeadCell>
                <Table.HeadCell className="bg-greygreen">
                Players
                </Table.HeadCell>
                <Table.HeadCell className="bg-greygreen">
                Status
                </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y
            bg-red-700 border-2 border-b-green-400 rounded-b-lg
            ">
                <TableRow/>
                <TableRow/>
                <TableRow/>
                <TableRow/>
                <TableRow/>
                <TableRow/>
                <TableRow/>
                <TableRow/>
            </Table.Body>
        </Table>
    )
}

export default LobbyTable