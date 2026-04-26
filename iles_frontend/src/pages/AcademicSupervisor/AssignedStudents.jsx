import { useState } from "react";
import Layout from "../../components/Layout";
import "./AssignedStudents.cc";

const AssignedStudents = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

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

    </Layout>
);
};
export default AssignedStudents;