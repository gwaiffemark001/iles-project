import {Link} from 'react-router-dom';
import './Login.css';
import '../../ILES.css'; 

function Login() {
    return (
        <>

            <div className='page_1'>
                <div className='centre_logins'>
                    <header className='header'>
                        <h1 className="head">WELCOME TO ILES</h1>
                        <h2 className="subhead">Login to continue</h2>
                        <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
                    </header>
                    <div >
                        <form className="logins">
                            <input type="text" placeholder="Username/Email"></input>
                            <input type="password" placeholder="Password"></input>
                            <button className="login-btn"><a href="">Login</a></button>
                            
                        </form>
                        <section className='failed_login'>
                            <p className="signup"><Link to="/signup">Sign up</Link></p>
                            <p className="signup"><Link to="/forgot-password">Forgot Password?</Link></p>
                        </section>
                    </div>
                </div>
                <footer className="footer">
                    <p>&copy; {new Date().getFullYear()} ILES</p>
                </footer>
                
            </div>
        </>

    );
}

export default Login;
