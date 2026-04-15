import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import WorkplaceSupervisorDashboard from "./pages/WorkplaceSupervisor/WorkplaceSupervisorDashboard";
import AcademicSupervisorDashboard from "./pages/AcademicSupervisor/AcademicSupervisorDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/workplace-supervisor/dashboard" element={<WorkplaceSupervisorDashboard />} />
        <Route path="/academic-supervisor/dashboard" element={<AcademicSupervisorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;