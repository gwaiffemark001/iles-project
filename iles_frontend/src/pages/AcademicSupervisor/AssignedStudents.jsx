import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import "./AcademicSupervisorSubpages.css";

const AssignedStudents = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  const students = [
    {name: "Hope Mwelu", student_id: "2500703595", placement: "MTN Uganda", supervisor: "Mr. Kato", logs: 12, status: "Pending"},
    {name: "Grace Ahurira", student_id: "2400702848", placement: "Stanbic Bank", supervisor: "Ms. Nankya", logs: 8, status: "Reviewed"},
    {name: "Emma Michael", student_id: "2500715631", placement: "Airtel Uganda", supervisor: "Mr. Ssali", logs: 3, status: "Overdue"}
  ];

const getStatusClass = (status) => {
    if (status === "Pending") return "status-pending";
    if (status === "Reviewed") return "status-reviewed";
    if (status === "Overdue") return "status-overdue";
};

const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || s.status === filter;
    return matchesSearch && matchFilter;
});

  return (
    <Layout role="Academic Supervisor" userName="Dr. Susan">

        {/*Top Bar */}
        <div className="topbar">
            <div>
                <h1>Assigned Students</h1>
                <p>Manage and evaluate your assigned students</p>
            </div>
            <div className="avatar">DS</div>
        </div>

        {/* Search and Filter */}
        <div className="search-bar">
            <input 
                type="text"
                placeholder="Search student by name..."
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

        {/* Students Table */}
        <div className="section-title">Students List</div>
        <div className="students-table">
            <div className="table-header">
                <div>Student Name</div>
                <div>Student ID</div>
                <div>Place of Internship</div>
                <div>Company Supervisor</div>
                <div>Logs Submitted</div>
                <div>Status</div>
                <div>Action</div>
            </div>
            {filteredStudents.map((student, index) => (
                <div className="table-row" key={index}>
                    <div>{student.name}</div>
                    <div>{student.student_id}</div>
                    <div>{student.placement}</div>
                    <div>{student.supervisor}</div>
                    <div>{student.logs}</div>
                    <div><span className={getStatusClass(student.status)}>{student.status}</span></div>
                    <div className="action-btns">
                        <button className="btn-view" onClick={() => navigate("/academic-supervisor/student-logs")}>
                            View Logs
                        </button>
                        <button className="btn-evaluate">Evaluate</button>
                    </div>
                </div>
            ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
            <button className="page-btn"> ← Previous </button>
            <span className="page-info">Page 1 of 1</span>
            <button className="page-btn"> Next → </button>
        </div>
    </Layout>
);
};
export default AssignedStudents;