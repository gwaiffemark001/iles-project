import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import "./StudentLogViewer.css";

const StudentLogViewer = () => {
  const navigate = useNavigate();

  return (
    <Layout role="Academic Supervisor" userName="Dr. Susan">

      {/* Top Bar */}
      <div className="topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={() => navigate("/academic-supervisor/students")}>
            ← Back
          </button>
          <div>
            <h1>Student Log Viewer</h1>
            <p>Viewing logs for assigned student</p>
          </div>
        </div>
        <div className="avatar">DS</div>
      </div>

      {/* Student Info Card */}
      <div className="student-info-card">
        <div className="student-info-left">
          <div className="student-avatar">HM</div>
          <div>
            <h2 className="student-name">Hope Mwelu</h2>
            <p className="student-detail">Student ID: 2100700123</p>
            <p className="student-detail">Department: Computer Science</p>
          </div>
        </div>
        <div className="student-info-right">
          <div className="info-item">
            <span className="info-label">Place of Internship</span>
            <span className="info-value">MTN Uganda</span>
          </div>
          <div className="info-item">
            <span className="info-label">Company Supervisor</span>
            <span className="info-value">Mr. Kato</span>
          </div>
          <div className="info-item">
            <span className="info-label">Internship Period</span>
            <span className="info-value">Jan 2026 — Apr 2026</span>
          </div>
        </div>
      </div>

    </Layout>
  );
};

export default StudentLogViewer;