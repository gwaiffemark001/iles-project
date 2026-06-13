import { Link } from 'react-router-dom'
import './Homepage.css'

export default function Homepage() {
  return (
    <div className="homepage-page">
      <section className="homepage-hero">
        <div className="homepage-copy">
          <img className="homepage-logo" src="/ILES-Logo.png" alt="ILES logo" />
          <h1>Internship Logging & Evaluation System</h1>
          <p>Streamline internship supervision, logging, and evaluations for students, supervisors, and administrators.</p>
          <div className="homepage-actions">
            <Link className="homepage-primary-button" to="/signup">Create Account</Link>
            <Link className="homepage-secondary-button" to="/login">Login</Link>
          </div>
        </div>
        <div className="homepage-features">
          <article>
            <h2>Students</h2>
            <p>Submit weekly logs, track progress, and receive supervisor feedback.</p>
          </article>
          <article>
            <h2>Supervisors</h2>
            <p>Review logs, evaluate interns, and manage assigned placements.</p>
          </article>
          <article>
            <h2>Administrators</h2>
            <p>Manage placements, approvals, and system workflows from one place.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
