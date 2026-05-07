import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import api from '../api/api';
import './ProfileEditor.css';

const ProfileEditor = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    staff_number: user?.staff_number || '',
    student_number: user?.student_number || '',
    registration_number: user?.registration_number || '',
    profile: {
      bio: user?.profile?.bio || '',
      avatar_url: user?.profile?.avatar_url || '',
      location: user?.profile?.location || '',
      date_of_birth: user?.profile?.date_of_birth || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        staff_number: user.staff_number || '',
        student_number: user.student_number || '',
        registration_number: user.registration_number || '',
        profile: {
          bio: user.profile?.bio || '',
          avatar_url: user.profile?.avatar_url || '',
          location: user.profile?.location || '',
          date_of_birth: user.profile?.date_of_birth || ''
        }
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('profile.')) {
      const profileField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setFormData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            avatar_url: dataUrl
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setErrorDetails({});

    try {
      const response = await api.put('/api/profile/', formData);
      
      if (response.data) {
        updateUser(response.data);
        setIsEditing(false);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err.response?.data?.detail || 
                        err.response?.data?.message || 
                        err.message || 
                        'Failed to update profile';
      setError(errorMessage);
      setErrorDetails(err.response?.data || {});
      setTimeout(() => {
        setError('');
        setErrorDetails({});
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const getRoleSpecificFields = () => {
    switch (user?.role) {
      case 'student':
        return (
          <div className="form-row">
            <label className="form-field">
              <span>Student Number</span>
              <input
                type="text"
                name="student_number"
                value={formData.student_number}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
            <label className="form-field">
              <span>Registration Number</span>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
          </div>
        );
      
      case 'workplace_supervisor':
      case 'academic_supervisor':
        return (
          <div className="form-row">
            <label className="form-field">
              <span>Staff Number</span>
              <input
                type="text"
                name="staff_number"
                value={formData.staff_number}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
            <label className="form-field">
              <span>Department</span>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
          </div>
        );
      
      case 'admin':
        return (
          <div className="form-row">
            <label className="form-field">
              <span>Department</span>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!user) {
    return <div className="profile-editor">Loading...</div>;
  }

  return (
    <div className="profile-editor">
      <div className="profile-header">
        <h2>My Profile</h2>
        {isEditing ? (
          <div className="profile-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="profile-actions">
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      {Object.keys(errorDetails).length > 0 && (
        <div className="error-details">
          <h4>Error Details:</h4>
          <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
        </div>
      )}

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <label className="form-field">
              <span>First Name</span>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
            <label className="form-field">
              <span>Last Name</span>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
            <label className="form-field">
              <span>Phone</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
          </div>

          {getRoleSpecificFields()}
        </div>

        <div className="form-section">
          <h3>Profile Information</h3>
          <div className="form-row">
            <label className="form-field">
              <span>Bio</span>
              <textarea
                name="profile.bio"
                value={formData.profile.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows="4"
                placeholder="Tell us about yourself..."
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span>Avatar</span>
              <div className="avatar-upload">
                {formData.profile.avatar_url && (
                  <img 
                    src={formData.profile.avatar_url} 
                    alt="Profile Avatar" 
                    className="avatar-preview"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <input
                  type="file"
                  name="profile.avatar_file"
                  onChange={handleAvatarUpload}
                  disabled={!isEditing}
                  accept="image/*"
                  className="avatar-input"
                />
                <button
                  type="button"
                  onClick={() => document.querySelector('.avatar-input')?.click()}
                  disabled={!isEditing}
                  className="upload-btn"
                >
                  {loading ? 'Uploading...' : 'Choose File'}
                </button>
              </div>
            </label>
            <label className="form-field">
              <span>Location</span>
              <input
                type="text"
                name="profile.location"
                value={formData.profile.location}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="City, Country"
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span>Date of Birth</span>
              <input
                type="date"
                name="profile.date_of_birth"
                value={formData.profile.date_of_birth}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditor;
