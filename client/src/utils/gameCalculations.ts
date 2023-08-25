export const boardPositionToGameTileXY = (boardPos:number)=>{
    const boardWidth=10
    const boardHeight=10

    const TileY = Math.floor(boardPos / boardHeight)
    const TileX = boardPos % boardHeight

    return {x:TileX, y:TileY}
}