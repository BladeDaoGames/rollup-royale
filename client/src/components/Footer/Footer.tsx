import React from 'react';
import { Footer } from 'flowbite-react';
import { BsGlobeAsiaAustralia, BsTelegram, BsDiscord, BsGithub, BsTwitter } from 'react-icons/bs';
import { SiOpensea} from 'react-icons/si';

const CustomFooter = () => {
  return (
    <Footer container className="bg-background1 rounded-none">
            <div className="w-full">

            <div className="w-full sm:flex sm:items-center sm:justify-between
            fill-current text-prime2
            ">
            
            <div className="ml-auto mt-0 flex space-x-6 justify-center">
            
                <Footer.Icon
                    className="text-prime2"
                    href="https://www.bladedao.games"
                    icon={BsGlobeAsiaAustralia}
                />
                <Footer.Icon
                className="text-prime2"
                href="https://twitter.com/Blade_DAO"
                icon={BsTwitter}
                />
                <Footer.Icon
                className="text-prime2"
                href="https://discord.gg/BladeDAO"
                icon={BsDiscord}
                />
                <Footer.Icon
                className="text-prime2"
                href="https://t.me/bladedao_real"
                icon={BsTelegram}
                />
                <Footer.Icon
                className="text-prime2"
                href="https://t.co/zfdSwGyXyN"
                icon={SiOpensea}
                />
                <Footer.Icon
                className="text-prime2"
                href="https://github.com/BladeDaoGames"
                icon={BsGithub}
                />
            </div>
            </div>

            </div>
        </Footer>
  )
}

export default CustomFooter