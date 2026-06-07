/*
 ErrorBoundary Component
 Catches React component errors and displays fallback UI
 */

import React from 'react'
import logger from '../utils/logger'

/*
 Error Boundary class component
 Wraps around other components to catch errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console and potentially to error tracking service
    logger.error('ErrorBoundary', 'Component error caught', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    })

    // log this to an error reporting service here
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }


}

export default ErrorBoundary