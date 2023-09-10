import React from 'react'

const NavbarLogo = () => {
    return (
        <a href={import.meta.env.VITE_HOSTSITE || "http://localhost:3000"} 
            className="flex items-center">
            <img src="/SilverLogo.png" 
                className="h-6 mr-3" alt="Loot Royale Logo" />
        </a>
    )
}

export default NavbarLogo