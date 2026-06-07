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

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            border: '1px solid #f5222d',
            borderRadius: '4px',
            backgroundColor: '#fff2f0',
            color: '#000000',
          }}
        >
          
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary