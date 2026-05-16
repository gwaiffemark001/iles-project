/**
 * App.jsx
 * Root application component that sets up routing context and initializes the main application layout.
 * Provides browser router configuration for client-side navigation across all internship management features.
 */

import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

// Comment for App.jsx

