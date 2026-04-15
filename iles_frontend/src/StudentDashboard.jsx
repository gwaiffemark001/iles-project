import React, {useState, useFetch} from 'react';
import './WeeklyLogDashboard.css';

export default function WeeklyLogDashboard(){
    const [logs, setLogs] = useState([]);
    const [FormData, setFormData] = useState({
        placement: "",
        week_number: "",
        activities: "",
        challenges: "",
        learning: "",
        deadline: "",
    }); 

    useEffect(() => { 
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try{
            const response = await fetch("http://127.0.0.1:8000/api/weekly-logs/");
            const data = await response.json();
            setLogs(data);
        }
        catch(error){
            console.error("Error fetching logs: ", error);
        }
    };

    const handleChange = (e) => {
        setFormData({...FormData, 
                    [e.target.name] : e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try{
            const response = await fetch("http://127.0.0.1:8000/api/weekly-logs/", 
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    }, 
                    body: JSON.stringify({
                        ...FormData, 
                        status: "submiited",
                    }),
                }
                
            );

            const newLog = await response.json();
            setLogs([newLog, ...logs]);

            setFormData({
                placement: "",
                week_number: "",
                activities: "",
                challenges: "",
                learning: "",
                deadline: "",
            });
            
            
        } catch(error){
            console.error("Error submitting log:", error);
        }
        
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
  

