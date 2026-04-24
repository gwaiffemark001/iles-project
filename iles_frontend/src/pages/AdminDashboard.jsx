import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { adminAPI, evaluationsAPI, getErrorMessage, placementsAPI } from "../api/api";
import { useAuth } from "../contexts/useAuth";
import "./AdminDashboard.css";

const navItems = [
  { id: "overview", label: "Overview" },
  { id: "placements", label: "Placements" },
  { id: "evaluations", label: "Evaluations" },
  { id: "criteria", label: "Criteria" },
];

const initialPlacementForm = {
  student_id: "",
  workplace_supervisor_id: "",
  academic_supervisor_id: "",
  company_name: "",
  company_address: "",
  start_date: "",
  end_date: "",
  status: "pending",
};

const getUserInitials = (user) => {
  const firstInitial = user?.first_name?.[0] || "";
  const lastInitial = user?.last_name?.[0] || "";
  return `${firstInitial}${lastInitial}` || user?.username?.slice(0, 2)?.toUpperCase() || "AD";
};

const getFullName = (user) =>
  user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "Unknown";

const titleCase = (value) =>
  value?.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "Unknown";

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
};

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const profileMenuRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [users, setUsers] = useState([]);
  const [placementForm, setPlacementForm] = useState(initialPlacementForm);
  const [activeSection, setActiveSection] = useState("overview");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingPlacement, setSubmittingPlacement] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchDashboardData = async ({ notifySuccess = false, notifyError = false } = {}) => {
    try {
      setError("");
      setLoading(true);

      const [statsResponse, placementsResponse, evaluationsResponse, criteriaResponse, usersResponse] =
        await Promise.all([
          adminAPI.getStatistics(),
          placementsAPI.getPlacements(),
          evaluationsAPI.getEvaluations(),
          api.get("/criteria/"),
          adminAPI.getUsers(),
        ]);

      setStats(statsResponse.data);
      setPlacements(placementsResponse.data);
      setEvaluations(Array.isArray(evaluationsResponse.data) ? evaluationsResponse.data : []);
      setCriteria(Array.isArray(criteriaResponse.data) ? criteriaResponse.data : []);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);

      if (notifySuccess) {
        toast.success("Dashboard refreshed successfully.");
      }
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Unable to load admin dashboard data.");
      setError(message);

      if (notifyError) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate("/");
  };

  const handlePlacementFieldChange = (event) => {
    const { name, value } = event.target;
    setPlacementForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const students = useMemo(() => users.filter((systemUser) => systemUser.role === "student"), [users]);
  const workplaceSupervisors = useMemo(
    () => users.filter((systemUser) => systemUser.role === "workplace_supervisor"),
    [users]
  );
  const academicSupervisors = useMemo(
    () => users.filter((systemUser) => systemUser.role === "academic_supervisor"),
    [users]
  );

  const latestPlacementByStudent = useMemo(() => {
    const sortedPlacements = [...placements].sort(
      (first, second) => new Date(second.created_at || 0) - new Date(first.created_at || 0)
    );

    return sortedPlacements.reduce((map, placement) => {
      const studentId = placement.student?.id;
      if (studentId && !map.has(studentId)) {
        map.set(studentId, placement);
      }
      return map;
    }, new Map());
  }, [placements]);

  const currentPlacementByStudent = useMemo(() => {
    return placements.reduce((map, placement) => {
      const studentId = placement.student?.id;
      if (studentId && ["pending", "active"].includes(placement.status)) {
        map.set(studentId, placement);
      }
      return map;
    }, new Map());
  }, [placements]);

  const studentsAwaitingPlacement = students.filter((student) => !currentPlacementByStudent.has(student.id));

  const startAssignmentForStudent = (student) => {
    const openPlacement = currentPlacementByStudent.get(student.id);

    if (openPlacement) {
      toast.info(`${getFullName(student)} already has a ${titleCase(openPlacement.status).toLowerCase()} placement.`);
      return;
    }

    setActiveSection("placements");
    setPlacementForm((current) => ({
      ...current,
      student_id: String(student.id),
    }));
  };

  const handleCreatePlacement = async (event) => {
    event.preventDefault();
    setSubmittingPlacement(true);

    try {
      const payload = {
        ...placementForm,
        student_id: Number(placementForm.student_id),
        workplace_supervisor_id: Number(placementForm.workplace_supervisor_id),
        academic_supervisor_id: Number(placementForm.academic_supervisor_id),
      };

      const response = await placementsAPI.createPlacement(payload);
      const studentName = response.data?.student_name || getFullName(
        students.find((student) => student.id === payload.student_id)
      );

      toast.success(`Placement assigned successfully for ${studentName}.`);
      setPlacementForm(initialPlacementForm);
      await fetchDashboardData();
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Unable to assign placement.");
      setError(message);
      toast.error(message);
    } finally {
      setSubmittingPlacement(false);
    }
  };

  const displayName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "Administrator";

  const statusBreakdown = stats?.logs_by_status || [];
  const activePlacements = placements.filter((placement) => placement.status === "active").length;
  const completedPlacements = placements.filter((placement) => placement.status === "completed").length;
  const pendingPlacements = placements.filter((placement) => placement.status === "pending").length;
  const averageEvaluationScore = evaluations.length
    ? (
        evaluations.reduce((sum, evaluation) => sum + Number(evaluation.score || 0), 0) /
        evaluations.length
      ).toFixed(1)
    : "0.0";
  const recentEvaluations = [...evaluations]
    .sort((first, second) => new Date(second.evaluated_at) - new Date(first.evaluated_at))
    .slice(0, 6);
  const dashboardCards = [
    {
      label: "Students In System",
      value: students.length || stats?.total_students || 0,
      hint: "All registered student interns",
      tone: "blue",
      target: "placements",
    },
    {
      label: "Awaiting Placement",
      value: studentsAwaitingPlacement.length,
      hint: "Students who still need assignment",
      tone: "amber",
      target: "placements",
    },
    {
      label: "Active Placements",
      value: stats?.active_placements ?? activePlacements,
      hint: "Placements currently running",
      tone: "green",
      target: "placements",
    },
    {
      label: "Pending Reviews",
      value: stats?.pending_logs ?? 0,
      hint: "Submitted logs awaiting review",
      tone: "violet",
      target: "overview",
    },
  ];

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">ILES System</div>
          <div className="admin-role">Administrator</div>
        </div>

        <div className="admin-sidebar-divider" />

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-nav-item"
            onClick={() => fetchDashboardData({ notifySuccess: true, notifyError: true })}
          >
            Refresh Data
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">Internship placement administration</p>
            <h1>Admin dashboard</h1>
            <p className="admin-subtitle">
              View students in the system, assign placements, and track internship progress from one workspace.
            </p>
          </div>
          <div className="admin-profile" ref={profileMenuRef}>
            <button
              type="button"
              className="admin-profile-trigger"
              onClick={() => setProfileMenuOpen((current) => !current)}
            >
              <div className="admin-profile-copy">
                <strong>{displayName}</strong>
                <span>{user?.email || "Administrator"}</span>
              </div>
              <div className="admin-avatar">{getUserInitials(user)}</div>
            </button>

            {profileMenuOpen ? (
              <div className="admin-profile-menu">
                <button
                  type="button"
                  onClick={() => fetchDashboardData({ notifySuccess: true, notifyError: true })}
                >
                  Refresh dashboard
                </button>
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {error ? <div className="admin-alert">{error}</div> : null}

        {loading ? (
          <div className="admin-loading-card">Loading dashboard data...</div>
        ) : (
          <>
            <section className="admin-hero-panel">
              <div>
                <p className="admin-kicker">Placement workflow</p>
                <h2>Assign students to workplace and academic supervisors.</h2>
                <p className="admin-hero-copy">
                  The administrator should be able to see students, check who is still waiting,
                  and create placement records with immediate feedback after each action.
                </p>
              </div>
              <div className="admin-hero-actions">
                <button type="button" className="admin-primary-btn" onClick={() => setActiveSection("placements")}>
                  Assign placements
                </button>
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => fetchDashboardData({ notifySuccess: true, notifyError: true })}
                >
                  Refresh data
                </button>
              </div>
            </section>

            <section className="admin-stat-grid">
              {dashboardCards.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  className={`admin-stat-card ${card.tone}`}
                  onClick={() => setActiveSection(card.target)}
                >
                  <span className="admin-stat-label">{card.label}</span>
                  <strong className="admin-stat-value">{card.value}</strong>
                  <span className="admin-stat-hint">{card.hint}</span>
                </button>
              ))}
            </section>

            {activeSection === "overview" ? (
              <section className="admin-content-grid">
                <article className="admin-panel">
                  <div className="admin-panel-header">
                    <div>
                      <p className="admin-panel-kicker">Placement operations</p>
                      <h3>Internship summary</h3>
                    </div>
                  </div>

                  <div className="admin-highlight-grid">
                    <div className="admin-highlight">
                      <span>Students awaiting placement</span>
                      <strong>{studentsAwaitingPlacement.length}</strong>
                    </div>
                    <div className="admin-highlight">
                      <span>Active placements</span>
                      <strong>{activePlacements}</strong>
                    </div>
                    <div className="admin-highlight">
                      <span>Average evaluation score recorded</span>
                      <strong>{averageEvaluationScore}</strong>
                    </div>
                    <div className="admin-highlight">
                      <span>Evaluation criteria available</span>
                      <strong>{criteria.length}</strong>
                    </div>
                  </div>
                </article>

                <article className="admin-panel">
                  <div className="admin-panel-header">
                    <div>
                      <p className="admin-panel-kicker">Logbook monitoring</p>
                      <h3>Submission status</h3>
                    </div>
                  </div>

                  {statusBreakdown.length ? (
                    <div className="admin-status-list">
                      {statusBreakdown.map((item) => (
                        <div className="admin-status-row" key={item.status}>
                          <span className={`admin-badge ${item.status}`}>{titleCase(item.status)}</span>
                          <strong>{item.count}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-empty">No student logbooks have been submitted yet.</div>
                  )}
                </article>
              </section>
            ) : null}

            {activeSection === "placements" ? (
              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <p className="admin-panel-kicker">Placement management</p>
                    <h3>Student assignment workspace</h3>
                  </div>
                  <div className="admin-mini-stats">
                    <span>Students: {students.length}</span>
                    <span>Awaiting placement: {studentsAwaitingPlacement.length}</span>
                    <span>Workplace supervisors: {workplaceSupervisors.length}</span>
                    <span>Academic supervisors: {academicSupervisors.length}</span>
                  </div>
                </div>

                <div className="admin-placement-layout">
                  <div className="admin-students-panel">
                    <div className="admin-section-heading">
                      <h4>Students in the system</h4>
                      <p>Select a student, then assign a placement.</p>
                    </div>

                    <div className="admin-students-list">
                      {students.length ? (
                        students.map((student) => {
                          const currentPlacement = currentPlacementByStudent.get(student.id);
                          const latestPlacement = latestPlacementByStudent.get(student.id);
                          const isSelected = placementForm.student_id === String(student.id);

                          return (
                            <article
                              key={student.id}
                              className={`admin-student-card ${isSelected ? "selected" : ""}`}
                            >
                              <div className="admin-student-card-top">
                                <div>
                                  <h5>{getFullName(student)}</h5>
                                  <p>{student.email || student.username}</p>
                                </div>
                                <span className={`admin-badge ${currentPlacement?.status || latestPlacement?.status || "draft"}`}>
                                  {currentPlacement
                                    ? titleCase(currentPlacement.status)
                                    : latestPlacement
                                      ? `Last: ${titleCase(latestPlacement.status)}`
                                      : "Awaiting placement"}
                                </span>
                              </div>

                              <div className="admin-student-meta">
                                <span>Student No: {student.student_number || "N/A"}</span>
                                <span>Department: {student.department || "N/A"}</span>
                              </div>

                              <button
                                type="button"
                                className="admin-inline-btn"
                                onClick={() => startAssignmentForStudent(student)}
                              >
                                {currentPlacement ? "Already assigned" : "Assign placement"}
                              </button>
                            </article>
                          );
                        })
                      ) : (
                        <div className="admin-empty">No students are registered in the system yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="admin-form-panel">
                    <div className="admin-section-heading">
                      <h4>Create internship placement</h4>
                      <p>Assign one student to a workplace and an academic supervisor.</p>
                    </div>

                    <form className="admin-placement-form" onSubmit={handleCreatePlacement}>
                      <label>
                        Student
                        <select
                          name="student_id"
                          value={placementForm.student_id}
                          onChange={handlePlacementFieldChange}
                          required
                        >
                          <option value="">Select a student</option>
                          {studentsAwaitingPlacement.map((student) => (
                            <option key={student.id} value={student.id}>
                              {getFullName(student)}
                            </option>
                          ))}
                          {placementForm.student_id &&
                          !studentsAwaitingPlacement.some(
                            (student) => String(student.id) === placementForm.student_id
                          ) ? (
                            <option value={placementForm.student_id}>
                              {getFullName(
                                students.find((student) => String(student.id) === placementForm.student_id)
                              )}
                            </option>
                          ) : null}
                        </select>
                      </label>

                      <label>
                        Workplace Supervisor
                        <select
                          name="workplace_supervisor_id"
                          value={placementForm.workplace_supervisor_id}
                          onChange={handlePlacementFieldChange}
                          required
                        >
                          <option value="">Select workplace supervisor</option>
                          {workplaceSupervisors.map((supervisor) => (
                            <option key={supervisor.id} value={supervisor.id}>
                              {getFullName(supervisor)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Academic Supervisor
                        <select
                          name="academic_supervisor_id"
                          value={placementForm.academic_supervisor_id}
                          onChange={handlePlacementFieldChange}
                          required
                        >
                          <option value="">Select academic supervisor</option>
                          {academicSupervisors.map((supervisor) => (
                            <option key={supervisor.id} value={supervisor.id}>
                              {getFullName(supervisor)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Company Name
                        <input
                          type="text"
                          name="company_name"
                          value={placementForm.company_name}
                          onChange={handlePlacementFieldChange}
                          placeholder="e.g. Uganda Telecom"
                          required
                        />
                      </label>

                      <label>
                        Company Address
                        <textarea
                          name="company_address"
                          value={placementForm.company_address}
                          onChange={handlePlacementFieldChange}
                          placeholder="Company location"
                          rows="3"
                        />
                      </label>

                      <div className="admin-form-row">
                        <label>
                          Start Date
                          <input
                            type="date"
                            name="start_date"
                            value={placementForm.start_date}
                            onChange={handlePlacementFieldChange}
                            required
                          />
                        </label>

                        <label>
                          End Date
                          <input
                            type="date"
                            name="end_date"
                            value={placementForm.end_date}
                            onChange={handlePlacementFieldChange}
                            required
                          />
                        </label>
                      </div>

                      <label>
                        Status
                        <select
                          name="status"
                          value={placementForm.status}
                          onChange={handlePlacementFieldChange}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                      </label>

                      <div className="admin-form-actions">
                        <button type="submit" className="admin-primary-btn" disabled={submittingPlacement}>
                          {submittingPlacement ? "Assigning..." : "Assign placement"}
                        </button>
                        <button
                          type="button"
                          className="admin-secondary-btn"
                          onClick={() => setPlacementForm(initialPlacementForm)}
                        >
                          Reset form
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="admin-placement-table-section">
                  <div className="admin-section-heading">
                    <h4>Existing placements</h4>
                    <p>All created placement records appear here.</p>
                  </div>

                  {placements.length ? (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Company</th>
                            <th>Workplace Supervisor</th>
                            <th>Academic Supervisor</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {placements.map((placement) => (
                            <tr key={placement.id}>
                              <td>{placement.student_name || getFullName(placement.student)}</td>
                              <td>{placement.company_name}</td>
                              <td>
                                {placement.workplace_supervisor_name ||
                                  getFullName(placement.workplace_supervisor)}
                              </td>
                              <td>
                                {placement.academic_supervisor_name ||
                                  getFullName(placement.academic_supervisor)}
                              </td>
                              <td>{formatDate(placement.start_date)}</td>
                              <td>{formatDate(placement.end_date)}</td>
                              <td>
                                <span className={`admin-badge ${placement.status}`}>
                                  {titleCase(placement.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="admin-empty">No placements have been created yet.</div>
                  )}
                </div>
              </section>
            ) : null}

            {activeSection === "evaluations" ? (
              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <p className="admin-panel-kicker">Evaluation activity</p>
                    <h3>Recent submissions</h3>
                  </div>
                  <div className="admin-mini-stats">
                    <span>Total: {evaluations.length}</span>
                    <span>Average score: {averageEvaluationScore}</span>
                  </div>
                </div>

                {recentEvaluations.length ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Type</th>
                          <th>Evaluator</th>
                          <th>Score</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEvaluations.map((evaluation) => (
                          <tr key={evaluation.id}>
                            <td>
                              {evaluation.placement?.student_name ||
                                evaluation.placement?.student?.full_name ||
                                "Unknown student"}
                            </td>
                            <td>
                              <span className={`admin-badge ${evaluation.evaluation_type}`}>
                                {titleCase(evaluation.evaluation_type)}
                              </span>
                            </td>
                            <td>{evaluation.evaluator_name || evaluation.evaluator?.full_name || "Unknown"}</td>
                            <td>{evaluation.score}</td>
                            <td>{formatDate(evaluation.evaluated_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="admin-empty">No evaluations have been submitted yet.</div>
                )}
              </section>
            ) : null}

            {activeSection === "criteria" ? (
              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <p className="admin-panel-kicker">Assessment setup</p>
                    <h3>Evaluation criteria</h3>
                  </div>
                </div>

                {criteria.length ? (
                  <div className="admin-criteria-grid">
                    {criteria.map((criterion) => (
                      <article className="admin-criterion-card" key={criterion.id}>
                        <div className="admin-criterion-topline">
                          <h4>{criterion.name}</h4>
                          <span>{criterion.weight_percent}%</span>
                        </div>
                        <p>{criterion.description || "No description provided for this criterion yet."}</p>
                        <div className="admin-criterion-meta">Maximum score: {criterion.max_score}</div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty">No evaluation criteria are configured yet.</div>
                )}
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
