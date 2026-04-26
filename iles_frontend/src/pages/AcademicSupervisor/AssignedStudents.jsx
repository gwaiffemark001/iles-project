import Layout from "../../components/Layout";
import "./AssignedStudents.cc";

const AssignedStudents = () => {
  return (
    <Layout role="Academic Supervisor" userName="Dr. Susan">

        {/*Top Bar */}
        <div className="topbar">
            <div>
                <h1>Assigned Students</h1>
                <p>Manage and evaluate your assigned students</p>
            </div>
            <div className="avatar">DS</div>
        </div>

    </Layout>
);
};
export default AssignedStudents;