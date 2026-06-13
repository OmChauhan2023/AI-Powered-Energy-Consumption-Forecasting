import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { CostProvider } from './contexts/CostContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CostProvider>
          <App />
          <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '10px',
              fontSize: '14px',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />
        </CostProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
