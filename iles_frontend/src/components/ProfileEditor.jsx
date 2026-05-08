import { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
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
        avatar_image: user?.profile?.avatar_image || '',
      location: user?.profile?.location || '',
      date_of_birth: user?.profile?.date_of_birth || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

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
          avatar_image: user.profile?.avatar_image || '',
          location: user.profile?.location || '',
          date_of_birth: user.profile?.date_of_birth || ''
        }
      });
      setAvatarPreview(user.profile?.avatar_image || user.profile?.avatar_url || null);
      setAvatarFile(null);
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
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
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
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('first_name', formData.first_name);
      uploadData.append('last_name', formData.last_name);
      uploadData.append('email', formData.email);
      uploadData.append('phone', formData.phone);
      if (formData.department) uploadData.append('department', formData.department);
      if (formData.staff_number) uploadData.append('staff_number', formData.staff_number);
      if (formData.student_number) uploadData.append('student_number', formData.student_number);
      if (formData.registration_number) uploadData.append('registration_number', formData.registration_number);
      
      // Profile data
      uploadData.append('profile.bio', formData.profile.bio);
      uploadData.append('profile.location', formData.profile.location);
      uploadData.append('profile.date_of_birth', formData.profile.date_of_birth);
      
      // Only append avatar file if a new one was selected
      if (avatarFile) {
        uploadData.append('profile.avatar_image', avatarFile);
      }

      const response = await api.put('/profile/', uploadData);
      
      if (response.data) {
        // Profile update response received

        // Normalize avatar_image to absolute URL pointing at the backend media server.
        const profile = response.data.profile || {};
        try {
          const apiBase = api.defaults?.baseURL || '';
          const mediaBase = apiBase.replace(/\/api\/?$/, '');
          if (profile.avatar_image && typeof profile.avatar_image === 'string' && !profile.avatar_image.startsWith('http')) {
            profile.avatar_image = profile.avatar_image.startsWith('/') ? `${mediaBase}${profile.avatar_image}` : `${mediaBase}/${profile.avatar_image}`;
          }
        } catch {
          // Fallback: leave avatar_image as-is
        }

        const normalized = { ...response.data, profile };

        updateUser(normalized);
        setAvatarFile(null);
        setAvatarPreview(profile.avatar_image || profile.avatar_url || null);
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
                {avatarPreview && (
                  <img 
                    src={avatarPreview} 
                    alt="Profile Avatar" 
                    className="avatar-preview"
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
