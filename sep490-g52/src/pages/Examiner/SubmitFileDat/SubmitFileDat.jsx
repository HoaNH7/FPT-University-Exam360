import {BACKEND_URL} from '../../../constant';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import React, { Fragment, useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import './SubmitFileDat.scss';
import { useAuthFetch } from '../../../auth';

const SubmitFileDat = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [subjectId, setSubjectId] = useState(''); // Replace with actual subject ID
    const [scheduleId, setScheduleId] = useState(''); // Replace with actual schedule ID
    const authfetch = useAuthFetch();
    const [subjects, setSubjects] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        // Fetch subjects and schedules when the component mounts
        const fetchSubjectAndSchedules = async () => {
            try {
                const response = await authfetch(BACKEND_URL + '/api/FileUpload/GetSubjectsOfTheStudentTested');
                if (response.ok) {
                    const data = await response.json();
                    setSubjects(data);
                } else {
                    toast.error("Failed to fetch subject");
                }
            } catch (error) {
                toast.error("An Error occurred while fetching subjects.");
            }
        };

       

        fetchSubjectAndSchedules();
        fetchSubmissions();
    }, [authfetch]);
 // Fetch submissions for the logged-in student
 const fetchSubmissions = async () => {
    try {
        const response = await authfetch(BACKEND_URL + '/api/FileUpload/GetAllSubmissionByStudentId');
        if (response.ok) {
            const data = await response.json();
            setSubmissions(data);
        } else {
            toast.error("Failed to fetch submissions");
        }
    } catch (error) {
        toast.error("An error occurred while fetching submissions.");
    }
};
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedFile) {
            toast.error("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('subjectId', subjectId);
        formData.append('scheduleId', scheduleId);

        try {
            const response = await authfetch(BACKEND_URL + '/api/FileUpload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                toast.success("File uploaded successfully.");
                setSubmissions([...submissions, data]); // Update the submissions list with the new submission
                fetchSubmissions();
            } else {
                toast.error("Failed to upload file.");
            }
        } catch (error) {
            toast.error("An error occurred during file upload.");
        }
        
    };

    const handleSubjectChange = (event) => {
        const selectedSubjectId = event.target.value;
        const filteredSchedules = subjects
            .filter(subject => subject.subjectId == selectedSubjectId)
            .map(subject => ({
                ScheduleId: subject.scheduleId,
                Date: subject.date,
                Slot: subject.slot
            }));

        setSchedules(filteredSchedules);
        if (filteredSchedules.length === 1) {
            setScheduleId(filteredSchedules[0].ScheduleId);
        } else {
            setScheduleId('');
        }
        setSubjectId(selectedSubjectId);
    };

    const uniqueSubjects = Array.from(new Set(subjects.map(subject => subject.subjectId)))
        .map(subjectId => subjects.find(subject => subject.subjectId === subjectId));

    const handleScheduleChange = (event) => {
        setScheduleId(event.target.value);
    };

    return (
        <Fragment>
            <div className="container">
                <ToastContainer />
                <div className="add-campus-header my-3">
                    <h1>Submit File Dat</h1>
                </div>
                <form className="form-adduser" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="subjectId" className="col-form-label">
                            Subject Name
                        </label>
                        <select
                            className="form-control w-50"
                            id={subjectId}
                            value={subjectId}
                            onChange={handleSubjectChange}
                        >
                            <option>Select Subject</option>
                            {uniqueSubjects.map(subject => (
                                <option key={subject.subjectId} value={subject.subjectId}>
                                    {subject.subjectCode}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="scheduleId" className="col-form-label">
                            Date
                        </label>
                        <select
                            className="form-control w-50"
                            id={scheduleId}
                            value={scheduleId}
                            onChange={handleScheduleChange}
                            disabled={schedules.length <= 1}
                        >
                            <option>Select Date And Slot</option>
                            {schedules.map(schedule => (
                                <option key={schedule.ScheduleId} value={schedule.ScheduleId}>
                                    {schedule.Date} Slot {schedule.Slot}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="fileUpload" className="col-form-label">
                            Upload File:
                        </label>
                        <input type="file" className="form-control-file" id="fileUpload" onChange={handleFileChange} />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Submit
                    </button>
                </form>
                <Link to="/student">Back to List</Link>

                {/* Submissions Table */}
                <div className="table-responsive mt-4">
                    <h2>My Submissions</h2>
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Subject Code</th>
                                <th>Upload Date</th>
                                <th>File</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((submission, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{submission.date}</td>
                                    <td>{submission.slot}</td>
                                    <td>{submission.subjectCode}</td>
                                    <td>{submission.uploadDate}</td>
                                    <td>
                                        <a href={submission.file} download>
                                            Download
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Fragment>
    );
};

export default SubmitFileDat;
