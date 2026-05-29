import { useState } from 'react'

function PasswordField({
  id,
  name,
  value,
  onChange,
  placeholder = 'Password',
  required = false,
  disabled = false,
  autoComplete = 'current-password',
  className = '',
  style,
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        id={id}
        name={name}
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={className}
        style={{
          ...style,
          paddingRight: '4.5rem',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        disabled={disabled}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
        style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '0.25rem 0.5rem',
        }}
      >
        {isVisible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

export default PasswordField