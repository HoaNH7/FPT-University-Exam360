import {BACKEND_URL} from '../../../constant';
import './SendRequest.scss';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import { useAuthFetch } from '../../../auth';
import moment from 'moment';
import { useCurrentUserInfo } from '../../../auth';
import StudentRequestDetailsModal from './StudentRequestDetailsModal';

const SendRequest = () => {
    const [data, setData] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const authfetch = useAuthFetch();
    const user = useCurrentUserInfo();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const formatEndTime = moment(query.get('endTime')).format('HH:mm');
    const room = query.get('roomName');
    const [requests, setRequests] = useState({});
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [modalShow, setModalShow] = useState(false);
    const [modalData, setModalData] = useState({
        rollNo: '',
        startTime: '',
        endTime: '',
        room: '',
        requests: [],
    });

    useEffect(() => {
        getData();
    }, []);

    const getData = () => {
        authfetch(
            BACKEND_URL + `/api/Request/GetAllStudentByProctorId/${user.userId}?startTime=${startTime}&endTime=${endTime}&room=${room}`,
        )
            .then((res) => res.json())
            .then((result) => {
                setData(result);
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
    };

    const handleRequestChange = (index, value) => {
        setRequests((prev) => {
            const prevRequests = prev[index]?.requests || [];
            const newRequests = prevRequests.includes(value)
                ? prevRequests.filter((v) => v !== value)
                : [...prevRequests, value];
            return {
                ...prev,
                [index]: {
                    ...prev[index],
                    requests: newRequests,
                },
            };
        });
    };

    const handleNoteChange = (index, note) => {
        setRequests((prev) => ({
            ...prev,
            [index]: {
                ...prev[index],
                note: note,
            },
        }));
    };

    const handleSaveRow = async (studentIdNumber, index) => {
        const selectedRequests = requests[index]?.requests;
        const note = requests[index]?.note || '';

        if (selectedRequests && selectedRequests.length > 0) {
            const requiredNoteRequests = ['The question is problem', 'Other', 'Special Request'];
            const needsNote = selectedRequests.some((request) => requiredNoteRequests.includes(request));

            if (needsNote && note.trim() === '') {
                toast.error('Please provide a note for the selected The question is problem, Other, Special, Request.');
                return;
            }

            const requestsToSend = selectedRequests.map((requestTitle) => ({
                studentIdNumber: studentIdNumber,
                proctorId: user.userId,
                roomName: room,
                startTime: startTime,
                endTime: endTime,
                requestTitle: requestTitle,
                note: note,
            }));

            console.log(requestsToSend);

            try {
                const response = await authfetch(BACKEND_URL + '/api/Request/AddRequests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestsToSend),
                });

                const contentType = response.headers.get('content-type');
                let responseData;

                if (contentType && contentType.indexOf('application/json') !== -1) {
                    responseData = await response.json();
                } else {
                    responseData = await response.text();
                }

                if (responseData.success) {
                    toast.error('Failed to add request');
                } else {
                    toast.success('Request added successfully');
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error(`An error occurred while adding request: ${error.message}`);
            }
        } else {
            toast.error('Please select at least one request to save.');
        }
    };

    const fetchRequestData = async (rollNo) => {
        try {
            const response = await authfetch(
                BACKEND_URL + `/api/Request/ViewAllRequestByStudentIdNumber?studentIdNumber=${rollNo}&startTime=${startTime}&endTime=${endTime}&roomName=${room}`,
            );
            const data = await response.json();
            // Ensure requests is always an array
            setModalData((prevData) => ({
                ...prevData,
                requests: Array.isArray(data.requests) ? data.requests : [],
            }));
        } catch (error) {
            console.error('Error fetching requests:', error);
            // Ensure requests is always an array
            setModalData((prevData) => ({
                ...prevData,
                requests: [],
            }));
        }
    };

    const handleRollNoClick = (rollNo) => {
        fetchRequestData(rollNo);
        setModalData({
            rollNo,
            startTime,
            endTime,
            room,
            requests: [],
        });
        setModalShow(true);
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-sendrequest">
                <div className="sendrequest-management-header">
                    <Link
                        className="sendrequest-management-link"
                        to={`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                    >
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}>Send Request</span>{' '}
                </div>
                <h2 className="schedulemanage-management-title">
                    You are in the exam room: {room} Slot: {startTime}-{formatEndTime}{' '}
                </h2>
                <div className="body-container-sendrequest">
                    <span style={{ marginRight: 5 }}>Roll No: </span>
                    <input
                        style={{ width: 250 }}
                        type="text"
                        placeholder="Search By Roll No"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        Search
                    </button>
                </div>
                <Link
                    className="sendrequest-management-link"
                    to={`/viewrequest?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                >
                    View Request
                </Link>
                {filteredData.length > 0 && (
                    <div>
                        <table className="sendrequest-table table-striped">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Roll No.</th>
                                    <th>Full Name</th>
                                    <th>Subject</th>
                                    <th>Title</th>
                                    {/* <th>Room</th> */}
                                    <th>Request</th>
                                    <th>Note</th>
                                    <th>Send</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item, index) => (
                                    <tr key={index}>
                                        <td data-title="No :">{index + 1}</td>
                                        <td data-title="Roll No :">
                                            <a href="#" onClick={() => handleRollNoClick(item.rollNo)}>
                                                {item.rollNo}
                                            </a>
                                        </td>
                                        <td data-title="Full Name :">{item.fullName}</td>
                                        <td data-title="Subject Code :">{item.subject}</td>
                                        <td data-title="Title :">{item.title}</td>
                                        <td data-title="Request :" className="d-flex flex-column">
                                            {[
                                                'Reset Password',
                                                'Reassign',
                                                'Check Submit',
                                                'The question is problem',
                                                'Special Request',
                                                //   'Other',
                                            ].map((requestType) => (
                                                <Form.Check
                                                    key={requestType}
                                                    type="checkbox"
                                                    label={requestType}
                                                    checked={(requests[index]?.requests || []).includes(requestType)}
                                                    onChange={() => handleRequestChange(index, requestType)}
                                                />
                                            ))}
                                        </td>
                                        <td data-title="Note :">
                                            <textarea
                                                cols={3}
                                                rows={3}
                                                type="text"
                                                style={{ width: 150 }}
                                                value={requests[index]?.note || ''}
                                                onChange={(e) => handleNoteChange(index, e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <div className="body-container-sendrequest">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleSaveRow(item.rollNo, index)}
                                                >
                                                    Send
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <StudentRequestDetailsModal
                    show={modalShow}
                    onHide={() => setModalShow(false)}
                    rollNo={modalData.rollNo}
                    startTime={modalData.startTime}
                    endTime={modalData.endTime}
                    room={modalData.room}
                    requests={modalData.requests}
                />
            </div>
        </Fragment>
    );
};

export default SendRequest;
