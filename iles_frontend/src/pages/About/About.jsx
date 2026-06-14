import { Link } from 'react-router-dom'
import './About.css'

export default function About() {
  return (
    <div className="about-page">
      <nav className="about-nav">
        <div className="nav-brand">
          <img className="nav-logo" src="/ILES-Logo.png" alt="ILES logo" onError={(e) => { e.target.style.display = 'none' }} />
          <span className="nav-name">ILES</span>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/features" className="nav-link">Features</Link>
          <Link to="/#team" className="nav-link">Team</Link>
          <Link to="/about" className="nav-link active">About</Link>
          <Link to="/help" className="nav-link">Help</Link>
          <Link to="/#contact" className="nav-link">Contact</Link>
        </div>
        <div className="nav-actions">
          <Link className="nav-login" to="/login">Login</Link>
        </div>
      </nav>

      <div className="about-container">
        <div className="about-header">
          <h1>About ILES</h1>
          <p className="about-subtitle">Revolutionizing Internship Management and Evaluation</p>
        </div>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            The Internship Logging &amp; Evaluation System (ILES) is designed to streamline the entire internship 
            process for educational institutions, students, supervisors, and administrators. We believe that effective 
            internship management should be transparent, efficient, and accessible to all stakeholders.
          </p>
        </section>

        <section className="about-section">
          <h2>What We Do</h2>
          <p>
            ILES provides a comprehensive platform for managing internship placements, tracking student progress through 
            weekly logging, and conducting fair evaluations based on standardized criteria. Our system connects students 
            with workplace and academic supervisors, enabling real-time feedback and progress tracking.
          </p>
        </section>

        <section className="about-section">
          <h2>Key Features</h2>
          <div className="features-list">
            <div className="feature-item">
              <h3>Student Logging</h3>
              <p>Students can submit detailed weekly logs documenting their tasks, learnings, and progress during their internship.</p>
            </div>
            <div className="feature-item">
              <h3>Supervisor Evaluation</h3>
              <p>Both workplace and academic supervisors can provide structured evaluations based on predefined criteria and weighted scoring.</p>
            </div>
            <div className="feature-item">
              <h3>Admin Management</h3>
              <p>Administrators have full control over placement creation, approval workflows, and system administration.</p>
            </div>
            <div className="feature-item">
              <h3>Transparent Scoring</h3>
              <p>Our evaluation system uses fair, weighted scoring that combines supervisor inputs for objective assessment.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Why ILES?</h2>
          <ul className="why-list">
            <li>
              <strong>Transparent Process:</strong> Students and supervisors have visibility into evaluation criteria and scoring methods.
            </li>
            <li>
              <strong>Fair Evaluation:</strong> Weighted scoring system ensures unbiased assessment of student performance.
            </li>
            <li>
              <strong>Easy to Use:</strong> Intuitive interface designed for students, supervisors, and administrators alike.
            </li>
            <li>
              <strong>Real-time Feedback:</strong> Supervisors can provide immediate feedback through the platform.
            </li>
            <li>
              <strong>Comprehensive Tracking:</strong> Track all aspects of the internship from placement to final evaluation.
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Our Vision</h2>
          <p>
            We envision a future where internship programs are managed seamlessly, evaluations are fair and transparent, 
            and students gain valuable experience while receiving constructive feedback from industry professionals and 
            academic mentors. ILES is committed to supporting educational excellence and preparing students for successful careers.
          </p>
        </section>

        <footer className="about-footer">
          <p>© {new Date().getFullYear()} ILES. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
