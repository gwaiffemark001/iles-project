import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import FormField from '../FormField';

describe('FormField Component', () => {
  test('renders text input by default', () => {
    render(<FormField label="Test" name="test" />);
    
    const input = screen.getByLabelText('Test');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('name', 'test');
  });

  test('renders select input when type is select', () => {
    const options = [{ value: '1', label: 'Option 1' }];
    render(<FormField label="Test" name="test" type="select" options={options} />);
    
    const select = screen.getByLabelText('Test');
    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');
  });

  test('displays error message when error prop is provided', () => {
    render(<FormField label="Test" name="test" error="This is an error" />);
    
    const input = screen.getByLabelText('Test');
    const error = screen.getByText('This is an error');
    
    expect(input).toBeInTheDocument();
    expect(error).toBeInTheDocument();
    expect(input).toHaveClass('error');
  });

  test('calls onChange when input value changes', () => {
    const handleChange = vi.fn();
    render(<FormField label="Test" name="test" onChange={handleChange} />);
    
    const input = screen.getByLabelText('Test');
    const event = { target: { value: 'new value', name: 'test' } };
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.onchange?.(event);
    
    expect(handleChange).toHaveBeenCalledWith(event);
  });
});
