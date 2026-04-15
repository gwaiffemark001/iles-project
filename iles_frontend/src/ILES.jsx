import { Routes, Route } from 'react-router-dom';
import Firstpage from './Firstpage';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import WeeklyLogDashboard from './WeeklyLogDashboard';


function ILES() {
    return (
        <> 
        <Routes>
            <Route path="/" element={<Firstpage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path='/weeklyLog' element={ <WeeklyLogDashboard />}/>
        </Routes>
       
        
        </>
    );
}

export default ILES;
