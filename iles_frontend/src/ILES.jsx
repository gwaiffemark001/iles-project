import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Firstpage from './Firstpage';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import StudentDash from './StudentDash';
import WorkplaceSupervisorDashboard from "./pages/WorkplaceSupervisor/WorkplaceSupervisorDashboard";
import AcademicSupervisorDashboard from "./pages/AcademicSupervisor/AcademicSupervisorDashboard";
import AssignedStudents from "./pages/AcademicSupervisor/AssignedStudents";

function ILES() {
    return (
        <BrowserRouter> 
        <Routes>
            <Route path="/" element={<Firstpage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path='/studentdashboard' element={ <studentDashboard />}/>
            <Route path="/workplace-supervisor/dashboard" element={<WorkplaceSupervisorDashboard />} />
            <Route path="/academic-supervisor/dashboard" element={<AcademicSupervisorDashboard />} />
            <Route path="/academic-supervisor/students" element={<AssignedStudents />} />
        </Routes>
       
        
        </BrowserRouter>
    );
}

export default ILES;
