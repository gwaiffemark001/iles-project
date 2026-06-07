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
          <h2 style={{ color: '#f5222d', marginTop: 0 }}>Something went wrong</h2>
          <details
            style={{
              whiteSpace: 'pre-wrap',
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#fff7e6',
              borderRadius: '4px',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            <summary style={{ cursor: 'pointer', color: '#fa541c' }}>Error Details</summary>
            <p style={{ marginTop: '10px', fontSize: '12px' }}>
              {this.state.error && this.state.error.toString()}
            </p>
            {this.state.errorInfo && (
              <p style={{ fontSize: '12px', color: '#595959' }}>{this.state.errorInfo.componentStack}</p>
            )}
          </details>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary