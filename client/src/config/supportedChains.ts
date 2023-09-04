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

export const bladeAltLayer = {
  id: 4000007,
  name: 'BladeAltLayer',
  network: 'BladeAltLayer',
  nativeCurrency: {
      decimals: 18,
      name: 'Blade',
      symbol: 'BLADE',
  },
  rpcUrls: {
    default: {
      http: ['https://blade.alt.technology'],
      webSocket: ['wss://blade.alt.technology'],
    },
    public: {
      http: ['https://blade.alt.technology'],
      webSocket: ['wss://blade.alt.technology'],
    },
  },

  blockExplorers: {
      default: { name: 'Bladescan', url: 'https://bladeexplorer.alt.technology' },
  },

} as const satisfies Chain

export const altLayerRegistryChain = {
  id: 40002048,
  name: 'AltlayerRegistry',
  network: 'AltlayerRegistry',
  nativeCurrency: {
      decimals: 18,
      name: 'AltLayer',
      symbol: 'ALT',
  },
  rpcUrls: {
    default: {
      http: ['https://zero-altitude-registry.alt.technology'],
      webSocket: ['wss://zero-altitude-registry.alt.technology'],
    },
    public: {
      http: ['https://zero-altitude-registry.alt.technology'],
      webSocket: ['wss://zero-altitude-registry.alt.technology'],
    },
  },

  blockExplorers: {
      default: { name: 'ZeroAltitude', url: 'https://zero-altitude-registry-explorer.alt.technology/' },
  },

} as const satisfies Chain
// If you are deploying to chains other than anvil or Lattice testnet, add them here
export const supportedChains: Chain[] = [bladeAltLayer, foundry, altLayerRegistryChain];
//export const supportedChains: MUDChain[] = [bladedao, foundry, latticeTestnet];
