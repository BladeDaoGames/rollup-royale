import React, {useMemo} from 'react';
import {lobbyTextSearchInput} from '../../atoms';
import {useSetAtom} from 'jotai';

const RoomSearch = () => {
    const setInputText = useSetAtom(lobbyTextSearchInput);
    let inputHandler = (e) => {
        //convert input text to lower case
        var lowerCase = e.target.value.toLowerCase();
        setInputText(lowerCase);
    };
    return (
        <div className="relative ml-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-lightbeige/80" aria-hidden="true" 
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" 
                    stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
            </div>

            <input type="text" id="table-search" 
                className="block p-2 pl-10 text-xs sm:text-sm text-whitegreen
                border border-purpgrey rounded-lg 
                w-[7.5rem] sm:w-auto
                bg-greyness/80 placeholder:text-lightbeige/80
                focus:ring-prime2 focus:border-prime2" 
                placeholder="Search Room by Owner"
                
                onChange={inputHandler}

                />
            </div>
    )
}

export default RoomSearch