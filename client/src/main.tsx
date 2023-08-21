import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { foundry } from "@wagmi/chains";
import { bladedao } from './network/supportedChains.ts'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  //[bladedao],
  [foundry, bladedao],
  [publicProvider()],
)

const config = createConfig({
    autoConnect: true,
    connectors: [
      new InjectedConnector({chains}),
    ],
    publicClient,
    webSocketPublicClient,
  })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <App />
    </WagmiConfig>
  </React.StrictMode>,
)
