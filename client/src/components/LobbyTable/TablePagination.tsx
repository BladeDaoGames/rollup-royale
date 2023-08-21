import {useState} from 'react';

const TablePagination = () => {
    const [currentPage, setCurrentPage] = useState(1);
    // const onPageChange = (page: number) => setCurrentPage(page);
    return (
        <div className="inline-flex rounded-md shadow-sm text-center
        py-0 text-xs sm:text-sm justify-center
        "
        role="group"
        >
            <button className="px-4 mr-1 rounded-l-md bg-greyness
            text-lightbeige/80 font-semibold
            hover:bg-orange-400/80 hover:text-white
            ">{`< Prev.`}</button>

            <input type="text" 
            inputMode="numeric"
            className="w-14 h-full text-center
            font-semibold
            bg-lightbeige text-gray-700
            " defaultValue={currentPage}/>
            
            <button className="px-4 ml-1 rounded-r-md bg-greyness
            text-lightbeige/80 font-semibold
            hover:bg-orange-400/80 hover:text-white
            ">{`Next >`}</button>
        </div>
    )
}

export default TablePagination