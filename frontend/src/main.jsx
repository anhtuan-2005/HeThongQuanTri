import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider 
          locale={viVN} 
          theme={{ 
            token: { 
              colorPrimary: '#4f46e5', // Indigo-600 for a more modern premium feel
              borderRadius: 12,        // Very soft rounded corners
              colorBgContainer: '#ffffff',
              fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
              controlHeight: 40,       // Slightly taller inputs for modern look
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
            },
            components: {
              Card: {
                borderRadiusLG: 16
              },
              Modal: {
                borderRadiusLG: 16
              }
            }
          }}
        >
          <App />
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
