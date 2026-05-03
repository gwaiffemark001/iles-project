import { Navigate, Route, Routes } from 'react-router-dom'

import Firstpage from '../Firstpage'
import ForgotPassword from '../pages/Login/ForgotPassword'
import Signup from '../pages/Signup/Signup'
import StudentDashboard from '../pages/Student/StudentDashboard'
import PlacementsList from '../pages/Student/PlacementsList'
import PlacementDetail from '../pages/Student/PlacementDetail'
import Applications from '../pages/Student/Applications'
import LogbookList from '../pages/Student/LogbookList'
import LogbookEditor from '../pages/Student/LogbookEditor'
import AcademicSupervisorDashboard from '../pages/AcademicSupervisor/AcademicSupervisorDashboard'
import AssignedStudents from '../pages/AcademicSupervisor/AssignedStudents'
import WorkplaceSupervisorDashboard from '../pages/WorkplaceSupervisor/WorkplaceSupervisorDashboard'
import AdminDashboard from '../pages/AdminDashboard'

import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import AppLanding from './AppLanding'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Firstpage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Legacy paths (keep until Signup/Login are refactored) */}
      <Route path="/studentdashboard" element={<Navigate to="/app/student" replace />} />
      <Route path="/student-dashboard" element={<Navigate to="/app/student" replace />} />
      <Route path="/student/log-entry" element={<Navigate to="/app/student/logbook/new" replace />} />
      <Route path="/student/my-logs" element={<Navigate to="/app/student/logbook" replace />} />
      <Route path="/student/evaluations" element={<Navigate to="/app/student" replace />} />
      <Route path="/workplace_supervisor-dashboard" element={<Navigate to="/app/workplace" replace />} />
      <Route path="/academic_supervisor-dashboard" element={<Navigate to="/app/academic" replace />} />
      <Route path="/admin-dashboard" element={<Navigate to="/app/admin" replace />} />

      {/* Protected app */}
      <Route path="/app" element={<ProtectedRoute />}>
        <Route index element={<AppLanding />} />

        <Route path="student" element={<RoleRoute allow={['student']} />}>
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="placements" element={<PlacementsList />} />
          <Route path="placements/:id" element={<PlacementDetail />} />
          <Route path="applications" element={<Applications />} />
          <Route path="logbook" element={<LogbookList />} />
          <Route path="logbook/:id" element={<LogbookEditor />} />
        </Route>

        <Route path="workplace" element={<RoleRoute allow={['workplace_supervisor']} />}>
          <Route index element={<WorkplaceSupervisorDashboard />} />
          <Route path="dashboard" element={<WorkplaceSupervisorDashboard />} />
        </Route>

        <Route path="academic" element={<RoleRoute allow={['academic_supervisor']} />}>
          <Route index element={<AcademicSupervisorDashboard />} />
          <Route path="dashboard" element={<AcademicSupervisorDashboard />} />
          <Route path="students" element={<AssignedStudents />} />
        </Route>

        <Route path="admin" element={<RoleRoute allow={['admin', 'program_admin']} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

