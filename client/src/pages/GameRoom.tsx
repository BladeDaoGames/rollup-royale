import React, {useEffect, useRef} from 'react';
import Phaser from 'phaser';
import GameSceneFlat from '../phaser/GameSceneFlat';
import usePhaserGame from '../phaser/usePhaserGame';
import { BsPlayFill, BsFillPauseFill, BsFillHandThumbsUpFill} from 'react-icons/bs';
import {BiMoneyWithdraw} from 'react-icons/bi';
import { GiHighPunch, GiEntryDoor, GiExitDoor} from 'react-icons/gi';
import { Button, Tooltip } from 'flowbite-react';
import GameStatusBar from '../components/GameRoom/GameStatusBar';
import FTstatusBar from '../components/GameRoom/FTstatusBar';


const GameRoom = () => {
  
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
          mode:  Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
          autoCenter: Phaser.Scale.Center.CENTER_BOTH,
          width: '100%',
          height: '100%',
          zoom: 3
          
      },
      physics:{
          default: 'arcade',
          arcade:{ gravity: { y: 0 } }
      },
      scene: [GameSceneFlat]
  }
  usePhaserGame(gameConfig);

  return (
    <div className="w-full md:w-[768px] mx-auto
            flex flex-col
            p-0 h-screen
            
            items-center
        "
      >
        <div className="w-[60vh]

        ">
            {/* game status bar */}
            <GameStatusBar/>

            <FTstatusBar/>
            {/* border-2 border-blue-500 rounded-lg */}
            <div id="phaser-div" className="
            App
            h-[60vh] aspect-square mt-0
            
            overflow-hidden
            "/>

            <div className="flex flex-row
                py-2
                
                justify-between items-center
                ">

            {/* start game */}
            <Tooltip content="Owner Start Game">
                <Button className="
                  flex flex-row items-center justify-center
                  rounded-lg border border-palered
                  bg-white/5 text-palered
                  hover:bg-palered
                  hover:text-white 
                  py-2
                ">
                  <BsPlayFill className="mx-0
                  w-10 h-6"/>
                  <GiHighPunch className="mx-0 
                  w-10 h-6"/>
                </Button>
              </Tooltip>

              {/* vote for pause */}
              <Tooltip content="Vote For Game Pause">
              <Button className="
                rounded-lg border border-prime1
                text-background1 bg-prime1
                hover:text-prime1 hover:bg-prime1/5 
                py-2
                ">
                  <BsFillPauseFill className="
                  w-12 h-6"/>
                </Button>
              </Tooltip>

              {/* signal ready */}
              <Tooltip content="Signal Ready Up">
                <Button className="
                  rounded-lg border border-whitegreen
                  text-background1 bg-whitegreen 
                  hover:text-whitegreen hover:bg-whitegreen/5
                  py-2
                  ">
                  <BsFillHandThumbsUpFill className="
                  w-12 h-6
                  "/>
                </Button>
              </Tooltip>

              {/* leave game */}
              <Tooltip content="Leave Room Before Game Start">
                <Button className="
                  rounded-lg border border-prime3
                  text-background1 bg-prime3 
                  hover:text-prime3 hover:bg-prime3/5
                  py-2
                  ">
                  <GiExitDoor className="w-12 h-6"/>
                </Button>
              </Tooltip>

              {/* enter game */}
              <Tooltip content="~ Stake and Enter Game ~">
                <Button className="
                  flex flex-row items-center justify-center
                  rounded-lg border border-prime2
                  text-background1 bg-prime2 
                  hover:text-prime2 hover:bg-prime2/5
                  py-2
                  ">
                  <BiMoneyWithdraw className="w-10 h-6"/>
                  <GiEntryDoor className="w-10 h-6"/>
                </Button>
              </Tooltip>

            </div>

          </div>

          
      </div>
  )
}

export default GameRoom