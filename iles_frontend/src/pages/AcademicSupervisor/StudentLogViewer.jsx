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

    </Layout>
  );
};

export default StudentLogViewer;