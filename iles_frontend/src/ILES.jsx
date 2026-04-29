<<<<<<< HEAD
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Firstpage from './Firstpage';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import StudentDash from './StudentDash';
import WorkplaceSupervisorDashboard from "./pages/WorkplaceSupervisor/WorkplaceSupervisorDashboard";
import AcademicSupervisorDashboard from "./pages/AcademicSupervisor/AcademicSupervisorDashboard";
import AssignedStudents from "./pages/AcademicSupervisor/AssignedStudents";
import StudentLogViewer from "./pages/AcademicSupervisor/StudentLogViewer";

function ILES() {
    return (
        <BrowserRouter> 
        <Routes>
            <Route path="/" element={<Firstpage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path='/studentdashboard' element={ <StudentDash />}/>
            <Route path="/workplace-supervisor/dashboard" element={<WorkplaceSupervisorDashboard />} />
            <Route path="/academic-supervisor/dashboard" element={<AcademicSupervisorDashboard />} />
            <Route path="/academic-supervisor/students" element={<AssignedStudents />} />
            <Route path="/academic-supervisor/student-logs" element={<StudentLogViewer />} />
        </Routes>
       
        
        </BrowserRouter>
    );
=======
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import Login from "./pages/Login/Login";
import ForgotPassword from "./pages/Login/ForgotPassword";
import Signup from "./pages/Signup/Signup";
import AcademicSupervisorDashboard from "./pages/AcademicSupervisor/AcademicSupervisorDashboard";
import StudentDashboard from "./pages/Student/StudentDashboard";
import WorkplaceSupervisorDashboard from "./pages/WorkplaceSupervisor/WorkplaceSupervisorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

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
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/academic_supervisor-dashboard" element={<Navigate to="/academic-supervisor/dashboard" replace />} />
        <Route path="/workplace_supervisor-dashboard" element={<Navigate to="/workplace-supervisor/dashboard" replace />} />
        <Route path="/student-dashboard" element={<Navigate to="/student/dashboard" replace />} />
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
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
    </AuthProvider>
  );
>>>>>>> main
}

export default App;
