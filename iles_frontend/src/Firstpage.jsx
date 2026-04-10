import {Link} from 'react-router-dom';
import './Firstpage.css';
import './ILES.css'; 

function Firstpage() {
    return (
        <>

            <div className='page_1'>
                <header className='header_1'>
                    <h1 className="head">WELCOME TO ILES</h1>
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
                
            </div>
        </>

    );
}

export default Firstpage