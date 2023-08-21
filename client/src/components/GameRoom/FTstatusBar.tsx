import React from 'react';
import { Tooltip } from 'flowbite-react';
import { useAccount } from 'wagmi';
import { addressShortener } from '../../utils/addressShortener';

const FTstatusBar = () => {

  const {address} = useAccount();
  return (
    <div className="
    flex flex-row justify-between items-center
    text-white font-semibold my-1 mt-2
    ">
    
    <div className="mx-2 w-2/5 pr-4
      flex justify-between items-center
    ">
      <span>Room Owner: </span> <span className="mx-1">
      {addressShortener(address as string)}</span>
    </div>
    
    <div className="grid grid-flow-col flex-auto
    justify-stretch items-center mx-1
    rounded-md overflow-hidden
    ">

      
      <div className="bg-green-600
      text-white flex justify-center
      ">
        <Tooltip content="Player 1 FT">
          P1: 100
        </Tooltip>
        </div>

      <div className="bg-yellow-300
      text-gray-800 flex justify-center
      ">
        <Tooltip content="Player 2 FT">
          P2: 100
        </Tooltip>
        </div>

      <div className="bg-palered
      text-white flex justify-center
      ">
        <Tooltip content="Player 3 FT">
          P3: 100
        </Tooltip>
        </div>

      <div className="bg-palegreen
      text-gray-800 flex justify-center
      ">
        <Tooltip content="Player 4 FT">
          P4: 100
        </Tooltip>
        </div>

    </div>

    </div>
  )
}

export default FTstatusBar