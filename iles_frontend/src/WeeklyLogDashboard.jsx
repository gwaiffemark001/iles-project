import React, {useState, useEffect} from 'react';
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
            <h1 className='dashboard-header'> Weekly Internship Log </h1>
            
                <h1>  Submit Weekly Internship Log</h1> 
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
                        name=""
                        placeholder="What did you learning?"
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


           
                <div className='logs-list'>
                    <h2> Submitted Logs</h2>
                    
                    {logs.map((log) => (
                        <div key={log.id} className='log-card'>
                            <h3>Week {log.week_number}</h3>
                            <p><strong>Activities: </strong>{log.activities}</p>
                            <p><strong>Challenges: </strong>{log.challlenges}</p>
                            <p><strong>Learning: </strong>{log.learning}</p>
                            <p><strong>Status: </strong>{log.status}</p>
                            <p><strong>Supervisor Comment: </strong>{log.supervisor_comment || "No comment yet"}</p>

                        </div>
                    ))}

                 </div>
        </div>      
    );
}              
  

