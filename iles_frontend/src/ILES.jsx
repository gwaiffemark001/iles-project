import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import Firstpage from "./pages/Login/Firstpage";
import ForgotPassword from "./pages/Login/ForgotPassword";
import Signup from "./pages/Signup/Signup";
import AcademicSupervisorDashboard from "./pages/AcademicSupervisor/AcademicSupervisorDashboard";
import StudentDashboard from "./pages/Student/StudentDashboard";
import WorkplaceSupervisorDashboard from "./pages/WorkplaceSupervisor/WorkplaceSupervisorDashboard";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { loading, user } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      
      <Routes>
        <Route path="/" element={<Firstpage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/workplace-supervisor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["workplace_supervisor"]}>
              <WorkplaceSupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-supervisor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["academic_supervisor"]}>
              <AcademicSupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
    </AuthProvider>
  );
}

export default App;
