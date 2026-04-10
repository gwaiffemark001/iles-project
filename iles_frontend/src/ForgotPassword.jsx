import { Link } from 'react-router-dom';
import './Firstpage.css';
import './ILES.css';

function ForgotPassword() {
    return (
        <>
            <div className='page_1'>
                <header className='header_1'>
                    <h1 className="head">RESET PASSWORD</h1>
                    <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
                </header>
                <section className="logins">
                    <input type="email" placeholder="Enter your email"></input>
                    <button className="login-btn">Send Reset Link</button>
                </section>
                <section className='failed_login'>
                    <p className="signup"><Link to="/">Back to Login</Link></p>
                    <p className="signup"><Link to="/signup">Sign up</Link></p>
                </section>
            </div>
        </>
    );
}

export default ForgotPassword;
