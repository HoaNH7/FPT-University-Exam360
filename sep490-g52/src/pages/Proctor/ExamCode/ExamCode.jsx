import { BACKEND_URL } from '../../../constant';
import './ExamCode.scss';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useCurrentUserInfo } from '../../../auth';
import { useAuthFetch } from '../../../auth';
import moment from 'moment';
import Form from 'react-bootstrap/Form';

const ExamCode = () => {
    const [dataExamCode, setDataExamCode] = useState([]);
    const [showExamCode, setShowExamCode] = useState(false);
    const navigate = useNavigate();
    const user = useCurrentUserInfo();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const formatEndTime = moment(endTime).format('HH:mm');
    const room = query.get('roomName');
    const authfetch = useAuthFetch();
    const [subject, setSubject] = useState(new Set());
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;
    const [subjectColors, setSubjectColors] = useState({});
    const [filteredData, setFilteredData] = useState([]);
    const [filterSubjectCode, setFilterSubjectCode] = useState('');

    useEffect(() => {
        // const currentTime = moment();
        // const start = moment(startTime, 'YYYY-MM-DD HH:mm');
        // const end = moment(endTime, 'YYYY-MM-DD HH:mm');

        // console.log('Current Time:', currentTime);
        // console.log('Start Time:', start.format('YYYY-MM-DD HH:mm'));
        // console.log('End Time:', end.format('YYYY-MM-DD HH:mm'));

        // if (currentTime.isBetween(start, end, null, '[]')) {
        // setShowExamCode(true);
        getDataExamCode();
        fetchData();
        // } else {
        // setShowExamCode(false);
        // }
    }, []);

    useEffect(() => {
        if (subject.size > 0) {
            getDataExamCode();
        }
    }, [subject]);

    useEffect(() => {
        fetchData();
    }, [pageNumber]);

    useEffect(() => {
        filterData();
    }, [filterSubjectCode]);

    const getDataExamCode = () => {
        const subjectCodes = Array.from(subject).join(',');
        console.log(subjectCodes);
        authfetch(
            BACKEND_URL +
                `/api/ReceiveExamCode/GetExamCodeByProctorId/${user.userId}?startTime=${startTime}&endTime=${endTime}&subjectCodes=${subjectCodes}`,
        )
            .then((response) => response.json())
            .then((result) => {
                const updatedData = countSubjectCodes(result);
                const sortedData = updatedData.sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
                setDataExamCode(sortedData);
                generateSubjectColors(sortedData);
                setFilteredData(sortedData);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const generateSubjectColors = (data) => {
        const colors = {};
        const uniqueSubjects = [...new Set(data.map((item) => item.subjectCode))];
        uniqueSubjects.forEach((subject, index) => {
            colors[subject] = `hsl(${(index * 360) / uniqueSubjects.length}, 70%, 80%)`;
        });
        setSubjectColors(colors);
    };

    const countSubjectCodes = (data) => {
        const countMap = data.reduce((acc, item) => {
            acc[item.subjectCode] = (acc[item.subjectCode] || 0) + 1;
            return acc;
        }, {});

        return data.map((item) => ({
            ...item,
            subjectCode: `${item.subjectCode} (Có ${countMap[item.subjectCode]} Exam Code)`,
        }));
    };

    const fetchData = () => {
        authfetch(
            BACKEND_URL +
                `/api/CheckIn/GetAllStudentsToCheckinByProctorId/${user.userId}?startTime=${startTime}&endTime=${endTime}&roomName=${room}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalCount, studentRequests } = result;
                const subjects = new Set(studentRequests.map((item) => item.subjectCode));
                setSubject(subjects);
                setTotalCount(totalCount);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const filterData = () => {
        if (filterSubjectCode) {
            const filtered = dataExamCode.filter((item) => item.subjectCode.includes(filterSubjectCode));
            setFilteredData(filtered);
        } else {
            setFilteredData(dataExamCode);
        }
    };

    const getUniqueSubjectCodes = (data) => {
        const uniqueSubjectCodes = new Set(data.map((item) => item.subjectCode.split(' ')[0]));
        return [...uniqueSubjectCodes];
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-examcode">
                <div className="examcode-management-header">
                    <Link
                        className="examcode-management-link"
                        to={`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                    >
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Exam Code</span>{' '}
                </div>
                <h2 className="schedulemanage-management-title">
                    You are in the exam room: {room} Slot: {startTime}-{formatEndTime}{' '}
                </h2>
                <div className="body-container-examcode">
                    <span style={{ marginRight: 10 }}>Subject Code: </span>
                    <input type="text" placeholder="Search by Subject Code" />
                    <button className="btn btn-primary">Search</button>
                </div>
                <div className="body-container-examcode">
                    <label style={{ marginRight: 10 }}>Filter Subject Code:</label>
                    <Form.Select
                        className="form-select-examcode fs-6"
                        aria-label="Default select example"
                        onChange={(e) => setFilterSubjectCode(e.target.value)}
                        value={filterSubjectCode}
                    >
                        <option value="">All Subject Code</option>
                        {getUniqueSubjectCodes(dataExamCode).map((subjectCode, index) => (
                            <option key={index} value={subjectCode}>
                                {subjectCode}
                            </option>
                        ))}
                    </Form.Select>
                </div>
                {/* {showExamCode && ( */}
                <div>
                    <h1>Exam Code</h1>
                    <table className="examcode-table table-striped">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Subject Code</th>
                                <th>Subject Name</th>
                                <th>Exam Code</th>
                                <th>Open Code</th>
                                <th>Title</th>
                                <th>Section</th>
                                <th>Note</th>
                                {/* <th>Status</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {dataExamCode.length > 0
                                ? dataExamCode.map((item, index) => (
                                      <tr key={index} style={{ backgroundColor: subjectColors[item.subjectCode] }}>
                                          <td data-title="No">{index + 1}</td>
                                          <td data-title="Subject Code :">{item.subjectCode}</td>
                                          <td data-title="Subject Name :">{item.subjectName}</td>
                                          <td data-title="Exam Code :">{item.code}</td>
                                          <td data-title="Open Code :">{item.openCode}</td>
                                          <td data-title="Title :">{item.title}</td>
                                          <td data-title="Section :">{item.section}</td>
                                          <td data-title="Note :">offline docs</td>
                                          {/* <td data-title="Status">da thi</td> */}
                                      </tr>
                                  ))
                                : 'No Data...'}
                        </tbody>
                    </table>
                </div>
                {/* )} */}
            </div>
        </Fragment>
    );
};

export default ExamCode;
