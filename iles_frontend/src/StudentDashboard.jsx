import React, {useState} from 'react';
import './StudentDashboard.css';


function studentDashboard(){
    const [logs, setLogs] = useState([]);
    const [FormData, setFormData] = useState({
        week: "",
        tasks: "",
        skills: "",
        hours: "",
    });

    const handleChange = (e) => {
        setFormData({...FormData, 
                    [e.target.name] : e.target.value});
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newLog = {...FormData, 
                        status: "Pending Review",
                        id: Date.now(),

        };

        setLogs([newLog, ...logs]);

        setFormData({
            week: "",
            tasks: "",
            skills: "",
            hours: "",
        });
    };

    return(
        <div className='dashbboard-container'>
            <h1 className='dashboard-header'> Student Internship Dashboard </h1>
            <div className='dashboard-card'>
                <h2>  Submit Weekly Internship Log</h2> 
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text"
                        name="week" 
                        placeholder="Week Number"
                        value={FormData.week}
                        onChange={handleChange}
                        className='dashboard-input'
                        required
                    />       

                    <textarea 
                        name="tasks" 
                        placeholder="Tasks Completed"
                        value={FormData.tasks}
                        onChange={handleChange}
                        className='dashboard-textarea'
                        required
                    />

                    <textarea 
                        name="skills"
                        placeholder="Skills Learned"
                        value={FormData.skills}
                        onChange={handleChange}
                        className='dashboard-textarea'
                    /> 

                    <input 
                        type="number"
                        name="hours"
                        placeholder="Hours Worked"
                        value={FormData.hours}
                        className='dashboard-input'
                        required
                    />  
                    <button type="submit" className='dashboard-button'>Submit Log</button>            

                </form>
            </div>
            <div className='logs-section'>
                <h2> Submitted Logs</h2>
                {logs.length === 0 ? (
                    <p> No Logs Submiited yet.</p>
                ) : ( 
                    logs.map((log) => (
                        <div key={log.id} className='log-card'>
                            <h3>Week {log.week}</h3>
                            <p><strong>Tasks:</strong>{log.tasks}</p>
                            <p><strong>Skills:</strong>{log.skills}</p>
                            <p><strong>Hours:</strong>{log.hours}</p>
                            <p>
                                <strong>Status:</strong>{" "}
                                <span className='pending-status'>{log.status}</span>
                            </p>

                        </div>
                    ))

                )}
            </div>
        </div>
    );
}
export default studentDashboard
  

