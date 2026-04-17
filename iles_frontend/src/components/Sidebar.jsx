import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

const menuItems = {
    "Workplace Supervisor": [
        {label: "Dashboard", path: "/workplace-supervisor/dashboard"},
        {label: "Assigned Interns", path: "/workplace-supervisor/assigned-interns"},
        {label: "Evaluate Logs", path: "/workplace-supervisor/evaluate"},
        {label: "Evaluation history", path: "/workplace-supervisor/history"},
    ],
    "Academic Supervisor": [
        {label: "Dashboard", path: "/academic-supervisor/dashboard"},
        {label: "Assigned Students", path: "/academic-supervisor/assigned-students"},
        {label: "View evaluations", path: "/academic-supervisor/evaluations"},
        {label: "Reports", path: "/academic-supervisor/reports"},
    ],
    Student: [
        {label: "Dashboard", path: "/student/dashboard"},
        {label: "Submit Log", path: "/student/log-entry"},
        {label: "My Logs", path: "/student/my-logs"},
        {label: "My Evaluations", path: "/student/evaluations"},
    ],
    Admin: [
        {label: "Dashboard", path: "/admin/dashboard"},
        {label: "Manage Users", path: "/admin/users"},
        {label: "View All Logs", path: "/admin/logs"},
        {label: "Reports", path: "/admin/reports"},
    ],
};

const Sidebar = ({ role, userName }) => {
    const navigate = useNaviagate();
    const location = useLocation();
    const items = menuItems[role] || [];

    return (
        <div className="sidebar">
            <div className="sidebar-logo">ILES</div>
            <div className="sidebar-role">{role}
            <div className="sidebar-divider"></div>
            <nav className="sidebar-nav">
                {items.map((item) => (
                    <button
                        key={item.path}
                        className={`sidebar-nav-item ${location.pathname === item.path ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="sidebar-bottom">
                <div className ="sidebar-username">{userName}</div>
                <button className="nav-item logout" onClick={() => navigate("/")}>Logout</button>
            </div>
            </div>
        </div>
    );
};

export default Sidebar;