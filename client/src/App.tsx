import {useState, useEffect} from 'react';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
//import LobbyTable from './components/LobbyTable/LobbyTable';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import { Progress } from 'flowbite-react';

// sm:bg-red-400 
// md:bg-orange-400
// lg:bg-yellow-200
// xl:bg-green-300
// 2xl:bg-background1
function App() {

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      <Navbar/>
        <main className='
          bg-[#34222E]
          flex flex-col min-h-screen
          pt-[88px]
          '>

          {progress != 100 ? 
            <Progress
              labelProgress
              labelText
              progress={progress}
              progressLabelPosition="inside"
              size="lg"
              textLabel="Game Setup..."
              textLabelPosition="outside"
            />
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
