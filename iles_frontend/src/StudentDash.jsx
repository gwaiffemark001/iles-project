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


}
export default InternshipDashboard 