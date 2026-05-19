//Reusable component to display error messages in the UI
export default function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div className="iles-error-message" role="alert" aria-live="assertive">
      {message}
    </div>
  )
  // Alternative  code
  /*
    if (message === null) return null
  return (
    <div className="iles-error-message" role="alert" aria-live="assertive">
      {message}
    </div>
  )
 */

}
