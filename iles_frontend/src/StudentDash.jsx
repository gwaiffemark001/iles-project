import React, {useState} from 'react';

function InternshipDashboard(){
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
        <div sytle={styles.container}>
            <h1 style={styles.header}> Student Internship Dashboard </h1>
            <div style={styles.card}>
                <h2>  Submit Weekly Internship Log</h2> 
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text"
                        name="week" 
                        placeholder="Week Number"
                        value={FormData.week}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />       

                    <textarea 
                        name="tasks" 
                        placeholder="Tasks Completed"
                        value={formData.tasks}
                        onChange={handleChange}
                        style={styles.textarea}
                        required
                    />

                    <textarea 
                        name="skills"
                        placeholder="Skills Learned"
                        value={FormData.skills}
                        onChange={handleChange}
                        style={styles.textarea} 
                        /> 

                    <input 
                        type="number"
                        name="hours"
                        placeholder="Hours Worked"
                        value={FormData.hours}
                        style={styles.input}
                        required
                    />  
                    <button type="submit" style={styles.button}>Submit Log</button>            

                </form>
            </div>
            <div style={styles.logsSection}>
                <h2> Submitted Logs</h2>
                {logs.length === 0 ? (
                    <p> No Logs Submiited yet.</p>
                ) : ( 
                    logs.map((log) => (
                        <div key={log.id} style={styles.logCard}>
                            <h3>Week {log.week}</h3>
                            <p><strong>Tasks:</strong>{log.tasks}</p>
                            <p><strong>Skills:</strong>{log.skills}</p>
                            <p><strong>Hours:</strong>{log.hours}</p>
                            <p>
                                <strong>Status:</strong>{" "}
                                <span style={{color: "orange"}}>{log.status}</span>
                            </p>

                        </div>
                    ))

                )}
            </div>
        </div>
    );

  


}
export default InternshipDashboard 