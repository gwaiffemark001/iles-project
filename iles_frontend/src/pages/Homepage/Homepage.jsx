import { Link } from 'react-router-dom'
import unknownPersonImage from '../../assets/unknown-person.svg'
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
    image: unknownPersonImage,
    highlight: 'No image available',
  },
  {
    name: 'Mugabe Gideon',
    role: 'Frontend Engineer',
    github: 'gideon-it-ug',
    email: 'mugabegideon44@gmail.com',
    phone: '+256772224117',
    image: gideonImage,
  },
  {
    name: 'Ahurira Grace',
    role: 'UX Designer',
    github: 'graceahurira20-jpg',
    email: 'graceahurira20@gmail.com',
    phone: '+256706737695',
    image: graceImage,
  },
  {
    name: 'Talituleka Mwelu Hope',
    role: 'QA & Support',
    github: 'Talituleka-Hope-Mwelu',
    email: 'talitulekah@gmail.com',
    phone: '+256764597619',
    image: hopeImage,
  },
  {
    name: 'Sekiranda Emma Michael',
    role: 'Backend Engineer',
    github: 'fsena42',
    email: 'sekirandaemma256@gmail.com',
    phone: '+256704578894',
    image: emmaImage,
  },
  {
    name: 'Ogesa Patrick',
    role: 'DevOps',
    github: 'patrickogesa',
    email: 'patrickogesagp@gmail.com',
    phone: '+256757887491',
    image: ogesaImage,
  },
]

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
      <section className="homepage-team-section">
        <div className="team-header">
          <p>Team contributors</p>
          <h2>Meet our core contributors</h2>
        </div>
        <div className="team-cards">
          {cards.map((card) => (
            <article key={card.github} className="team-card">
              <div className="team-card-top">
                <div className="team-card-image">
                  <img src={card.image} alt={card.name} />
                </div>
                <div className="team-card-header">
                  <h3>{card.name}</h3>
                  <div className="role-badge">{card.role}</div>
                </div>
              </div>
              <div className="team-card-body">
                <hr className="card-sep" />
                <div className="contact-row">
                  <svg className="contact-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path fill="#94a3b8" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  <div className="contact-text">{card.email}</div>
                </div>
                <div className="contact-row">
                  <svg className="contact-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path fill="#94a3b8" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 01.95-.27c1.05.3 2.19.46 3.38.46a1 1 0 011 1v3.5a1 1 0 01-1 1A17.94 17.94 0 012 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.2.16 2.33.46 3.38.12.36.04.76-.27.95l-2.07 2.46z"/></svg>
                  <div className="contact-text">{card.phone}</div>
                </div>
                <div className="contact-row">
                  <svg className="contact-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path fill="#7dd3fc" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.3 1.19-3.11-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.19.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.5 3.17-1.19 3.17-1.19.63 1.59.23 2.76.11 3.05.74.81 1.19 1.85 1.19 3.11 0 4.43-2.7 5.4-5.28 5.69.42.36.8 1.08.8 2.18 0 1.58-.01 2.86-.01 3.25 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.35.5 12 .5z"/></svg>
                  <a className="contact-link" href={`https://github.com/${card.github}`} target="_blank" rel="noreferrer">@{card.github}</a>
                </div>
              </div>
            </article>
          ))}
        </div>
        <footer className="homepage-footer">
          <p>© {new Date().getFullYear()} ILES. All rights reserved.</p>
        </footer>
      </section>
    </div>
  )
}
