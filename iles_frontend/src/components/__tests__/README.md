# Component Testing Guide

## Overview
This directory contains unit tests for React components to ensure they work correctly and maintain code quality.

## Testing Standards
- **Jest** as the testing framework
- **React Testing Library** for DOM testing
- **Accessibility testing** with jest-dom
- **Component rendering** and **behavior testing**
- **Error boundary** and **edge case testing**

## Test Structure
```
__tests__/
├── FormField.test.js
├── DataTable.test.js
├── Modal.test.js
└── README.md
```

## Running Tests
```bash
npm test
```

## Coverage Goals
- **80%+** code coverage for components
- **All** props and states tested
- **Edge cases** covered
- **Accessibility** compliance verified

## Writing Tests
1. **Test rendering** - Ensure components render correctly
2. **Test props** - Verify props are handled properly
3. **Test events** - Check user interactions work
4. **Test errors** - Verify error states display
5. **Test accessibility** - Ensure screen reader compatibility

## Best Practices
- **Arrange-Act-Assert** pattern
- **Descriptive test names**
- **Mock external dependencies**
- **Test accessibility attributes**
- **Keep tests focused and simple**
