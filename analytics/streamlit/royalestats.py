import streamlit as st
import os
import sys
import json
from dotenv import load_dotenv, find_dotenv
import pandas as pd
import numpy as np
from scan.scanner import getEventData
from web3 import Web3, WebsocketProvider, AsyncHTTPProvider

load_dotenv(find_dotenv())

# load environment variables
rpc_url = os.environ.get("RPC_URL")
registry_rpc_url = os.environ.get("REGISTRY_RPC")
royaleAddress = os.environ.get("ROYALE_ADDRESS")
registryAddress = os.environ.get("REGISTRY_ADDRESS")
royaleCreateBlockNum = os.environ.get("ROYALE_CREATEBLOCK")

# load abi
with open(os.path.join("abi","RRoyale.json")) as royaleJson:
    royaleAbi = json.loads(royaleJson.read())['abi']

# load registry abi
with open(os.path.join("abi","BurnerAccountRegistry.json")) as registryJson:
    registryAbi = json.loads(registryJson.read())['abi']


st.title('Royale Stats')
loadSpinner = st.empty()
controlsExpander = st.expander("Controls")
buttonsContainer = controlsExpander.container()
buttons1Cols = buttonsContainer.columns(4)
buttons2Cols = buttonsContainer.columns(4)
statsContainer = st.container()
statsCols = statsContainer.columns(3)

def loadDf(eventName:str):
    # load data from json
    try:
        with open(eventName+".json") as royaleJson:
            datajson = json.loads(royaleJson.read())
        if datajson:
            return pd.DataFrame([event for _, d in datajson.get("blocks").items() for hash, 
                        txn in d.items() for i, event in txn.items()])
        else:
            return pd.DataFrame()
    except:
        return pd.DataFrame()

def fetchData(eventName:str):
    # get data from blockchain
    loadSpinnerContainer = loadSpinner.container()
    loadSpinnerContainer.status(f"Fetching {eventName} Data...")
    data = getEventData(eventName=eventName,
                rpc_url=rpc_url, 
                contractAddress=royaleAddress,
                abi=royaleAbi,
                contractCreationBlock=int(royaleCreateBlockNum))
    # remove spinner
    loadSpinnerContainer.empty()

buttons2Cols[0].button('Get GamesStarted', key="gStarted", on_click=lambda: fetchData("GameStarted"))
buttons2Cols[1].button('Get PlayersKilled', key="pKilled", on_click=lambda: fetchData("PlayerKilled"))
buttons2Cols[2].button('Get GameEnded', key="gEnded", on_click=lambda: fetchData("GameEnded"))
buttons1Cols[0].button('Clear Cache', key="clear", on_click=lambda: st.cache_data.clear())
#print(st.session_state["clear"])

eventName = "GameStarted" if st.session_state["gStarted"
] else "PlayerKilled" if st.session_state["pKilled"] else \
    "GameEnded" if st.session_state["gEnded"] else "GameCreated"

# df = pd.DataFrame() if st.session_state["clear"] else loadDf(eventName)
# dfTable = st.write(df)

# derive stats
dfGameEnded = pd.DataFrame() if st.session_state["clear"] else loadDf("GameEnded")
#print(dfGameEnded.head())
dfPlayerKilled = pd.DataFrame() if st.session_state["clear"] else loadDf("PlayerKilled")
#print(dfPlayerKilled.head())

gamesplayed = dfGameEnded["_roomId"].count() if "_roomId" in dfGameEnded.columns else 0

def getUserStats(address:str, contract:any):
    try:
        stats = contract.functions.userStats(address).call()
        stats[2] = stats[2]/1e18
        stats[3] = stats[3]/1e18
        #stats = np.array(stats)
        return stats
    except:
        return [0,0,0,0]
    return [0,0,0,0]

def getBurnerParent(series:any, contract:any):
    try:
        if("burnerParent" in series):
            if(series["burnerParent"] == "0x0" or series["burnerParent"] == "" or \
                series["burnerParent"] == "0x0000000000000000000000000000000000000000"):
                return contract.functions.ownerAccounts(series["burners"]).call()
            else:
                return series["burnerParent"]
        else:
            return contract.functions.ownerAccounts(series["burners"]).call()
    except:
        return ""
    return ""

def _compileBurners(players:pd.DataFrame, gEnded: pd.DataFrame, pKilled:pd.DataFrame):
    if(len(players) > 0 and ("burners" in players.columns)):
        new_set = np.unique(np.append(pKilled._player.values, gEnded._winner.values))
        set_diff = np.setdiff1d(players["burners"], new_set)
        if(len(set_diff) > 0):
            players = players[~players["burners"].isin(set_diff)]
            new_players = pd.DataFrame(set_diff, columns=["burners"])
            new_players["burnerParent"] = "0x0"
            new_players[["totalWins", "totalLosses", "totalGasEarned", "totalGasLost"]] = 0
            players = pd.concat([players, new_players])
            players.to_pickle("players.pkl")
            return players
        else:
            return players
    else:
        if(len(pKilled) > 0 or len(gEnded) > 0):
            if ("_player"in pKilled.columns and "_winner" in gEnded.columns):
                players = pd.DataFrame(np.unique(np.append(pKilled._player.values, gEnded._winner.values)), 
                                columns=["burners"] )
            elif("_player" in pKilled.columns):
                players = pd.DataFrame(np.unique(pKilled._player.values), columns=["burners"])
            elif("_winner" in gEnded.columns):
                players = pd.DataFrame(np.unique(gEnded._winner.values), columns=["burners"])
            else:
                players = pd.DataFrame()
                players["burners"] = "0x0"

            players["burnerParent"] = "0x0"
            players[["totalWins", "totalLosses", "totalGasEarned", "totalGasLost"]] = 0
            players.to_pickle("players.pkl")
            return players
        else:
            return pd.DataFrame()

def compileBurners(players:pd.DataFrame, gEnded: pd.DataFrame, pKilled:pd.DataFrame):
    loadSpinnerContainer = loadSpinner.container()
    loadSpinnerContainer.status("Compiling Burners...")

    df = _compileBurners(players, gEnded, pKilled)
    # remove spinner
    loadSpinnerContainer.status("", state="complete")
    loadSpinnerContainer.empty()
    return df

def _mapParentWallet(players:pd.DataFrame):
    r3 = Web3(Web3.HTTPProvider(registry_rpc_url))
    try:
        if(r3.is_connected() and players["burners"].count() > 0):
            RegistryContract = r3.eth.contract(abi=registryAbi, address=registryAddress)
            players["burnerParent"] = players.apply(lambda x: getBurnerParent(x, RegistryContract),axis=1)
            players.to_pickle("players.pkl")
            return players
        else:
            return pd.DataFrame()
    except:
        return pd.DataFrame()

def mapParentWallet(players:pd.DataFrame):
    loadSpinnerContainer = loadSpinner.container()
    loadSpinnerContainer.status("Mapping Parent Wallet...")
    df = _mapParentWallet(players)
    loadSpinnerContainer.status("", state="complete")
    loadSpinnerContainer.empty()
    return df

def _getUserStatsFromContract(players:pd.DataFrame):
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if(w3.is_connected() and ("burners" in players.columns)):
        RoyaleContract = w3.eth.contract(abi=royaleAbi, address=royaleAddress)
        players[["totalWins", "totalLosses", "totalGasEarned", "totalGasLost"]] =  players.apply(
            lambda x: getUserStats(x["burners"], RoyaleContract), axis=1, result_type ='expand')
        players["totalGames"] = players["totalWins"] + players["totalLosses"]
        players["totalRevenue"] = players["totalGasEarned"] - players["totalGasLost"]
        players.drop_duplicates(subset="burners", inplace=True)
        players.sort_values(by=["totalGames"], ascending=False, inplace=True)
        players.reset_index(drop=True, inplace=True)
        players.to_pickle("players.pkl")
        return players
    else:
        return pd.DataFrame()

def getUserStatsFromContract(players:pd.DataFrame):
    loadSpinnerContainer = loadSpinner.container()
    loadSpinnerContainer.status("Getting UserStats Data...")
    df = _getUserStatsFromContract(players)
    loadSpinnerContainer.status("", state="complete")
    loadSpinnerContainer.empty()
    return df

def reProcessTotalData(gEnded: pd.DataFrame, pKilled:pd.DataFrame):
    loadSpinnerContainer = loadSpinner.container()
    cb = loadSpinnerContainer.status("Compiling Burners...")
    players = _compileBurners(pd.DataFrame(), gEnded, pKilled)
    loadSpinnerContainer.status("Burners Compiled.", state="complete")
    loadSpinnerContainer.empty()
    mw = loadSpinnerContainer.status("Mapping Parent Wallet...")
    players = _mapParentWallet(players)
    loadSpinnerContainer.status("Wallets Mapped", state="complete")
    loadSpinnerContainer.empty()
    loadSpinnerContainer.status("Getting UserStats Data...")
    players = _getUserStatsFromContract(players)
    loadSpinnerContainer.status("UserStats processed", state="complete")
    loadSpinnerContainer.empty()
    return players


# process data
try:
    players = pd.read_pickle("players.pkl")
except:
    players = pd.DataFrame()
players = pd.DataFrame() if st.session_state["clear"] else players
playersTable = st.write(players)

statsCols[0].write(f"Total Games Completed: {gamesplayed}")
statsCols[1].write(f"Total Unique Burners: {players['burners'].count() if 'burners' in players.columns else 0}")
statsCols[2].write(f"Total Gas Gained: {round(-1*players['totalRevenue'].sum(),3) if 'totalRevenue' in players.columns else 0}")

buttons2Cols[-1].button("Compile Burners", on_click=lambda: compileBurners(players, dfGameEnded, dfPlayerKilled))
buttons1Cols[1].button("Map Parent Wallet", on_click=lambda: mapParentWallet(players))
buttons1Cols[2].button("Get UserStats", on_click=lambda: getUserStatsFromContract(players))
buttons1Cols[-1].button("Get All Data", on_click=lambda: reProcessTotalData(dfGameEnded, dfPlayerKilled), type="primary")

@st.cache_data
def convert_df(df):
    # IMPORTANT: Cache the conversion to prevent computation on every rerun
    return df.to_csv(index=False).encode('utf-8')

csv = convert_df(players)
st.download_button(
    label="Download data as CSV",
    data=csv,
    file_name='royaleStats.csv',
    mime='text/csv',
)


