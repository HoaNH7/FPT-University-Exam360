import React, { Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './ExamScheduleManage.scss';
import moment from 'moment';
import { useCurrentUserInfo } from '../../../auth';
import { ToastContainer } from 'react-toastify';

const ExamScheduleManage = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const formatEndTime = moment(query.get('endTime')).format('HH:mm');
    const room = query.get('roomName');
    const user = useCurrentUserInfo();
    const navigate = useNavigate();

    const handleCheckInClick = (startTime, endTime) => (e) => {
        navigate(`/checkin?startTime=${startTime}&endTime=${endTime}&roomName=${room}`);
    };

    const handleExamCodeClick = (startTime, endTime) => (e) => {
        navigate(`/examcode?startTime=${startTime}&endTime=${endTime}&roomName=${room}`);
    };

    const handleSendRequestClick = (startTime, endTime) => (e) => {
        navigate(`/sendrequest?startTime=${startTime}&endTime=${endTime}&roomName=${room}`);
    };

    const handleViewRequestClick = (startTime, endTime) => (e) => {
        navigate(`/viewrequest?startTime=${startTime}&endTime=${endTime}&roomName=${room}`);
    };

    const handleSendViolationClick = (startTime, endTime) => (e) => {
        navigate(`/makeRecordViolation?startTime=${startTime}&endTime=${endTime}&roomName=${room}`);
    };

    const handleViewViolationClick = (startTime, endTime) => (e) => {
        navigate(`/ViewRecordsViolationsProctor?startTime=${startTime}&endTime=${endTime}&roomName=${room}`);
    };

    const handleSendRequestToHallWayProctorClick = (startTime, endTime) => (e) => {
        navigate(`/sendRequestToHallwayProctor?startTime=${startTime}&endTime=${endTime}&roomName=${room}`);
    };

    const handleCheckOutClick = (startTime, endTime) => (e) => {
        navigate(`/checkout?startTime=${startTime}&endTime=${endTime}&roomName=${room}`);
    };

    const handleFileDatClick = (startTime, endTime) => (e) => {
        navigate(`/viewfiledatproctor?startTime=${startTime}&endTime=${endTime}&roomName=${room}`);
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-schedulemanage">
                <div className="schedulemanage-management-header">
                    <Link className="schedulemanage-management-link" to={'/examschedule'}>
                        Home
                    </Link>
                    {' > '}
                    <span>
                        {startTime}-{formatEndTime} {room}
                    </span>
                    <h2 className="schedulemanage-management-title">
                        You are in the exam room: {room} Slot: {startTime}-{formatEndTime}{' '}
                    </h2>
                </div>

                <table className="table-content-schedulemanage">
                    <tbody className="tbody-content-schedulemanage">
                        <tr>
                            <th className="th-content-schedulemanage" scope="row">
                                <button
                                    className="link-content-schedulemanage"
                                    onClick={handleCheckInClick(startTime, endTime)}
                                >
                                    Check In
                                </button>
                            </th>
                        </tr>
                        <tr>
                            <th className="th-content-schedulemanage" scope="row">
                                <button
                                    className="link-content-schedulemanage"
                                    onClick={handleExamCodeClick(startTime, endTime)}
                                >
                                    Exam Code
                                </button>
                            </th>
                        </tr>
                        <tr>
                            <th className="th-content-schedulemanage" scope="row">
                                <button
                                    className="link-content-schedulemanage"
                                    onClick={handleSendRequestClick(startTime, endTime)}
                                >
                                    Send Request
                                </button>
                            </th>
                            <th className="th-content-schedulemanage" scope="row">
                                <button
                                    className="link-content-schedulemanage"
                                    onClick={handleViewRequestClick(startTime, endTime)}
                                >
                                    View Request
                                </button>
                            </th>
                            <th className="th-content-schedulemanage" scope="row">
                                <button
                                    className="link-content-schedulemanage"
                                    onClick={handleSendViolationClick(startTime, endTime)}
                                >
                                    Send Violation Record
                                </button>
                            </th>
                            <th className="th-content-schedulemanage" scope="row">
                                <button
                                    className="link-content-schedulemanage"
                                    onClick={handleViewViolationClick(startTime, endTime)}
                                >
                                    View Violation Record
                                </button>
                            </th>
                            <th className="th-content-schedulemanage" scope="row">
                                <button
                                    className="link-content-schedulemanage"
                                    onClick={handleSendRequestToHallWayProctorClick(startTime, endTime)}
                                >
                                    Send Request To Hallway Proctor
                                </button>
                            </th>
                            <th className="th-content-schedulemanage" scope="row">
                                <button
                                    className="link-content-schedulemanage"
                                    onClick={handleCheckOutClick(startTime, endTime)}
                                >
                                    Check Out
                                </button>
                            </th>
                            <th className="th-content-schedulemanage" scope="row" style={{ marginBottom: '50px' }}>
                                <button
                                    className="link-content-schedulemanage"
                                    onClick={handleFileDatClick(startTime, endTime)}
                                >
                                    View File Dat
                                </button>
                            </th>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Fragment>
    );
};

export default ExamScheduleManage;
