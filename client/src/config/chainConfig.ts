import { foundry} from "@wagmi/chains";
import { bladedao, bladeAltLayer } from '../network/supportedChains';
import BurnerAccountRegistry from './abis/BurnerAccountRegistry.json'
import Royale from './abis/Royale.json'

export const chainConfigs = {
    31337 : {
        config: foundry,
        contracts: {
            royale:"0x5FbDB2315678afecb367f032d93F642f64180aa3",
            registry:"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        }
    },
    1013454: {
        config: bladedao,
        contracts: {
            royale:"0xAb488369150aBA956a8fe2b997d3F47A370f634E",
            registry:"0x8df74401bA860F551B138aaB344aDC89a15876A9",
        }
    },
    4000005:{
        config: bladeAltLayer,
        contracts: {
            royale:"0x5FbDB2315678afecb367f032d93F642f64180aa3",
            registry:"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        }
    }
}

export const chainConfig = {
    chaindetails: chainConfigs[import.meta.env.VITE_CHAIN_ID]?.config??foundry,
    registryContractAddress: chainConfigs[import.meta.env.VITE_CHAIN_ID]?.contracts?.registry,
    registryAbi: BurnerAccountRegistry.abi,
    royaleContractAddress: chainConfigs[import.meta.env.VITE_CHAIN_ID]?.contracts?.royale,
    royaleAbi: Royale.abi
}