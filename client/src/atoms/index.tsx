import {atom} from 'jotai';

type IRoom = {
    _roomId: number;
    _creator: string;
    stake: number;
    boardrow: number;
    boardcol: number;
    players: number;
    maxplayers: number;
    status: string;
}

export const createRoomAtom = atom<IRoom[]>([]);

export const createTotalRoomsAtoom = atom<number>(1);