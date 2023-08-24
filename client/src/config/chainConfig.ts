import { foundry} from "@wagmi/chains";
import { bladedao } from '../network/supportedChains';
import BurnerAccountRegistry from './abis/BurnerAccountRegistry.json'
import Royale from './abis/Royale.json'

export const chainConfigs = {
    31337 : foundry,
    1013454: bladedao,
}

export const chainConfig = {
    chaindetails: chainConfigs[import.meta.env.VITE_CHAIN_ID]??foundry,
    registryContractAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    registryAbi: BurnerAccountRegistry.abi,
    royaleContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    royaleAbi: Royale.abi
}