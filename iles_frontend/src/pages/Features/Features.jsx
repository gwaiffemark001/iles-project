import { Link } from 'react-router-dom'
import './Features.css'

export default function Features() {
  const features = [
    {
      title: 'Student Logging',
      icon: '📝',
      description: 'Submit detailed weekly logs documenting your tasks, learnings, and progress during your internship.',
      details: [
        'Submit weekly logs with structured format',
        'Document tasks completed and learnings gained',
        'Track your progress throughout the internship',
        'Receive supervisor feedback on your logs',
        'View historical logs and supervisor comments'
      ]
    },
    {
      title: 'Supervisor Evaluation',
      icon: '⭐',
      description: 'Provide structured evaluations based on predefined criteria with fair, weighted scoring.',
      details: [
        'Evaluate students on multiple criteria',
        'Assign scores based on standardized rubric',
        'Provide detailed feedback comments',
        'View evaluation history and trends',
        'Generate comprehensive evaluation reports'
      ]
    },
    {
      title: 'Admin Management',
      icon: '⚙️',
      description: 'Manage placements, supervisors, and system workflows from a centralized dashboard.',
      details: [
        'Create and manage internship placements',
        'Assign students and supervisors to placements',
        'Approve or reject submissions',
        'Set evaluation deadlines and criteria',
        'Generate system reports and analytics'
      ]
    },
    {
      title: 'Transparent Scoring',
      icon: '📊',
      description: 'Fair evaluation system using weighted scoring that combines supervisor inputs objectively.',
      details: [
        'Weighted scoring based on criteria importance',
        'Combine workplace and academic supervisor inputs',
        'Calculate final scores automatically',
        'View score breakdown by criterion',
        'Understand how your evaluation is calculated'
      ]
    },
    {
      title: 'Real-time Feedback',
      icon: '💬',
      description: 'Supervisors can provide immediate feedback and students can see updates in real-time.',
      details: [
        'Receive feedback immediately after submission',
        'View supervisor comments on your logs',
        'Respond to feedback requests',
        'Engage in two-way communication',
        'Track all feedback history'
      ]
    },
    {
      title: 'Progress Tracking',
      icon: '📈',
      description: 'Track internship progress and performance metrics throughout the placement period.',
      details: [
        'Monitor weekly log completion status',
        'View average scores and trends',
        'Track compliance with submission deadlines',
        'Identify areas for improvement',
        'Compare performance against criteria'
      ]
    }
  ]

  return (
    <div className="features-page">
      <nav className="features-nav">
        <div className="nav-brand">
          <img className="nav-logo" src="/ILES-Logo.png" alt="ILES logo" onError={(e) => { e.target.style.display = 'none' }} />
          <span className="nav-name">ILES</span>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/features" className="nav-link active">Features</Link>
          <Link to="/+#team" className="nav-link">Team</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/help" className="nav-link">Help</Link>
          <Link to="/#contact" className="nav-link">Contact</Link>
        </div>
        <div className="nav-actions">
          <Link className="nav-login" to="/login">Login</Link>
        </div>
      </nav>

      <div className="features-container">
        <div className="features-header">
          <h1>Features</h1>
          <p className="features-subtitle">Comprehensive tools for internship management and evaluation</p>
        </div>

        <section className="features-section">
          <p className="features-intro">
            ILES provides a complete suite of features designed to support every aspect of the internship experience, 
            from daily logging to final evaluation. Here's what makes ILES the ideal platform for internship management.
          </p>
        </section>

        <section className="features-grid-section">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-header">
                  <div className="feature-icon">{feature.icon}</div>
                  <h2>{feature.title}</h2>
                </div>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-details">
                  <h3>Key Capabilities:</h3>
                  <ul>
                    {feature.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="benefits-section">
          <h2>Why These Features Matter</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>For Students</h3>
              <p>
                Track your progress, receive constructive feedback, understand how you're being evaluated, 
                and develop professionally through structured logging and evaluation processes.
              </p>
            </div>
            <div className="benefit-card">
              <h3>For Supervisors</h3>
              <p>
                Easily evaluate students using standardized criteria, provide timely feedback, track performance trends, 
                and maintain comprehensive evaluation records all in one place.
              </p>
            </div>
            <div className="benefit-card">
              <h3>For Institutions</h3>
              <p>
                Streamline internship management, ensure fair evaluations, maintain accountability, generate reports, 
                and improve internship programs based on data insights.
              </p>
            </div>
          </div>
        </section>

        <footer className="features-footer">
          <p>© {new Date().getFullYear()} ILES. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
