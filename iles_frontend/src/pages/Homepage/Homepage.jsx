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
    image: unknownPersonImage,
    highlight: 'No image available',
  },
  {
    name: 'Mugabe Gideon',
    role: 'Frontend Engineer',
    github: 'gideon-it-ug',
    email: 'mugabegideon44@gmail.com',
    image: gideonImage,
  },
  {
    name: 'Ahurira Grace',
    role: 'UX Designer',
    github: 'graceahurira20-jpg',
    email: 'graceahurira20@gmail.com',
    image: graceImage,
  },
  {
    name: 'Talituleka Mwelu Hope',
    role: 'QA & Support',
    github: 'Talituleka-Hope-Mwelu',
    email: 'talitulekah@gmail.com',
    image: hopeImage,
  },
  {
    name: 'Sekiranda Emma Michael',
    role: 'Backend Engineer',
    github: 'fsena42',
    email: 'sekirandaemma256@gmail.com',
    image: emmaImage,
  },
  {
    name: 'Ogesa Patrick',
    role: 'DevOps',
    github: 'patrickogesa',
    email: 'patrickogesagp@gmail.com',
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
              <div className="team-card-image">
                <img src={card.image} alt={card.name} />
              </div>
              <div className="team-card-body">
                <h3>{card.name}</h3>
                <p>{card.role}</p>
                <p className="team-card-contact">{card.email}</p>
                <a href={`https://github.com/${card.github}`} target="_blank" rel="noreferrer">
                  @{card.github}
                </a>
                {card.highlight ? <span className="team-card-highlight">{card.highlight}</span> : null}
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
