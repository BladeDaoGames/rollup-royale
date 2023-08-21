//import { MUDChain, latticeTestnet } from "@latticexyz/common/chains";
import { foundry, Chain } from "@wagmi/chains";

export const bladedao = {
    id: 1013454,
    name: 'BladeDAO',
    network: 'bladedao',
    nativeCurrency: {
        decimals: 18,
        name: 'Blade',
        symbol: 'BLADE',
    },
    rpcUrls: {
      default: {
        http: ['https://flashlayer.alt.technology/blade74eb1498'],
        webSocket: ['wss://flashlayer.alt.technology/blade74eb1498'],
      },
      public: {
        http: ['https://flashlayer.alt.technology/blade74eb1498'],
        webSocket: ['wss://flashlayer.alt.technology/blade74eb1498'],
      },
    },

    blockExplorers: {
        default: { name: 'Bladescan', url: 'https://explorer.alt.technology?rpcUrl=https://flashlayer.alt.technology/blade74eb1498' },
    },

} as const satisfies Chain

// If you are deploying to chains other than anvil or Lattice testnet, add them here
export const supportedChains: Chain[] = [bladedao, foundry];
//export const supportedChains: MUDChain[] = [bladedao, foundry, latticeTestnet];
