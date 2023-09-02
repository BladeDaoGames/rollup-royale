import { foundry} from "@wagmi/chains";
import { bladedao, bladeAltLayer, altLayerRegistryChain } from './supportedChains';
import BurnerAccountRegistry from './abis/BurnerAccountRegistry.json';
import Royale from './abis/Royale.json';
import RRoyale from './abis/RRoyale.json';

export const chainConfigs = {
    31337 : {
        config: foundry,
        contracts: {
            royale:"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            registry:"0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        }
    },
    1013454: {
        config: bladedao,
        contracts: {
            royale:"0x6951354310E37Bd0E5B3e8f18DD883F186042835",
            registry:"0x8df74401bA860F551B138aaB344aDC89a15876A9",
        }
    },
    4000007:{
        config: bladeAltLayer,
        contracts: {
            royale:"0x4826533B4897376654Bb4d4AD88B7faFD0C98528",
            implementation:"0x70e0bA845a1A0F2DA3359C97E0285013525FFC49",
            registry:"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        }
    },

    40002048:{
        config: altLayerRegistryChain,
        contracts: {
            royale:"0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            implementation:"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            registry:"0x0efE4fF06d0D01DdB7AE6e0a919D22B518a7CcbE",
        }
    }

}

export const chainConfig = {
    chaindetails: chainConfigs[import.meta.env.VITE_CHAIN_ID]?.config??foundry,
    registryContractAddress: chainConfigs[import.meta.env.VITE_CHAIN_ID]?.contracts?.registry,
    registryAbi: BurnerAccountRegistry.abi,
    royaleContractAddress: chainConfigs[import.meta.env.VITE_CHAIN_ID]?.contracts?.royale,
    //royaleAbi: Royale.abi
    royaleAbi: RRoyale.abi,
    specificRegistryChainDetails: chainConfigs[40002048].config,
    specificRegistryAddress:"0x0efE4fF06d0D01DdB7AE6e0a919D22B518a7CcbE",
}