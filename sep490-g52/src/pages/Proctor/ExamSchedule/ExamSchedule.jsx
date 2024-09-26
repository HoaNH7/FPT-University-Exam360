import {BACKEND_URL} from '../../../constant';
/*
1. fix startTime, endTime(không show startTime, endTime nữa)
*/

import './ExamSchedule.scss';
import '../../Examiner-Head/ExamCode/ExamCode.scss';
import moment from 'moment/moment';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useCurrentUserInfo } from '../../../auth';
import { useAuthFetch } from '../../../auth';

const ExamSchedule = () => {
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const [proctorId, setProctorId] = useState('');
    const user = useCurrentUserInfo();
    const authfetch = useAuthFetch();

    useEffect(() => {
        getData();
    }, []);

    const getCurrentSemester = () => {
        const currentDate = new Date();
        const year = currentDate.getFullYear();

        // Define semester date ranges
        const summerStart = new Date(`June 1, ${year}`);
        const summerEnd = new Date(`August 31, ${year}`);
        const fallStart = new Date(`September 1, ${year}`);
        const fallEnd = new Date(`December 31, ${year}`);
        const springStart = new Date(`January 1, ${year + 1}`);
        const springEnd = new Date(`May 1, ${year + 1}`);

        if (currentDate >= summerStart && currentDate <= summerEnd) {
            console.log(`Summer${year}`);
            return `Summer${year}`;
        } else if (currentDate >= fallStart && currentDate <= fallEnd) {
            return `Fall${year}`;
        } else if (currentDate >= springStart && currentDate <= springEnd) {
            return `Spring${year + 1}`;
        }

        return null;
    };

    const getData = () => {
        const semester = getCurrentSemester();
        if (!semester) {
            console.log('Current date does not fall within any predefined semester ranges.');
            return;
        }

        const todayDate = moment().format('YYYY-MM-DD');
        // const todayDate = '2024-08-10';
        // console.log(todayDate);

        authfetch(BACKEND_URL + `/api/GetScheduleOfProctor`)
            .then((response) => response.json())
            .then((data) => {
                const newData = data
                    .map((item) => ({
                        ...item,
                        date: moment(item.startTime).format('YYYY-MM-DD'),
                        startTime: moment(item.startTime).format('HH:mm'),
                        endTime: moment(item.endTime).format('HH:mm'),
                        startTimeClick: moment(item.startTime).format('YYYY-MM-DD HH:mm'),
                        endTimeClick: moment(item.endTime).format('YYYY-MM-DD HH:mm'),
                    }))
                    // .filter((item) => item.date === todayDate);

                const sortedData = newData.sort((a, b) => {
                    if (a.startTime !== b.startTime) {
                        return moment(a.startTime, 'HH:mm').isBefore(moment(b.startTime, 'HH:mm')) ? -1 : 1;
                    } else {
                        return moment(a.endTime, 'HH:mm').isBefore(moment(b.endTime, 'HH:mm')) ? -1 : 1;
                    }
                });

                setData(sortedData);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleRoomClick = (time, startTime, endTime, roomName) => (e) => {
        const currentTime = moment();
        const examTime = moment(time, 'HH:mm');
        const fiveMinutesBefore = examTime.clone().subtract(5, 'minutes');

        // if (currentTime.isBefore(fiveMinutesBefore)) {
        //     e.preventDefault();
        //     toast.error('Its not time yet');
        // } else if (currentTime.isAfter(endTime)) {
        //     e.preventDefault();
        //     toast.error('Over time');
        // } else {
        navigate(`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${roomName}`);
        // }
    };

    const handleRequestClick = (startTime, endTime) => (e) => {
        navigate(`/sendrequest?startTime=${startTime}&endTime=${endTime}`);
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-examschedule">
                <h1 style={{ textAlign: 'center' }}>This is your Exam Schedule</h1>
                <table className="examschedule-table table-striped">
                    <thead>
                        <tr>
                            <th>NO</th>
                            <th>Date</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Room No</th>
                            <th>Proctoring Time</th>
                            <th>Attempt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.length > 0
                            ? data.map((item, index) =>
                                  item.examRooms.map((room, indexRoom) => (
                                      <tr key={index}>
                                          <td data-title="No :">{indexRoom + 1}</td>
                                          <td data-title="Date :">{item.date}</td>
                                          <td data-title="Start Time :">{item.startTime}</td>
                                          <td data-title="End Time :">{item.endTime}</td>
                                          <td data-title="Room No :">
                                              <button
                                                  className="button-examschedule-content"
                                                  onClick={handleRoomClick(
                                                      item.time,
                                                      item.startTimeClick,
                                                      item.endTimeClick,
                                                      room.roomName,
                                                  )}
                                              >
                                                  {room.roomName}
                                              </button>
                                          </td>

                                          <td data-title="Proctoring Time :">{item.timeProctor} minutes</td>
                                          <td data-title="Attempt :">{room.attempt}</td>
                                      </tr>
                                  )),
                              )
                            : 'No Data...'}
                    </tbody>
                </table>
            </div>
        </Fragment>
    );
};
export default ExamSchedule;
