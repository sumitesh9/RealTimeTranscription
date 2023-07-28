import '@/styles/globals.css'
import { Advent_Pro } from 'next/font/google';
import type { AppProps } from 'next/app'

const advent = Advent_Pro({ weight: '400', subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={advent.className}>
          <Component {...pageProps} />
    </div>
  )
}