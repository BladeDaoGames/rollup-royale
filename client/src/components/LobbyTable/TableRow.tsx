import React from 'react';
import { Table } from 'flowbite-react';

const TableRow = () => {
    return (
        <Table.Row className="bg-lightbeige
        font-bold
        hover:bg-prime2 hover:text-alertred1 hover:text-base
        dark:border-gray-700 dark:bg-gray-800
        ">
                        <Table.Cell className="">
                            0123456789
                        </Table.Cell>
                        <Table.Cell className="">
                            0.1 
                        </Table.Cell>
                        <Table.Cell className="">
                            10 x 10
                        </Table.Cell>
                        <Table.Cell className="">
                            2/4
                        </Table.Cell>
                        <Table.Cell className="">
                            <button className="
                                bg-prime1 rounded-lg text-white px-4 py-1
                                hover:bg-palegreen
                            ">
                                Join
                            </button>
                        </Table.Cell>
                    </Table.Row>
    )
}

export default TableRow