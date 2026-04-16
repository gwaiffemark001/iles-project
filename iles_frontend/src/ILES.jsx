import { Routes, Route } from 'react-router-dom';
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import WorkplaceSupervisorDashboard from "./pages/WorkplaceSupervisor/WorkplaceSupervisorDashboard";
import AcademicSupervisorDashboard from "./pages/AcademicSupervisor/AcademicSupervisorDashboard";
import ForgotPassword from './pages/Login/ForgotPassword';
import StudentDashboard from './pages/Dashboard/StudentDashboard';



function ILES() {
    return (
        <> 
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/student-dashboard/dashboard" element={<StudentDashboard/>}/>
            <Route path="/workplace-supervisor/dashboard" element={<WorkplaceSupervisorDashboard />} />
            <Route path="/academic-supervisor/dashboard" element={<AcademicSupervisorDashboard />} />
        </Routes>
        </>
    );
}

export default ILES;
