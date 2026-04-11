import {Link} from 'react-router-dom';
import './Firstpage.css';
import './ILES.css'; 

function Firstpage() {
    return (
        <>

            <div className='page_1'>
                <header className='header'>
                    <h1 className="head">WELCOME TO ILES</h1>
                    <nav className='nav-menu'>
                        <ul>
                            <li><a href="">Home</a></li>
                            <li><a href="">About </a></li>
                            <li><a href="">services</a></li>
                            <li><a href="">Contact</a></li>
                        </ul>

                    </nav>
                    <img className="logo" src="/ILES-Logo.png" alt="ILES logo" />
                </header>
                <section className="logins">
                    <input type="text" placeholder="Username/Email"></input>
                    <input type="password" placeholder="Password"></input>
                    <button className="login-btn"><a href="">Login</a></button>
                    
                </section>
                <section className='failed_login'>
                    <p className="signup"><Link to="/signup">Sign up</Link></p>
                    <p className="signup"><Link to="/forgot-password">Forgot Password</Link></p>
                </section>
                <footer className="footer">
                    <p>&copy; {new Date().getFullYear()} ILES</p>
                </footer>
                
            </div>
        </>

    );
}

export default Firstpage