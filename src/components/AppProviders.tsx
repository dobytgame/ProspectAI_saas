'use client'

import NextTopLoader from 'nextjs-toploader'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader
        color="#00E5FF"
        height={3}
        showSpinner={false}
        shadow="0 0 12px rgba(0, 229, 255, 0.45)"
        zIndex={99999}
      />
      {children}
    </>
  )
}
