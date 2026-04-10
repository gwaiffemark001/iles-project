import { Routes, Route } from 'react-router-dom';
import Firstpage from './Firstpage';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';

function ILES() {
    return (
        <Routes>
            <Route path="/" element={<Firstpage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
    );
}

export default ILES;
