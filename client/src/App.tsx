import {useState, useEffect} from 'react';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
//import LobbyTable from './components/LobbyTable/LobbyTable';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import useFetchRooms from './hooks/useFetchRooms';
import {useAtomValue} from 'jotai';
import { createProgressBar } from './atoms';

// sm:bg-red-400 
// md:bg-orange-400
// lg:bg-yellow-200
// xl:bg-green-300
// 2xl:bg-background1
function App() {
  const progressBarValue = useAtomValue(createProgressBar)
  
  useFetchRooms();

  return (
    <>
      <Navbar/>
        <main className='
          bg-[#34222E]
          flex flex-col min-h-screen
          items-center
          pt-0
          '>

          {progressBarValue <100? 
            <div className="
            mt-10
            w-1/2 flex-col justify-start items-center
            text-xs font-bold text-white
            ">
              <div className="my-2 mb-1 text-base">LoAdiNg GaME DatA...</div>
              <div className="w-full bg-gray-200 rounded-md dark:bg-gray-700">
                <div className="bg-prime2  text-background1 text-sm
                text-center p-0.5 leading-none rounded-md" 
                style={{width: `${progressBarValue}%`}}>{`${progressBarValue}%`}</div>
              </div>
            </div>
            :
          <Router>
              <Routes>
                <Route path='/' element={<Lobby/>}/>
                <Route path="/game/:id" element={<GameRoom />} />
              </Routes>
            </Router>
            }
          </main>
      <Footer />
    </>
  )
}

export default App
