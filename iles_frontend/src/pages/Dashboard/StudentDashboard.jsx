import React, {useState, useEffect} from 'react';
import './StudentDashboard.css';

export default function StudentDashboard(){
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
                        status: "submitted",
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
        <div className='dashboard'>
            <aside className='sidebar'>
                <h2 className='logo'> ILES </h2>
                <p className='role'>Student </p>
                 
                <nav>
                    <ul>
                        <li className='active'>Dashboard</li>
                        <li>My Logs</li>
                        <li>Submit</li>
                        <li>Profile</li>
                    </ul>
                </nav>
                <div className='logout'>Logout</div>
            </aside>
            <main className='main'>
                <header className='topbar'>
                    <h2>Welcome Back, Student</h2>
                    <div className='avatar'>ST</div>
                </header>
            

                <section className='stats'>
                    <div className='card'>
                        <h4>Total Logs</h4>
                        <p>{logs.length}</p>
                    </div>
                    <div className='card'>
                        <h4>Submitted</h4>
                        <p>{logs.filter(log => log.status === "submitted").length}</p>
                    </div>
                    <div className='card'>
                        <h4>Reviewed</h4>
                        <p>{logs.filter(log => log.supervisor_comment).length}</p>
                    </div>
                </section> 
                <section className='grid'>
                    <div className='form-card'>
                        <h3>Submit Weekly Log</h3>
                        <form onSubmit={handleSubmit} className='log-form'>
                            <input 
                                type="number"
                                name="placement" 
                                placeholder="Placement ID"
                                value={FormData.placement}
                                onChange={handleChange}
                                required
                            /> 
                        
                             

                            <input 
                                type="number" 
                                name="week_number"
                                placeholder="Week Number"
                                value={FormData.week_number}
                                onChange={handleChange}
                                required
                            />
                        
                    

                            <textarea 
                                name="activities"
                                placeholder="Activities Done"
                                value={FormData.activities}
                                onChange={handleChange}
                                required
                            /> 

                            <textarea
                                name="challenges"
                                placeholder="Challenges Faced"
                                value={FormData.challenges}
                                onChange={handleChange}
                                required 
                            /> 
                    
                            <textarea
                                name="learning"
                                placeholder="What did you learn?"
                                value={FormData.learning}
                                onChange={handleChange}
                        
                            /> 
                     
                            <input
                                type="date"
                                name="deadline"
                                value={FormData.deadline}
                                onChange={handleChange}
                            />     
                    
                            <button type="submit" className='dashboard-button'>Submit Weekly Log</button>    
                        
                        </form>
                    </div>
            
                    <div className='logs-card'>
                        <h2> Submitted Logs</h2>
                        {logs.length === 0? (
                            <p>No logs submitted yet.</p>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className='log-card'>
                                    <h3>Week {log.week_number}</h3>
                                    <p><strong>Activities:</strong>{log.activities}</p>
                                    <p><strong>Challenges:</strong>{log.challenges}</p>
                                    <p><strong>Learning:</strong>{log.learning}</p>
                                    <p><strong>Status:</strong>{log.status}</p>
                                    
                                </div>
                            ))
                        )}
                    
                     

                    </div>
                </section>
            
            </main>
        </div>
           
              
    );
}              
  

