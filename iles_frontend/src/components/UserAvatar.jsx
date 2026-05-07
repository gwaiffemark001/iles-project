import './UserAvatar.css';

const UserAvatar = ({ user, size = 'medium', className = '' }) => {
  // Extract initials from user name
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const hasAvatar = user?.profile?.avatar_url;
  const initials = getInitials();

  return (
    <div className={`user-avatar user-avatar-${size} ${className}`}>
      {hasAvatar ? (
        <img
          src={user.profile.avatar_url}
          alt={`${user?.first_name || user?.username || 'User'}'s avatar`}
          className="avatar-image"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className="avatar-fallback" 
        style={{ display: hasAvatar ? 'none' : 'flex' }}
      >
        {initials}
      </div>
    </div>
  );
};

export default UserAvatar;
