import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { NavVisibilityProvider } from '@/components/providers/NavVisibilityProvider'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Personal portfolio',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        {/* precedence prop tells React 18 to hoist this to <head> on both server+client — fixes hydration mismatch */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" crossOrigin="anonymous" precedence="default" />
        <ThemeProvider>
          <AuthProvider>
            <NavVisibilityProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: '!bg-white dark:!bg-zinc-800 !text-zinc-900 dark:!text-zinc-100 !shadow-lg !rounded-xl',
                duration: 3500,
              }}
            />
            </NavVisibilityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
