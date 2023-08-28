import { foundry} from "@wagmi/chains";
import { bladedao, bladeAltLayer, AltLayerGasLess } from './supportedChains';
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
            royale:"0x6951354310E37Bd0E5B3e8f18DD883F186042835",
            registry:"0x8df74401bA860F551B138aaB344aDC89a15876A9",
        }
    },
    41000021:{
        config: AltLayerGasLess,
        contracts: {
            royale:"0x394D08ff29E5432C8e9a32DEf33F28B9f0bd84B6",
            registry:"0xcA6e0D006659a344998a1E1FA8D3F3B8D3D30Fce",
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