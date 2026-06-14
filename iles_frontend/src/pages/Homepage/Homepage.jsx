import { Link } from 'react-router-dom'
import gwaiffeImage from '../../assets/gwaiffe .png'
import gideonImage from '../../assets/mugabe gideon.jpeg'
import graceImage from '../../assets/ahurira grace.jpeg'
import hopeImage from '../../assets/talituleka hope mwelu.jpeg'
import emmaImage from '../../assets/Sekiranda Emma Michael.jpeg'
import ogesaImage from '../../assets/ogesa patrick.jpeg'
import './Homepage.css'

const cards = [
  {
    name: 'Gwaiffe Mark',
    role: 'Product Lead',
    github: 'gwaiffemark001',
    email: 'mar666068@gmail.com',
    phone: '+256787870644',
    image: gwaiffeImage,
    initials: 'GM',
    color: { bg: '#EEEDFE', text: '#3C3489', border: '#AFA9EC' },
  },
  {
    name: 'Mugabe Gideon',
    role: 'Backend Engineer',
    github: 'gideon-it-ug',
    email: 'mugabegideon44@gmail.com',
    phone: '+256772224117',
    image: gideonImage,
    initials: 'MG',
    color: { bg: '#E6F1FB', text: '#0C447C', border: '#93C5FD' },
  },
  {
    name: 'Ahurira Grace',
    role: 'UX Designer',
    github: 'graceahurira20-jpg',
    email: 'graceahurira20@gmail.com',
    phone: '+256706737695',
    image: graceImage,
    initials: 'AG',
    color: { bg: '#EAF3DE', text: '#27500A', border: '#A3C97A' },
  },
  {
    name: 'Talituleka Mwelu Hope',
    role: 'QA & Support',
    github: 'Talituleka-Hope-Mwelu',
    email: 'talitulekah@gmail.com',
    phone: '+256764597619',
    image: hopeImage,
    initials: 'TH',
    color: { bg: '#FAECE7', text: '#712B13', border: '#F4A98A' },
  },
  {
    name: 'Sekiranda Emma Michael',
    role: 'Frontend Engineer',
    github: 'fsena42',
    email: 'sekirandaemma256@gmail.com',
    phone: '+256704578894',
    image: emmaImage,
    initials: 'SE',
    color: { bg: '#E1F5EE', text: '#085041', border: '#6ECFAD' },
  },
  {
    name: 'Ogesa Patrick',
    role: 'DevOps',
    github: 'patrickogesa',
    email: 'patrickogesagp@gmail.com',
    phone: '+256757887491',
    image: ogesaImage,
    initials: 'OP',
    color: { bg: '#FAEEDA', text: '#633806', border: '#E8C07A' },
  },
]

export default function Homepage() {
  return (
    <div className="homepage-page">

      {/* ── Navbar ── */}
      <nav className="homepage-nav">
        <div className="nav-brand">
          <img src="/ILES-Logo.png" alt="ILES logo" className="nav-logo" />
          <span className="nav-name">ILES</span>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#team" className="nav-link">Team</a>
          <a href="#contact" className="nav-link">Contact</a>
          <a href="#" className="nav-link" onClick={(e) => e.preventDefault()}>About</a>
          <a href="#" className="nav-link" onClick={(e) => e.preventDefault()}>Help</a>
        </div>
        <div className="nav-actions">
          <Link className="nav-login" to="/login">Login</Link>
        </div>
      </nav>

      <div className="homepage-cards">

        {/* Hero Card */}
        <section className="homepage-hero" id="features">
          <div className="homepage-copy">
            <h1>Internship Logging &amp; Evaluation System</h1>
            <p>Streamline internship supervision, logging, and evaluations for students, supervisors, and administrators.</p>
            <div className="homepage-actions">
              <Link className="homepage-primary-button" to="/signup">Get Started &raquo;</Link>
            </div>
          </div>
          <div className="homepage-features">
            <article>
              <div className="feat-icon feat-icon--blue">
                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
              </div>
              <div>
                <h2>Students</h2>
                <p>Submit weekly logs, track progress, and receive supervisor feedback.</p>
              </div>
            </article>
            <article>
              <div className="feat-icon feat-icon--teal">
                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </div>
              <div>
                <h2>Supervisors</h2>
                <p>Review logs, evaluate interns, and manage assigned placements.</p>
              </div>
            </article>
            <article>
              <div className="feat-icon feat-icon--purple">
                <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 14.93V17a1 1 0 11-2 0v-.07A8.001 8.001 0 014.07 11H4a1 1 0 110-2h.07A8.001 8.001 0 0111 4.07V4a1 1 0 112 0v.07A8.001 8.001 0 0119.93 11H20a1 1 0 110 2h-.07A8.001 8.001 0 0113 16.93z"/></svg>
              </div>
              <div>
                <h2>Administrators</h2>
                <p>Manage placements, approvals, and system workflows from one place.</p>
              </div>
            </article>
          </div>
        </section>

        {/* Team Section */}
        <section className="homepage-team-section" id="team">
          <div className="team-header">
            <p>Team contributors</p>
            <h2>Meet our core contributors</h2>
          </div>

          <div className="team-cards">
            {cards.map((card) => (
              <article key={card.github} className="team-card" style={{ borderColor: card.color.border }}>
                <div className="team-card-top">
                  <div className="team-card-image">
                    <img src={card.image} alt={card.name} />
                  </div>
                  <div className="team-card-header">
                    <h3>{card.name}</h3>
                    <span
                      className="role-badge"
                      style={{ background: card.color.bg, color: card.color.text }}
                    >
                      {card.role}
                    </span>
                  </div>
                </div>
                <div className="team-card-body">
                  <hr className="card-sep" />
                  <div className="contact-row">
                    <svg className="contact-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="#94a3b8" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    <span className="contact-text">{card.email}</span>
                  </div>
                  <div className="contact-row">
                    <svg className="contact-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="#94a3b8" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.29 21 3 13.71 3 4.99 3 4.45 3.45 4 4 4h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.21 2.2z"/></svg>
                    <span className="contact-text">{card.phone}</span>
                  </div>
                  <div className="contact-row">
                    <svg className="contact-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="#7dd3fc" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.3 1.19-3.11-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.19.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.5 3.17-1.19 3.17-1.19.63 1.59.23 2.76.11 3.05.74.81 1.19 1.85 1.19 3.11 0 4.43-2.7 5.4-5.28 5.69.42.36.8 1.08.8 2.18 0 1.58-.01 2.86-.01 3.25 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.35.5 12 .5z"/></svg>
                    <a className="contact-link" href={`https://github.com/${card.github}`} target="_blank" rel="noreferrer">@{card.github}</a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="homepage-stats">
            <div className="stat-item">
              <span className="stat-num">6</span>
              <span className="stat-lbl">Team members</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">500+</span>
              <span className="stat-lbl">Deployments</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">4</span>
              <span className="stat-lbl">User roles</span>
            </div>
          </div>

          <footer className="homepage-footer" id="contact">
            <p>© {new Date().getFullYear()} ILES. All rights reserved.</p>
          </footer>
        </section>

      </div>
    </div>
  )
}
