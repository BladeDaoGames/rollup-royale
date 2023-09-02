import React, {useMemo} from 'react';
import { useAtom} from 'jotai';
import {lobbyRoomPageCount} from '../../atoms';

const TablePagination = () => {
    const [ currentPage, setCurrentPage ] = useAtom(lobbyRoomPageCount);
    // const onPageChange = (page: number) => setCurrentPage(page);
    return useMemo(()=>{
        return(
            <div className="inline-flex rounded-md shadow-sm text-center
            py-0 text-xs sm:text-sm justify-center
            "
            role="group"
            >
                <button className="px-4 mr-1 rounded-l-md bg-greyness
                text-lightbeige/80 font-semibold
                hover:bg-orange-400/80 hover:text-white
                "
                onClick={()=>{
                    setCurrentPage((prevPage:number)=>{
                        return (prevPage>1) ? prevPage-1: prevPage
                    })
                }}
                
                >{`< Prev.`}</button>

                <input type="text" 
                inputMode="numeric"
                className="w-14 h-full text-center
                font-semibold
                bg-lightbeige text-gray-700
                "
                value={currentPage}

                onChange={(e)=>{
                    if(parseInt(e.target.value) >=1){
                        setCurrentPage(parseInt(e.target.value))
                    }
                }}
                />
                
                <button className="px-4 ml-1 rounded-r-md bg-greyness
                text-lightbeige/80 font-semibold
                hover:bg-orange-400/80 hover:text-white
                "
                onClick={()=>{
                    setCurrentPage((prevPage)=>prevPage+1)
                }}
                >{`Next >`}</button>
            </div>
            )
        },[currentPage]
    )
}

export default TablePagination