import React from 'react';
import './FormField.css';

const FormField = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder = '', 
  required = false, 
  disabled = false, 
  error = '',
  options = [],
  ...props 
}) => {
  const renderField = () => {
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`form-input ${error ? 'error' : ''}`}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`form-input ${error ? 'error' : ''}`}
            rows="4"
            {...props}
          />
        );
      
      case 'file':
        return (
          <input
            type="file"
            name={name}
            onChange={onChange}
            disabled={disabled}
            className={`form-input ${error ? 'error' : ''}`}
            {...props}
          />
        );
      
      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`form-input ${error ? 'error' : ''}`}
            {...props}
          />
        );
    }
  };

  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      {renderField()}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default FormField;
