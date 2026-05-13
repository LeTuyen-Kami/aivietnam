import React from 'react'
import { Toaster } from 'sonner'

import { AuthProvider } from './Auth'
import { HeaderThemeProvider } from './HeaderTheme'
import { QueryProvider } from './Query'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster closeButton richColors position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
