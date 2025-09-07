import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, sepolia, WagmiConfig } from 'wagmi'
import { polygon, polygonMumbai } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'

const { chains, publicClient } = configureChains(
  [sepolia],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'EvoSouls',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b5e24370b86fb9a3e7bedc64cf0a7a10',
  chains
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {mounted && <Component {...pageProps} />}
        <Toaster position="top-right" />
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default MyApp