import {BACKEND_URL} from '../../../constant';
import React, { useEffect, useState } from 'react';
import { useAuthFetch } from '../../../auth';
import ListStudentInfo from './ListStudentInfoPopUp'; // Ensure correct path to ListStudentInfo component
import { Link } from 'react-router-dom';
import { Button, Form } from 'react-bootstrap';
import './GetExamSchedule.scss';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';

const GetExamSchedule = () => {
    const getCurrentDate = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadingStudent, setLoadingStudent] = useState(false);
    const [errorStudent, setErrorStudent] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [date, setDate] = useState(getCurrentDate());
    const [campusCode, setCampusCode] = useState('APHL');
    const [successMessage, setSuccessMessage] = useState('');
    const [successStudentMessage, setSuccessStudentMessage] = useState('');

    const authfetch = useAuthFetch();

    useEffect(() => {
        getData(date, campusCode);
        getData2(campusCode);
    }, []);
    const getData2 = (campusCode) => {
        const url = BACKEND_URL + `/api/Exam/get-all-students-fee?campusCode=${campusCode}`;
    
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };
    
        authfetch(url, requestOptions)
            .then((res) => res.json())
            // .then((data) => setData(data.data))
            .catch((error) => console.error('Error:', error));
    };

    const getData = (startDate, campusCode) => {
        const url = BACKEND_URL + `/api/Exam/get-exam?campusCode=${campusCode}&startDate=${startDate}&endDate=${startDate}`;

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };

        authfetch(url, requestOptions)
            .then((res) => res.json())
            .then((data) => setData(data.data))
            .catch((error) => console.error('Error:', error));
    };

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
    };

    const handleFilter = () => {
        getData(date, campusCode);
    };
    const pushStudent = async () => {
        setLoading(true);
        setErrorStudent(null);
        try{
            const url = BACKEND_URL + `/api/Exam/get-all-students-fee?campusCode=${campusCode}`;
            const requestOptions = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            };
            const response = await authfetch(url,requestOptions);
            const studentsFromFap = await response.json();

            function splitArray(originalArr, chunkSize) {
                const newArr = [];
                for (let i = 0; i < originalArr.length / chunkSize; i++) {
                    const newObj = {};
                    newObj.data = originalArr.slice(i * chunkSize, (i + 1) * chunkSize);
                    newObj.startIndex = i * chunkSize + 1;
                    newObj.endIndex =
                        (i + 1) * chunkSize < originalArr.length ? (i + 1) * chunkSize : originalArr.length;
                    newArr.push(newObj);
                }

                return newArr;
            }
            
            const splited = splitArray(studentsFromFap.data, 500);
            console.log('this is splited', splited);
            for (const chunk of splited) 
                {
                     const responsePost = await authfetch(
                    BACKEND_URL + '/ExaminerHead/ExamScheduleFromFAP/AddStudentsFromFAP',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(chunk.data),
                        },
                    );
                    if (responsePost.ok) {
                        toast.success(`Students ${chunk.startIndex} - ${chunk.endIndex}  pushed successfully! .`);
                        const currentTime = new Date().toLocaleTimeString();
                        setSuccessStudentMessage(
                            `Students ${chunk.startIndex} - ${chunk.endIndex} pushed to database at ${currentTime}`,
                        );
                    } else {
                        const errorMessage = responsePost.text();
                        setError(errorMessage);
                    }
                }

        } 
         catch (error) {
            console.error('Error pushing students :', error);
            setErrorStudent('Error pushing students!');
            } finally {
                setLoading(false);
            }
    };

    const pushSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = BACKEND_URL + `/api/Exam/get-exam?campusCode=${campusCode}&startDate=${date}&endDate=${date}`;

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            };

            const response = await authfetch(url, requestOptions);
            const ExamScheduleFromFPT = await response.json();
            toast.success(`Fetched from FPT ${ExamScheduleFromFPT.data.length} schedules of date : ${date}.`);
            // alert(`Fetched from FPT ${ExamScheduleFromFPT.data.length} schedules`);
            console.log('this is ExamScheduleFromFPT', ExamScheduleFromFPT);
            function splitArray(originalArr, chunkSize) {
                const newArr = [];
                for (let i = 0; i < originalArr.length / chunkSize; i++) {
                    const newObj = {};
                    newObj.data = originalArr.slice(i * chunkSize, (i + 1) * chunkSize);
                    newObj.startIndex = i * chunkSize + 1;
                    newObj.endIndex =
                        (i + 1) * chunkSize < originalArr.length ? (i + 1) * chunkSize : originalArr.length;
                    newArr.push(newObj);
                }

                return newArr;
            }
            const splited = splitArray(ExamScheduleFromFPT.data, 100);
            console.log('this is splited', splited);
            for (const chunk of splited) {
                const responsePost = await authfetch(
                    BACKEND_URL + '/ExaminerHead/ExamScheduleFromFAP/AddExamSchedulesFromFAP',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(chunk.data),
                    },
                );
                if (responsePost.ok) {
                    // alert(
                    //     `Schedule ${chunk.startIndex} - ${chunk.endIndex} pushed successfully! Click Ok to continue.`,
                    // );
                    toast.success(`Schedule ${chunk.startIndex} - ${chunk.endIndex} of date : ${date} pushed successfully! .`);
                    const currentTime = new Date().toLocaleTimeString();
                    setSuccessMessage(
                        `Schedule ${chunk.startIndex} - ${chunk.endIndex} of date : ${date} pushed to database at ${currentTime}`,
                    );
                } else {
                    const errorMessage = responsePost.text();
                    setError(errorMessage);
                }
            }
            console.log('this is data mock', ExamScheduleFromFPT);
        } catch (error) {
            console.error('Error pushing schedule :', error);
            setError('Error pushing schedule!');
        } finally {
            setLoading(false);
        }
    };
    const formatDate = (dateTimeString) => {
        const [datePart] = dateTimeString.split(' ');
        return datePart;
    };
    const formatTime = (startTime, endTime) => {
        const getTime = (dateTimeString) => dateTimeString.split(' ')[1];
        const start = getTime(startTime);
        const end = getTime(endTime);
        return `${start}-${end}`;
    };

    return (
        <div className="main-container-getexamschedule">
            <ToastContainer />
            <div className="getexamschedule-management-header">
                <Link className="getexamschedule-management-link" to="/examinerhead">
                    Home
                </Link>
                {' > '}
                <span style={{ fontSize: 14 }}> Get Exam Schedule By FAP</span>{' '}
            </div>
            <div className="filter-container">
                <Form.Group controlId="formDate">
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Form.Group>
                <Form.Group controlId="formCampusCode">
                    <Form.Label>Campus Code</Form.Label>
                    <Form.Control type="text" value={campusCode} onChange={(e) => setCampusCode(e.target.value)} />
                </Form.Group>
                <Button onClick={handleFilter} disabled={loading}>
                    {loading ? 'Filtering...' : 'Filter Data'}
                </Button>
            </div>
            <div className="PushSchedulebtn">
                <Button onClick={pushSchedule} disabled={loading}>
                    {loading ? 'Pushing...' : 'Get Schedule In System'}
                </Button>
                {successMessage && <div className="success">{successMessage}</div>}
                {error && <div className="error">{error}</div>}
            </div>
            <div className="PushStudentbtn">
                <Button onClick={pushStudent} disabled={loading}>
                    {loading ? 'Pushing...' : 'Get Students In System'}
                </Button>
                {successStudentMessage && <div className="success">{successStudentMessage}</div>}
                {errorStudent && <div className="error">{errorStudent}</div>}
            </div>
            <div className="body-container-getexamschedule">
                <table className="getexamschedule-table table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Room No</th>
                            <th>Proctor Name</th>
                            <th>Semester</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.length > 0 ? (
                            (() => {
                                let counter = 1;
                                return data.flatMap((schedule) =>
                                    schedule.examRooms.map((room) => (
                                        <tr key={`${schedule.scheduleId}-${room.examRoomId}`}>
                                            <td data-title="No">{counter++}</td>
                                            <td data-title="Date">{formatDate(schedule.startTime)}</td>
                                            <td data-title="Time">
                                                {formatTime(schedule.startTime, schedule.endTime)}
                                            </td>
                                            <td
                                                data-title="Room No"
                                                onClick={() => handleRoomClick(room)}
                                                style={{ cursor: 'pointer', color: '#1A6BED' }}
                                            >
                                                {room.examRoomId}
                                            </td>
                                            <td></td>
                                            <td data-title="Semester">{schedule.semester}</td>
                                        </tr>
                                    )),
                                );
                            })()
                        ) : (
                            <tr>
                                <td colSpan="6">No Data...</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div>{selectedRoom && <ListStudentInfo room={selectedRoom} onClose={() => setSelectedRoom(null)} />}</div>
        </div>
    );
};

export default GetExamSchedule;
