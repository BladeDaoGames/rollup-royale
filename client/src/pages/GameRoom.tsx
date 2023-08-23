import {useEffect, useState} from 'react';
import Phaser from 'phaser';
import GameSceneFlat from '../phaser/GameSceneFlat';
import usePhaserGame from '../phaser/usePhaserGame';
import { BsPlayFill, BsFillPauseFill, BsFillHandThumbsUpFill} from 'react-icons/bs';
import {BiMoneyWithdraw} from 'react-icons/bi';
import { GiHighPunch, GiEntryDoor, GiExitDoor} from 'react-icons/gi';
import { Button, Tooltip } from 'flowbite-react';

import {StakeAndEnterButton,
  LeaveRoomButton
} from '../components/GameRoom/Buttons';

import GameStatusBar from '../components/GameRoom/GameStatusBar';
import FTstatusBar from '../components/GameRoom/FTstatusBar';
import StakedBar from '../components/GameRoom/StakedBar';
import { useParams } from 'react-router-dom';
import { watchReadContracts } from '@wagmi/core';
import RoyaleABI from '../config/abis/Royale.json';
import {ROYALE_ADDRESS} from '../config/constants';
import { formatEther } from 'viem';
import {useAtom} from 'jotai';
import { createGameInfoAtom, createPlayerIds, createPlayerFTs, 
  createPlayerAliveStatus, 
  createPlayerReadiness, createPlayerPauseVote } from '../atoms';

import {subscribePhaserEvent, unsubscribePhaserEvent} from '../phaser/EventsCenter';


const GameRoom = () => {
  const params = useParams();
  const roomId = parseInt(params?.id as string)??0;
  const [gameInfo, setGameInfo] = useAtom(createGameInfoAtom)

  // declare state of array of lenth 4
  const [playerIds, setPlayerIds] = useAtom(createPlayerIds)
  const [playerFTs, setPlayerFTs] = useAtom(createPlayerFTs)
  const [piecePositions, setPiecePositions] = useState<Array<number>>([
      255,255,255,255,
      255,255,255
      ])
  const [playerAliveStatus, setPlayerAliveStatus] = useAtom(createPlayerAliveStatus)
  const [playerReadyStatus, setPlayerReadyStatus] = useAtom(createPlayerReadiness)
  const [playerPauseVote, setPlayerPauseVote] = useAtom(createPlayerPauseVote)
  //const [playerLastMoveTime, setPlayerLastMoveTime] = useState<Array<number>>([0,0,0,0])
  
  const gameConfig = {
      type: Phaser.AUTO,
      parent: "phaser-div",
      backgroundColor: '#34222E',
      render: {
        antialias: false,
      },
      scale:{
          //width: 600,
          //height: 600,
          mode:  Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.Center.CENTER_BOTH,
          width: '100%',
          height: '100%',
          zoom: 1
          
      },
      physics:{
          default: 'arcade',
          arcade:{ gravity: { y: 0 } }
      },
      scene: [GameSceneFlat]
  }
  const game = usePhaserGame(gameConfig);
  // game pointer events
  // game?.events.on('pointerFired', (e)=>{
  //   console.log("phaser outer pointer fired")
  //   console.log(e)
  // })

  const contractCallConfig = {
    contracts:[
      {
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'getGameInfo',
        args: [roomId]
      },{
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'getPlayerIds',
        args: [roomId]
      },{
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'getPlayerFTs',
        args: [roomId]
      },{
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'getPiecePositions',
        args: [roomId]
      },{
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'getPlayerLives',
        args: [roomId]
      },{
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'getPlayerReadiness',
        args: [roomId]
      },{
        address: ROYALE_ADDRESS,
        abi: RoyaleABI.abi,
        functionName: 'getPlayerPauseVote',
        args: [roomId]
      },
      // {
      //   address: ROYALE_ADDRESS,
      //   abi: RoyaleABI.abi,
      //   functionName: 'getPlayerLastMoveTime',
      //   args: [roomId]
      // },
    ],
    listenToBlock: true,
  }

  //get current gameInfo and State in the room
  useEffect(()=>{
    console.log("useGetGameInfo Hook.")
    const unwatch = watchReadContracts(contractCallConfig, (data_)=>{
      console.log("gameinfo watching data_")
      console.log(data_)

      // gameinfo data
      if(data_[0]?.status=="success"){
        setGameInfo({...data_[0]?.result,
          minStake: parseFloat(formatEther(data_[0]?.result?.minStake??0)),
          totalStaked: parseFloat(formatEther(data_[0]?.result?.totalStaked??0))
        })
      }

      //playerIds data
      if(data_[1]?.status=="success"){
        setPlayerIds((data_[1].result as string[])?.map((a: string)=>{
            return a?.toLocaleLowerCase()?? "0x0"
        }))
      }

      //playerFTs data
      if(data_[2]?.status=="success"){
        setPlayerFTs(data_[2].result)
      }

      //piece positions data
      if(data_[3]?.status=="success"){
        setPiecePositions(data_[3].result)
      }

      //playerAlive data
      if(data_[4]?.status=="success"){
        setPlayerAliveStatus(data_[4].result)
      }

      //playerReadiness data
      if(data_[5]?.status=="success"){
        setPlayerReadyStatus(data_[5].result)
      }

      //playerReadiness data
      if(data_[6]?.status=="success"){
        setPlayerPauseVote(data_[6].result)
      }



    });

    subscribePhaserEvent("playerMoveIntentConfirmed", (e)=>{
      console.log("player confirmed move")
      console.log(e)
    })

    return ()=>{
      unwatch();
      unsubscribePhaserEvent("playerMoveIntentConfirmed", ()=>{});
    }
  }, [])
  
  return (

    <div className="flex flex-row items-start justify-center border border-green-500 ">
      <div className="w-full md:w-[768px] mx-auto
              flex flex-col
              p-0 h-screen
              items-center
              border border-green-400
          "
        >
          <div className="w-[60vh]

          ">
              {/* game status bar */}
              <GameStatusBar/>
              <FTstatusBar/>
              <StakedBar/>
              {/* border-2 border-blue-500 rounded-lg */}
              <div id="phaser-div" className="
              App
              h-[60vh] aspect-square mt-0
              
              overflow-hidden
              "/>

              <div className="flex flex-row items-center justify-between py-2 ">

              {/* start game */}
              <Tooltip content="Owner Start Game">
                  <Button className="flex flex-row items-center justify-center py-2 border rounded-lg  border-palered bg-white/5 text-palered hover:bg-palered hover:text-white">
                    <BsPlayFill className="w-8 h-6 mx-0"/>
                    <GiHighPunch className="w-8 h-6 mx-0"/>
                  </Button>
                </Tooltip>

                {/* vote for pause */}
                <Tooltip content="Vote For Game Pause">
                <Button className="py-2 border rounded-lg  border-prime1 text-background1 bg-prime1 hover:text-prime1 hover:bg-prime1/5">
                    <BsFillPauseFill className="w-12 h-6 "/>
                  </Button>
                </Tooltip>

                {/* signal ready */}
                <Tooltip content="Signal Ready Up">
                  <Button className="py-2 border rounded-lg  border-whitegreen text-background1 bg-whitegreen hover:text-whitegreen hover:bg-whitegreen/5">
                    <BsFillHandThumbsUpFill className="w-12 h-6 "/>
                  </Button>
                </Tooltip>

                {/* leave game */}
                <LeaveRoomButton room={roomId}/>

                {/* enter game */}
                <StakeAndEnterButton room={roomId}/>

              </div>

            </div>

            
        </div>
      </div>
  )
}

export default GameRoom