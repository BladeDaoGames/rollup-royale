import {useEffect, useState, useMemo, useRef} from 'react';
import Phaser from 'phaser';
import GameSceneFlat from '../phaser/GameSceneFlat';
import usePhaserGame from '../phaser/usePhaserGame';

import {StakeAndEnterButton,
  LeaveRoomButton, ReadyUpButton, PlayerPauseButton, StartGameButton
} from '../components/GameRoom/Buttons';
import { TxnSenderHOC } from '../components/GameRoom/TxnSenderHOC';

import GameStatusBar from '../components/GameRoom/GameStatusBar';
import FTstatusBar from '../components/GameRoom/FTstatusBar';
import StakedBar from '../components/GameRoom/StakedBar';
import { useParams } from 'react-router-dom';
import { watchReadContracts } from '@wagmi/core';
import { chainConfig } from '../config/chainConfig';
import { formatEther } from 'viem';
import {useAtom, useSetAtom} from 'jotai';
import { createGameInfoAtom, createPlayerIds, createPlayerFTs, 
  createPlayerAliveStatus, createPlayerReadiness, createGameSceneReadiness,
  createPlayerPauseVote} from '../atoms';
import { useAccount } from 'wagmi';
import {boardPositionToGameTileXY} from '../utils/gameCalculations'

import {subscribePhaserEvent, unsubscribePhaserEvent} from '../phaser/EventsCenter';
import ChatWindow from '../components/ChatWindow/ChatWindow';


const GameRoom = () => {
  const params = useParams();
  const roomId = parseInt(params?.id as string)??0;
  const { address, isConnected } = useAccount();
  const [gameInfo, setGameInfo] = useAtom(createGameInfoAtom)
  const [gameSceneReady, setGameSceneReady] = useAtom(createGameSceneReadiness)

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
  const [playerLoginCount, setPlayerLoginCount] = useState(0)
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
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getGameInfo',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPlayerIds',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPlayerFTs',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPiecePositions',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPlayerLives',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPlayerReadiness',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPlayerPauseVote',
        args: [roomId]
      },
      // {
      //   address: chainConfig.royaleContractAddress,
      //   abi: chainConfig.royaleAbi,
      //   functionName: 'getPlayerLastMoveTime',
      //   args: [roomId]
      // },
    ],
    listenToBlock: true,
  }

  const playerId = playerIds.indexOf(address?.toLowerCase() as string)
  const playerInGame = playerId>=0
  const gamescene = game?.scene?.keys?.GameSceneFlat

  if(import.meta.env.VITE_ENV=="dev")console.log("game room render")

  // runs to position all pieces after every state refresh
  // runs first time and everytime pages freshes, player come into game, address change
  useEffect(()=>{
    if(import.meta.env.VITE_ENV=="dev")console.log("refreshing positions")
    if(import.meta.env.VITE_ENV=="dev")console.log(piecePositions)
    // console.log(gameSceneReady)
    // console.log(gamescene?.player1)
    
    //executes if game is ready to be controlled
    if(gameSceneReady&&gamescene?.player1){

        // execute to position all pieces
        piecePositions.forEach((p,i)=>{
            //assign position if position is not 255 (null)
            if(p!=255){
              const TileXY = boardPositionToGameTileXY(p)

              //FOR Players, we need to check if their move intent is different
              //from their current position, if so, then don't update and wait for
              //txn to fulfill their position
              //(Note if they get killed before their move intent fulfilled, 
              // their position will be empty and they will be removed from the game)

              //update if player has not logged in yet (first page refresh)
              if(playerLoginCount<1){
                  gamescene?.setPiecePosition(i, TileXY.x, TileXY.y)
                  setPlayerLoginCount(()=>1)

              // rule that applies to only the 4 players
              } else if(i<4){
                const moveIntentXY = {
                    x:gamescene?.pieceArray[i].moveIntentPos.x,
                    y:gamescene?.pieceArray[i].moveIntentPos.y
                  }
                
                //update only if move intent is same as returned position

                // console.log(`player${i+1} returned pos: `, TileXY)
                // console.log(`player${i+1} move intent: `, moveIntentXY)
                if((moveIntentXY.x==TileXY.x)&&(moveIntentXY.y==TileXY.y)){
                  gamescene?.setPiecePosition(i, TileXY.x, TileXY.y)
                }
              }
              
            }else{
              //if no item there, then remove item
              gamescene?.removePiecePosition(i)
            }
        })


        // execute if player is in the game
        if(playerInGame){
          //assign user to player if player is not tagged to user
          const userEntity = gamescene?.user?.entity
          const userId = parseInt(userEntity?.substr(userEntity?.length - 1))??null
          
          if(userId!=(playerId+1)){
            gamescene?.setUserToPlayer(playerId)
            // then set player to contract location to init yellow move guide
            //1st get the location in the contract
            const userBoardPosition = piecePositions[playerId]
            const userGameTileXY = boardPositionToGameTileXY(userBoardPosition)
            gamescene?.contractSetPlayerLoc(
              userGameTileXY.x, userGameTileXY.y
                )
          }
        }
    }
    
  },[gameSceneReady, piecePositions, playerInGame, address])
  
  //get current gameInfo and State in the room
  useEffect(()=>{
    if(import.meta.env.VITE_ENV=="dev")console.log("useGetGameInfo Hook.") // only once
    const unwatch = watchReadContracts(contractCallConfig, (data_)=>{
      // refreshes each time chain state changes
      console.log("chain state refreshed.")
      if(import.meta.env.VITE_ENV=="dev")console.log(data_)

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
    return ()=>{
      unwatch();
    }
  }, [])

  //suscribe to game events
  useEffect(()=>{
    subscribePhaserEvent("playerMoveIntentConfirmed", (e)=>{
      //console.log("player confirmed move")
      //console.log(e)
    })

    subscribePhaserEvent("playersLoaded", (e)=>{
      console.log("game scene loaded.")
      setGameSceneReady(true)
      //console.log(e)
    })

    return ()=>{
      unsubscribePhaserEvent("playerMoveIntentConfirmed", ()=>{});
      unsubscribePhaserEvent("playersLoaded", ()=>{});
    }

  },[])
  
  return (

    <div className="flex flex-row 
    flex-wrap
    justify-center items-start 
    w-full
    ">
      {/* <button className="w-10 h-10 bg-red-700" onClick={()=>{console.log(gamescene.player1)}}/> */}
      
      {/* balancing div */}
      <div className="flex-1 w-full max-w-[768px]">
          <TxnSenderHOC game={game} roomId={roomId}/>
        </div>

      {/* main center container panel w-768px */}
        <div className="justify-self-center w-full md:w-[768px]
              flex flex-col
              p-0 h-screen
              items-center
          "
        >

          {/* game container is 60vh for square map*/}
          <div className="w-[60vh]">
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
              <StartGameButton room={roomId}/>

                {/* vote for pause */}
                <PlayerPauseButton room={roomId}/>

                {/* signal ready */}
                <ReadyUpButton room={roomId}/>

                {/* leave game */}
                <LeaveRoomButton room={roomId}/>

                {/* enter game */}
                <StakeAndEnterButton room={roomId}/>

              </div>

            </div>
        </div>

        {/* chat window */}
        <div className="flex-1 w-full max-w-[768px] h-[30vh] md:h-[90vh]">
          <ChatWindow room={roomId?.toString()} msgLimit={100} />
        </div>
      
      </div>
  )
}

export default GameRoom