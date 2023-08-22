import React from 'react'

const StakeAmtDiv = ({stakeamt})=>{
    return (<div className="flex
        justify-center items-center
        ">
            {stakeamt}</div>)
}

const StakedBar = () => {
    return (
        <div className="flex flex-row justify-between items-center
        text-white font-semibold my-1 mt-2">

            {/* player indicator */}
            <div className="mx-2 w-1/5
                flex justify-start items-center
                ">
                <span>You are: </span> 
                <span className="mx-1 ml-2 flex-1
                rounded-lg text-center
                bg-prime3 text-background1
                ">
                    P1
                </span>
                </div>
            
            <div className="w-1/5 mx-0 px-0
            text-center
            ">
                Stakes $:
            </div>

                <div className="grid grid-flow-col flex-auto
                    justify-stretch items-center mx-1
                    border border-white
                    rounded-md overflow-hidden
                    ">
                    <StakeAmtDiv stakeamt={1}/>
                    <StakeAmtDiv stakeamt={1}/>
                    <StakeAmtDiv stakeamt={1}/>
                    <StakeAmtDiv stakeamt={1}/>
                </div>
        </div>
    )
}

export default StakedBar