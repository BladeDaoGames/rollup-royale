import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { QueryClient, QueryClientProvider } from 'react-query';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { chainConfig } from './config/chainConfig';
import { supportedChains } from './config/supportedChains';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  //[bladedao],
  //[chainConfig.chaindetails],
  supportedChains,
  [publicProvider()],
)

const config = createConfig({
    autoConnect: true,
    connectors: [
      new InjectedConnector({chains}),
      //cachedConnector,
    ],
    publicClient,
    webSocketPublicClient,
  })

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <App />
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
)
