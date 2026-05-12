import { useState, useCallback } from 'react';

export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    if (!validationRules[name]) return '';
    
    const rule = validationRules[name];
    if (!rule) return '';
    
    // Handle null/undefined values
    const cleanValue = value || '';
    
    if (rule.required && (!cleanValue || cleanValue.trim() === '')) {
      return `${name} is required`;
    }
    
    if (rule.minLength && cleanValue.length < rule.minLength) {
      return `${name} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && cleanValue.length > rule.maxLength) {
      return `${name} must be no more than ${rule.maxLength} characters`;
    }
    
    if (rule.pattern && cleanValue && !rule.pattern.test(cleanValue)) {
      return `${name} format is invalid`;
    }
    
    if (rule.email && cleanValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
      return 'Please enter a valid email address';
    }
    
    if (rule.phone && cleanValue && !/^\+?[\d\s-]{7,15}$/.test(cleanValue)) {
      return 'Please enter a valid phone number';
    }
    
    if (rule.number && cleanValue && !/^\d+$/.test(cleanValue)) {
      return `${name} must contain only numbers`;
    }
    
    return '';
  }, [validationRules]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on change
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [values, validateField, validationRules]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const getFieldProps = (name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    error: touched[name] && errors[name] ? errors[name] : '',
    required: validationRules[name]?.required || false
  });

  return {
    values,
    errors,
    touched,
    isValid: Object.keys(errors).length === 0,
    handleChange,
    validateForm,
    resetForm,
    getFieldProps
  };
};

export default useFormValidation;
