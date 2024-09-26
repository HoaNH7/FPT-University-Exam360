import {BACKEND_URL} from '../../../constant';
import './MakeRecordsViolations.scss';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import { useAuthFetch, useCurrentUserInfo } from '../../../auth';
import moment from 'moment';

const MakeRecordsViolations = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchPerformed, setSearchPerformed] = useState(false);
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const formatEndTime = moment(query.get('endTime')).format('HH:mm');
    const room = query.get('roomName');
    const user = useCurrentUserInfo();
    const authfetch = useAuthFetch();
    const [requests, setRequests] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        authfetch(
            BACKEND_URL + `/api/Violation/GetAllStudentViolationByProctorId/${user.userId}?startTime=${startTime}&endTime=${endTime}&room=${room}`,
        )
            .then((res) => res.json())
            .then((result) => {
                setData(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleSearch = () => {
        if (searchInput.trim() === '') {
            setFilteredData(data);
            return;
        }

        const searchResult = data.filter((item) => item.rollNo.toLowerCase().includes(searchInput.toLowerCase()));
        setFilteredData(searchResult);
        setSearchPerformed(true);
        setRequests({});
    };

    const handleRequestChange = (index, value) => {
        setRequests((prev) => ({
            ...prev,
            [filteredData[index].rollNo]: {
                ...prev[filteredData[index].rollNo],
                violationTitle: value,
            },
        }));
    };

    const handleNoteChange = (index, note) => {
        setRequests((prev) => ({
            ...prev,
            [filteredData[index].rollNo]: {
                ...prev[filteredData[index].rollNo],
                note: note,
            },
        }));
    };

    const handleSendRow = async (index, studentIdNumber) => {
        const request = {
            studentIdNumber: studentIdNumber,
            proctorId: user.userId,
            violationTitle: requests[studentIdNumber]?.violationTitle || '',
            roomName: room,
            startTime: startTime,
            endTime: endTime,
            note: requests[studentIdNumber]?.note || 'none',
        };

        if (!request.violationTitle || request.violationTitle === '0') {
            toast.error('Please select a violation title to send.');
            return;
        }

        console.log('Request to send:', request);

        try {
            const response = await authfetch(BACKEND_URL + '/api/Violation/AddViolations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([request]), // Wrap request in an array to match expected payload format
            });

            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.indexOf('application/json') !== -1) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                toast.error('Failed to add request');
            } else {
                toast.success('Violation added successfully');
                // setRequests({});
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`An error occurred while adding request: ${error.message}`);
        }
    };

    const handleRefreshButtonClick = () => {
        window.location.reload();
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-makerecord">
                <div className="makerecord-management-header">
                    <Link
                        className="makerecord-management-link"
                        to={`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                    >
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Send Violation Record</span>{' '}
                </div>
                <h2 className="schedulemanage-management-title">
                    You are in the exam room: {room} Slot: {startTime}-{formatEndTime}{' '}
                </h2>
                <div className="body-container-makerecord">
                    <span style={{ marginRight: 10 }}>Roll No: </span>
                    <input
                        style={{ width: 250 }}
                        type="text"
                        placeholder="Search by Roll No"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        Search
                    </button>
                    {/* <button
                        className="btn btn-primary"
                        onClick={handleRefreshButtonClick}
                        style={{ marginLeft: '10px' }}
                    >
                        Refresh
                    </button> */}
                </div>
                {filteredData.length > 0 && (
                    <table className="makerecord-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Roll No</th>
                                <th>Full Name</th>
                                <th>Subject</th>
                                {/* <th>Room</th> */}
                                <th>Violation Content</th>
                                <th>Note</th>
                                <th>Send</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) => (
                                <tr key={index}>
                                    <td data-title="No :">{index + 1}</td>
                                    <td data-title="Roll No :">{item.rollNo}</td>
                                    <td data-title="Full Name :">{item.fullName}</td>
                                    <td data-title="Subject Code :">{item.subject}</td>
                                    {/* <td data-title="Room Name">{item.room}</td> */}

                                    <td data-title="Violation Type :">
                                        <Form.Select
                                            style={{ width: '80%' }}
                                            aria-label="Default select example"
                                            onChange={(e) => handleRequestChange(index, e.target.value)}
                                            value={requests[item.rollNo]?.violationTitle || '0'}
                                        >
                                            <option value="0">None</option>
                                            <option value="Use smart phone">Use smart phone</option>
                                            <option value="Have a phone on you">Have a phone on you</option>
                                            <option value="Use smart watch">Use smart watch</option>
                                            <option value="Use document">Use document</option>
                                            <option value="Help take the exam">Help take the exam</option>
                                            <option value="Use handheld assistive devices">
                                                Use handheld assistive devices
                                            </option>
                                            <option value="Exchange laptops with other students">
                                                Exchange laptops with other students
                                            </option>
                                            <option value="Laptop running unauthorized software/applications">
                                                Laptop running unauthorized software/applications
                                            </option>
                                            <option value="Use the phone in the exam room">
                                                Use the phone in the exam room
                                            </option>
                                            <option value="Other">Other</option>
                                        </Form.Select>
                                    </td>
                                    <td data-title="Note :">
                                        <textarea
                                            cols={3}
                                            rows={3}
                                            type="text"
                                            style={{ width: 150 }}
                                            onChange={(e) => handleNoteChange(index, e.target.value)}
                                            value={requests[item.rollNo]?.note || ''}
                                        />
                                    </td>
                                    <th>
                                        <div className="body-container-makerecord">
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleSendRow(index, item.rollNo)}
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </th>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Fragment>
    );
};

export default MakeRecordsViolations;
