import {atom} from 'jotai';
import {GameInfo} from '../components/GameRoom/GameTypes';
import Phaser from 'phaser';

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

export const createProgressBar = atom<number>(0);
export const createTxnBatchInterval = atom<number>(3);
export const createTxnSender = atom<boolean>(false);

export const createRoomAtom = atom<IRoom[]>([]);

export const createTotalRoomsAtoom = atom<number>(0);

export const createGameInfoAtom = atom<GameInfo>({
                                        gameAbandoned: false,
                                        gameCreator: "0x0",
                                        gamePaused: false,
                                        hasEnded: false,
                                        hasStarted: false,
                                        itemCount: 0,
                                        minStake: 0,
                                        playersCount: 0,
                                        totalStaked: 0
                                    });

export const createPlayerIds = atom<Array<string>>(["0x0", "0x0","0x0","0x0",])
export const createPlayerFTs = atom<Array<number>>([0,0,0,0])
export const createPlayerReadiness = atom<Array<boolean>>([false,false,false,false])
export const createPlayerAliveStatus = atom<Array<boolean>>([false,false,false,false])
export const createPlayerPauseVote = atom<Array<boolean>>([false,false,false,false])
export const createPlayerOverallStatus = atom<Array<string>>(["waiting","waiting","waiting","waiting"])

export const createDevPrivateKey = atom<string>(import.meta.env.VITE_DEVPK1 ?? "0x0")