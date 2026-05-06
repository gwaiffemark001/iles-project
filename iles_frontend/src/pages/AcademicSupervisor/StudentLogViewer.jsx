import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import "./AcademicSupervisorSubpages.css";

const StudentLogViewer = () => {
  const navigate = useNavigate();
  const [selectedLog, setSelectedLog] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredLogs = logs.filter((log) => {
    const matchSearch = log.summary.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || log.status === filter;
    return matchSearch && matchFilter;
  });

  const logs = [
    { id: 1, date: "2026-01-06", summary: "Attended orientation and met the team", hours: 8, status: "Reviewed", comments: "Good start! Keep it up." },
    { id: 2, date: "2026-01-07", summary: "Worked on database design with senior developer", hours: 8, status: "Reviewed", comments: "Great work on the ER diagram." },
    { id: 3, date: "2026-01-08", summary: "Attended team standup and worked on UI mockups", hours: 7, status: "Pending", comments: "" },
    { id: 4, date: "2026-01-09", summary: "Fixed bugs in the frontend codebase", hours: 8, status: "Pending", comments: "" },
    { id: 5, date: "2026-01-10", summary: "Wrote unit tests for the API endpoints", hours: 6, status: "Overdue", comments: "" },
  ];

  const getStatusClass = (status) => {
    if (status === "Reviewed") return "badge reviewed";
    if (status === "Pending") return "badge pending";
    if (status === "Overdue") return "badge overdue";
  };

  return (
    <Layout role="Academic" userName="Dr. Susan">

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
            <p className="student-detail">Student ID:2500703595</p>
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

      {/* Log Statistics */}
      <div className="log-stats">
        <div className="log-stat-card">
          <div className="stat-label">Total Logs</div>
          <div className="stat-num blue">5</div>
        </div>
        <div className="log-stat-card">
          <div className="stat-label">Reviewed</div>
          <div className="stat-num green">2</div>
        </div>
        <div className="log-stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-num amber">2</div>
        </div>
        <div className="log-stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-num red">1</div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="logs-section">
        <div className="logs-header">
          <div className="section-title">Submitted Logs</div>
          <div className="logs-filters">
            <input
              type="text"
              placeholder="Search logs..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
        <div className="logs-table">
          <div className="table-header">
            <div>Log #</div>
            <div>Date</div>
            <div>Activity Summary</div>
            <div>Hours</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          {filteredLogs.map((log) => (
            <div className="table-row" key={log.id}>
              <div>#{log.id}</div>
              <div>{log.date}</div>
              <div className="log-summary">{log.summary}</div>
              <div>{log.hours}hrs</div>
              <div><span className={getStatusClass(log.status)}>{log.status}</span></div>
              <div className="action-btns">
                <button
                  className="btn-view"
                  onClick={() => setSelectedLog(log)}
                >
                  View
                </button>
                {log.status !== "Reviewed" && (
                  <button
                    className="btn-evaluate"
                    onClick={() => navigate("/academic-supervisor/evaluate")}
                  >
                    Evaluate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="log-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log #{selectedLog.id} — {selectedLog.date}</h3>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <span className="modal-label">Activity Summary</span>
                <p className="modal-value">{selectedLog.summary}</p>
              </div>
              <div className="modal-section">
                <span className="modal-label">Hours Worked</span>
                <p className="modal-value">{selectedLog.hours} hours</p>
              </div>
              <div className="modal-section">
                <span className="modal-label">Status</span>
                <span className={getStatusClass(selectedLog.status)}>{selectedLog.status}</span>
              </div>
              {selectedLog.comments && (
                <div className="modal-section">
                  <span className="modal-label">Supervisor Comments</span>
                  <p className="modal-value">{selectedLog.comments}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default StudentLogViewer;