import './UserAvatar.css';

const UserAvatar = ({ user, size = 'medium', className = '', onClick = null }) => {
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

  const avatarSrc = user?.profile?.avatar_image || user?.profile?.avatar_url || null;
  const hasAvatar = Boolean(avatarSrc);
  const initials = getInitials();
  const handleClick = () => {
    if (typeof onClick === 'function') onClick();
  };

  return (
    <div
      className={`user-avatar user-avatar-${size} ${className}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {hasAvatar ? (
        <img
          src={avatarSrc}
          alt={`${user?.first_name || user?.username || 'User'}'s avatar`}
          className="avatar-image"
          onError={(e) => {
            e.target.style.display = 'none';
            const fallback = e.target.nextElementSibling;
            if (fallback) fallback.style.display = 'flex';
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
