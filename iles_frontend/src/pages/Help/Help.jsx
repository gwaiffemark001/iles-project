import { Link } from 'react-router-dom'
import './Help.css'

export default function Help() {
  const faqs = [
    {
      question: 'How do I create an internship placement?',
      answer: 'If you are an administrator, log in to your account and navigate to the Admin Dashboard. From there, you can create a new internship placement by filling in the required details such as student information, supervisor assignments, and placement duration.'
    },
    {
      question: 'How do I submit my weekly logs?',
      answer: 'As a student, log in to your account and go to the "My Placements" section. For your active placement, you can submit weekly logs documenting your tasks, learnings, and challenges. Make sure to submit your logs by the deadline set by your supervisor.'
    },
    {
      question: 'How are evaluations scored?',
      answer: 'Evaluations are scored using a weighted system where each criterion has a specific weight. Both workplace and academic supervisors provide scores, which are then combined using their respective shares to calculate your final evaluation score.'
    },
    {
      question: 'Can I edit my weekly log after submission?',
      answer: 'Yes, you can edit your weekly logs before the submission deadline. However, once approved by your supervisor, the log becomes locked and cannot be modified. Contact your supervisor if you need to request changes to an approved log.'
    },
    {
      question: 'How do I know my evaluation score?',
      answer: 'You can view your evaluation scores in your student dashboard. The scores are broken down by criterion, supervisor, and time period. You can also see feedback comments from your supervisors.'
    },
    {
      question: 'What should I do if I disagree with my evaluation?',
      answer: 'You can contact your academic supervisor or administrator to discuss your evaluation. They can provide feedback on the scoring and discuss any concerns you may have.'
    },
    {
      question: 'How do supervisors provide evaluations?',
      answer: 'Supervisors can access their dashboard to view assigned students and their logs. They can then provide evaluations based on the predefined criteria, assigning scores for each criterion and adding feedback comments.'
    },
    {
      question: 'Is there a deadline for completing my internship evaluation?',
      answer: 'Yes, evaluation deadlines are typically set by your institution and communicated by your administrator. Make sure to submit your logs and coordinate with your supervisors to ensure evaluations are completed on time.'
    }
  ]

  return (
    <div className="help-page">
      <nav className="help-nav">
        <div className="nav-brand">
          <img className="nav-logo" src="/ILES-Logo.png" alt="ILES logo" onError={(e) => { e.target.style.display = 'none' }} />
          <span className="nav-name">ILES</span>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/features" className="nav-link">Features</Link>
          <Link to="/#team" className="nav-link">Team</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/help" className="nav-link active">Help</Link>
          <Link to="/#contact" className="nav-link">Contact</Link>
        </div>
        <div className="nav-actions">
          <Link className="nav-login" to="/login">Login</Link>
        </div>
      </nav>

      <div className="help-container">
        <div className="help-header">
          <h1>Help &amp; Support</h1>
          <p className="help-subtitle">Find answers to common questions about ILES</p>
        </div>

        <section className="help-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <details key={index} className="faq-item">
                <summary className="faq-question">
                  <span>{faq.question}</span>
                  <svg className="faq-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M7 10l5 5 5-5z" />
                  </svg>
                </summary>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="help-section">
          <h2>Getting Started Guides</h2>
          <div className="guides-grid">
            <div className="guide-card">
              <h3>For Students</h3>
              <ul>
                <li>Creating your account</li>
                <li>Viewing your placement</li>
                <li>Submitting weekly logs</li>
                <li>Tracking your evaluation</li>
              </ul>
            </div>
            <div className="guide-card">
              <h3>For Supervisors</h3>
              <ul>
                <li>Accessing your dashboard</li>
                <li>Managing assigned students</li>
                <li>Reviewing student logs</li>
                <li>Submitting evaluations</li>
              </ul>
            </div>
            <div className="guide-card">
              <h3>For Administrators</h3>
              <ul>
                <li>Managing placements</li>
                <li>Assigning supervisors</li>
                <li>Approving submissions</li>
                <li>Generating reports</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="help-section contact-section">
          <h2>Can't Find What You're Looking For?</h2>
          <p>If you need additional support or have questions not covered here, please reach out to our team:</p>
          <div className="contact-info">
            <div className="contact-method">
              <svg className="contact-icon" viewBox="0 0 24 24" width="24" height="24">
                <path fill="#2563eb" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <div>
                <h4>Email</h4>
                <p>talitulekah@gmail.com</p>
              </div>
            </div>
            <div className="contact-method">
              <svg className="contact-icon" viewBox="0 0 24 24" width="24" height="24">
                <path fill="#2563eb" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.29 21 3 13.71 3 4.99 3 4.45 3.45 4 4 4h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z"/>
              </svg>
              <div>
                <h4>Phone</h4>
                <p>+256764597619</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="help-footer">
          <p>© {new Date().getFullYear()} ILES. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
