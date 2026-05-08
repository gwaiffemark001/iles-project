# ILES Frontend Components

This directory contains reusable React components for the ILES internship management system.

## Component Structure

Each component follows these conventions:
- **Single Responsibility**: Each component has one clear purpose
- **Reusable**: Components are designed to be used across different pages
- **Accessible**: Components follow accessibility best practices
- **Styled**: Each component has its own CSS file
- **Documented**: Props and usage are clearly documented

## Available Components

### FormField
**Purpose**: Reusable form input component for all form types

**Props**:
- `label` (string): Field label text
- `type` (string): Input type (text, email, password, select, textarea, file)
- `name` (string): Input name for form handling
- `value` (string): Current field value
- `onChange` (function): Change handler
- `placeholder` (string): Placeholder text
- `required` (boolean): Whether field is required
- `disabled` (boolean): Whether field is disabled
- `error` (string): Error message to display
- `options` (array): Options for select inputs

**Usage**:
```jsx
import FormField from '../components/FormField';

<FormField
  label="Email"
  type="email"
  name="email"
  value={formData.email}
  onChange={handleChange}
  required={true}
  error={errors.email}
/>
```

### DataTable
**Purpose**: Reusable data table with sorting, pagination, and row actions

**Props**:
- `data` (array): Array of data objects
- `columns` (array): Column configuration
- `loading` (boolean): Loading state
- `error` (string): Error message
- `onRowClick` (function): Row click handler
- `pagination` (object): Pagination configuration

**Usage**:
```jsx
import DataTable from '../components/DataTable';

const columns = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'email', title: 'Email', sortable: true },
  { key: 'status', title: 'Status' }
];

<DataTable
  data={users}
  columns={columns}
  loading={loading}
  onRowClick={handleUserClick}
  pagination={{
    currentPage: 1,
    totalPages: 10,
    onPageChange: handlePageChange
  }}
/>
```

### Modal
**Purpose**: Reusable modal component for dialogs and confirmations

**Props**:
- `isOpen` (boolean): Whether modal is open
- `onClose` (function): Close handler
- `title` (string): Modal title
- `children` (node): Modal content
- `size` (string): Modal size (small, medium, large)
- `showCloseButton` (boolean): Whether to show close button
- `closeOnEscape` (boolean): Close on ESC key
- `closeOnOverlay` (boolean): Close on overlay click

**Usage**:
```jsx
import Modal from '../components/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={handleModalClose}
  title="Confirm Action"
  size="medium"
>
  <p>Are you sure you want to proceed?</p>
  <button onClick={handleConfirm}>Yes</button>
  <button onClick={handleModalClose}>No</button>
</Modal>
```

## Custom Hooks

### useFormValidation
**Purpose**: Custom hook for form validation and error handling

**Parameters**:
- `initialValues` (object): Initial form values
- `validationRules` (object): Validation rules

**Returns**:
- `values`: Current form values
- `errors`: Validation errors
- `touched`: Field touch state
- `isValid`: Overall form validity
- `handleChange`: Change handler
- `validateForm`: Form validation function
- `resetForm`: Reset function
- `getFieldProps`: Field properties helper

**Usage**:
```jsx
import { useFormValidation } from '../hooks/useFormValidation';

const validationRules = {
  email: { required: true, email: true },
  password: { required: true, minLength: 8 }
};

const {
  values,
  errors,
  handleChange,
  validateForm,
  getFieldProps
} = useFormValidation(initialValues, validationRules);
```

## Utilities

### helpers.js
**Purpose**: Common utility functions for data manipulation and formatting

**Functions**:
- `formatDate()`: Format dates consistently
- `formatDateTime()`: Format date and time
- `capitalizeFirst()`: Capitalize first letter
- `truncateText()`: Truncate long text
- `generateInitials()`: Generate user initials
- `isValidEmail()`: Email validation
- `isValidPhone()`: Phone validation
- `formatFileSize()`: Format file sizes
- `sortByProperty()`: Sort arrays by property
- `filterByProperty()`: Filter arrays by property

### errorUtils.js
**Purpose**: Consistent error handling across the application

**Functions**:
- `handleApiError()`: Handle API errors consistently
- `handleValidationError()`: Handle form validation errors
- `getUserMessage()`: Get user-friendly error messages
- `getErrorType()`: Get error type for styling
- `getSuggestedAction()`: Get suggested user actions
- `isRecoverable()`: Check if error is recoverable

## API Services

### apiService.js
**Purpose**: Centralized API service layer for better separation of concerns

**Services**:
- `profile`: Profile CRUD operations
- `auth`: Authentication operations
- `students`: Student-related operations
- `supervisors`: Supervisor operations

**Usage**:
```jsx
import apiService from '../services/apiService';

// Get user profile
const profile = await apiService.profile.get();
// Update profile
const updated = await apiService.profile.update(formData);
```

## Best Practices

1. **Use these components** instead of duplicating code
2. **Follow the established patterns** for consistency
3. **Maintain documentation** when adding new features
4. **Test components** in isolation before integration
5. **Handle errors consistently** using the error utilities

## Contributing

When adding new components:
1. Create component file in `/src/components/`
2. Create corresponding CSS file
3. Add documentation to this README
4. Follow the established patterns
5. Test thoroughly before committing
