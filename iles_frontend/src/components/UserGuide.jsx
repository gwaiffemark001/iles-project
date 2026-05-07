import { useState } from 'react';
import './UserGuide.css';

export default function UserGuide({ userRole }) {
  const [isOpen, setIsOpen] = useState(false);

  const guides = {
    student: {
      title: 'Student User Guide',
      sections: [
        {
          heading: 'Overview',
          content: 'The ILES (Internship Logging & Evaluation System) helps you track and document your internship progress week by week.',
        },
        {
          heading: 'Weekly Logs',
          content: 'Submit a weekly log for each week of your internship. Include activities you performed, challenges faced, and what you learned. Logs can be saved as drafts before submission and can be edited if in draft status.',
        },
        {
          heading: 'My Placements',
          content: 'View details of your current and past internship placements, including company information, supervisors assigned, and placement status (active, completed, etc.).',
        },
        {
          heading: 'Evaluations',
          content: 'View scores and feedback from your supervisors. Once a log is approved by a supervisor, it can be evaluated. You\'ll see both workplace and academic supervisor scores with detailed criteria breakdown.',
        },
        {
          heading: 'Criteria',
          content: 'See the evaluation criteria your supervisors use to assess your work. Each criterion has a max score and weighted contributions from workplace and academic supervisors.',
        },
        {
          heading: 'Notifications',
          content: 'Receive updates about your logs and evaluations. Check here to see when supervisors review or approve your submissions.',
        },
        {
          heading: 'Chat',
          content: 'Communicate directly with your workplace supervisor, academic supervisor, and admin. Your most recent chats appear at the top. Unread message counts are shown in red badges.',
        },
      ],
    },
    workplace_supervisor: {
      title: 'Workplace Supervisor User Guide',
      sections: [
        {
          heading: 'Overview',
          content: 'As a Workplace Supervisor, you oversee and evaluate your students\' internship activities and performance in your organization.',
        },
        {
          heading: 'My Evaluations',
          content: 'Review submitted logs from your assigned students. For each log, you can provide feedback and a workplace evaluation score. A log must be approved by a supervisor before it can be evaluated.',
        },
        {
          heading: 'My Students',
          content: 'View a list of students assigned to your supervision. See their placements, submission status, and evaluation progress.',
        },
        {
          heading: 'Notifications',
          content: 'Get notified when students submit new logs. Stay updated on the evaluation workflow and system changes.',
        },
        {
          heading: 'Criteria',
          content: 'Review the evaluation criteria you\'ll use to assess student performance. Each criterion has specific weight distribution between workplace and academic components.',
        },
        {
          heading: 'Chat',
          content: 'Communicate directly with your students and the admin. Use chat to provide additional guidance or discuss specific logs outside of formal evaluation.',
        },
      ],
    },
    academic_supervisor: {
      title: 'Academic Supervisor User Guide',
      sections: [
        {
          heading: 'Overview',
          content: 'As an Academic Supervisor, you evaluate students\' internship learning and development from an academic perspective.',
        },
        {
          heading: 'My Evaluations',
          content: 'Review and evaluate submitted logs from your assigned students. A log must be approved by any supervisor before it can be evaluated. Provide academic feedback and scores.',
        },
        {
          heading: 'My Students',
          content: 'View a list of students under your academic supervision. Track their progress across different placements and weeks.',
        },
        {
          heading: 'Notifications',
          content: 'Receive notifications about new log submissions and evaluation requests. Stay informed about important system updates.',
        },
        {
          heading: 'Criteria',
          content: 'Review the academic evaluation criteria. Understand how scores are weighted and combined with workplace supervisor scores.',
        },
        {
          heading: 'Chat',
          content: 'Send messages to your students and the admin. Use chat for quick clarifications or additional academic guidance.',
        },
      ],
    },
    admin: {
      title: 'Administrator User Guide',
      sections: [
        {
          heading: 'Overview',
          content: 'As Administrator, you have full system access to manage users, placements, evaluations, and criteria.',
        },
        {
          heading: 'System Overview',
          content: 'The overview dashboard shows system statistics: total students, active placements, total logs submitted, and evaluation metrics. Click any stat card to manage that section.',
        },
        {
          heading: 'User Management',
          content: 'Create, edit, and delete user accounts. Assign roles (student, workplace supervisor, academic supervisor, admin). Set user details like names, emails, and contact information.',
        },
        {
          heading: 'Placement Management',
          content: 'Create and manage internship placements. Link students with their workplace and academic supervisors. Update company information and placement status.',
        },
        {
          heading: 'Evaluation Management',
          content: 'Review all system evaluations across placements. View detailed evaluation breakdowns by week and criteria. Delete evaluations if needed.',
        },
        {
          heading: 'Criteria Management',
          content: 'Define and manage evaluation criteria. Set max scores and determine the weight distribution between workplace (default 40%) and academic (default 60%) supervisors.',
        },
        {
          heading: 'Chat',
          content: 'Communicate with all users in the system. Provide support, answer questions, and maintain system oversight through direct messaging.',
        },
      ],
    },
  };

  const currentGuide = guides[userRole] || guides.student;

  return (
    <>
      <button
        className="user-guide-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Open User Guide"
      >
        ❓
      </button>

      {isOpen && (
        <div className="user-guide-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="user-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-guide-header">
              <h1>{currentGuide.title}</h1>
              <button
                className="user-guide-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close guide"
              >
                ✕
              </button>
            </div>

            <div className="user-guide-content">
              {currentGuide.sections.map((section, index) => (
                <div key={index} className="guide-section">
                  <h2>{section.heading}</h2>
                  <p>{section.content}</p>
                </div>
              ))}

              <div className="guide-section info-box">
                <h3>💡 Pro Tips</h3>
                <ul>
                  <li>Use the Chat feature for quick communication with colleagues</li>
                  <li>Check Notifications regularly to stay updated</li>
                  <li>Review Evaluation Criteria before submitting work</li>
                  <li>Save your logs as drafts before final submission</li>
                </ul>
              </div>
            </div>

            <div className="user-guide-footer">
              <button
                className="user-guide-close-btn"
                onClick={() => setIsOpen(false)}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
