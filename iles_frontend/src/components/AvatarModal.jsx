import { useEffect } from 'react'
import './AvatarModal.css'

export default function AvatarModal({ src, alt = 'Avatar', onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!src) return null;

  return (
    <div className="avatar-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="avatar-modal-close" onClick={onClose} aria-label="Close">×</button>
        <img src={src} alt={alt} className="avatar-modal-image" />
      </div>
    </div>
  );
}
