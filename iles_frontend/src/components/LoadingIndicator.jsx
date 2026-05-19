//Reusable loading indicator component
export default function LoadingIndicator({ label = 'Loading...' }) {
  return (
    <div className="iles-loading" role="status" aria-live="polite">
      <span className="iles-spinner" aria-hidden="true">⏳</span>
      <span>{label}</span>
    </div>
  )
}