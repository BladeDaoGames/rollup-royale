import os
import json
import pandas as pd
from scan.scanner import getEventData
from google.cloud import storage
from google.oauth2 import service_account

def loadDf(eventName:str):
    # load data from json
    try:
        #with open(eventName+".json") as royaleJson:
        with bucket.blob(eventName+".json").open("r") as royaleJson:
            datajson = json.loads(royaleJson.read())
        if datajson:
            return pd.DataFrame([event for _, d in datajson.get("blocks").items() for hash, 
                        txn in d.items() for i, event in txn.items()])
        else:
            return pd.DataFrame()
    except:
        return pd.DataFrame()

def peekDf(eventName:str):
    # load data from json
    df = loadDf(eventName)
    print(f"Loaded {len(df)} rows from {eventName}.json")
    print(df.head())
    del df

def scrapeEvent(eventName:str):
    # Peek data
    peekDf(eventName)

    # Get PlayersKilled data
    getEventData(
        eventName=eventName,
        rpc_url=rpc_url,
        contractAddress=royaleAddress,
        abi=royaleAbi,
        contractCreationBlock=int(royaleCreateBlockNum))

    # Print the data
    peekDf(eventName)

if __name__ == "__main__":

    rpc_url = os.environ.get("RPC_URL")
    royaleAddress = os.environ.get("ROYALE_ADDRESS")
    registryAddress = os.environ.get("REGISTRY_ADDRESS")
    royaleCreateBlockNum = os.environ.get("ROYALE_CREATEBLOCK")

    BUCKET_NAME = "rollup-royale-stats1"

    # cloud inits
    credentials_dict = {
        "type": os.environ.get("type"),
        "project_id": os.environ.get("project_id"),
        "private_key_id": os.environ.get("private_key_id"),
        "private_key": os.environ.get("private_key"),
        "client_email": os.environ.get("client_email"),
        "client_id": os.environ.get("client_id"),
        "auth_uri": os.environ.get("auth_uri"),
        "token_uri": os.environ.get("token_uri"),
        "auth_provider_x509_cert_url": os.environ.get("auth_provider_x509_cert_url"),
        "client_x509_cert_url": os.environ.get("client_x509_cert_url"),
        "universe_domain": "googleapis.com"
    }
    credentials = service_account.Credentials.from_service_account_info(credentials_dict)
    storage_client = storage.Client(project=os.environ.get("project_id"), credentials=credentials)
    bucket = storage_client.bucket(BUCKET_NAME)
    with bucket.blob("RRoyale.json").open("r") as ry:
        royaleAbi = json.loads(ry.read())['abi']

    #scrapeEvent("PlayerKilled")
    scrapeEvent("GameEnded")