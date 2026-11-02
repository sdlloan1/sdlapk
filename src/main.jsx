import '@/api/base44Client'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { Capacitor } from '@capacitor/core'
import { App as NativeApp } from '@capacitor/app'
import { NetworkGate } from '@/components/NoNetworkScreen'

// In the packaged Android app the hardware back button should walk back through
// the app's own history instead of closing it straight away.
if (Capacitor.isNativePlatform()) {
  NativeApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else NativeApp.exitApp()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <NetworkGate>
    <App />
  </NetworkGate>
)
