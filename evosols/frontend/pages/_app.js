// UPDATE YOUR frontend/pages/_app.js with this:

import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { polygon, polygonMumbai } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { Toaster } from 'react-hot-toast'

const { chains, publicClient } = configureChains(
  [polygon, polygonMumbai],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'EvoSouls',
  projectId: 'b5e24370b86fb9a3e7bedc64cf0a7a10', // Get your own at https://cloud.walletconnect.com
  chains
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default MyApp