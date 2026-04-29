import { Link } from 'react-router-dom';
import './Login.css';

function ForgotPassword() {


    return (
        <>
            <div className='page_1' style={{ height: "100vh" } }>
                <div className='centre_logins'>
                    <header className='header_1'>
                        <h1 className="head">RESET PASSWORD</h1>
                        <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
                    </header>
                    <form className="logins">
                        <input type="email" placeholder="Enter your email"></input>
                        <button type='submit' className="login-btn">Send Reset Link</button>
                    </form>
                    <section className='failed_login' style={{width: "400px"}}>
                        <p className="signup"><Link to="/">Back to Login</Link></p>
                        <p className="signup"><Link to="/signup">Sign up</Link></p>
                    </section>
                </div>
            </div>
        </>
    );
}

export default ForgotPassword;
