import { BACKEND_URL } from '../../../constant';
import './CheckOut.scss';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import { useCurrentUserInfo } from '../../../auth';
import { useAuthFetch } from '../../../auth';
import bob1 from '../Image/bob1.jpg';
import moment from 'moment';
import StudentRequestDetailsModal from './StudentRequestDetailsModal'; //
import HeaderComponent from '../../../components/HeaderComponent/HeaderComponent';

const CheckOut = () => {
    const [data, setData] = useState([]);
    const [dataExamCode, setDataExamCode] = useState([]);
    const [dataCountStudent, setDataCountStudent] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchRollNo, setSearchRollNo] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [filterOption, setFilterOption] = useState('All');
    const [isEditMode, setIsEditMode] = useState(false);
    const [checkoutChanges, setCheckoutChanges] = useState({});
    const user = useCurrentUserInfo();
    const authfetch = useAuthFetch();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const formatEndTime = moment(query.get('endTime')).format('HH:mm');
    const room = query.get('roomName');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 800);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [changedData, setChangedData] = useState(new Set());
    const defaultImage = '/default-avatar.jpg';
    const [showSubmitHeaders, setShowSubmitHeaders] = useState(true);
    const [notes, setNotes] = useState('');
    const [subject, setSubject] = useState(new Set());
    const [selectedSections, setSelectedSections] = useState(new Set());
    const [availableSections, setAvailableSections] = useState({
        Listening: false,
        Reading: false,
        Writing: false,
        Speaking: false,
    });
    const [modalShow, setModalShow] = useState(false);
    const [modalData, setModalData] = useState({
        rollNo: '',
        startTime: '',
        endTime: '',
        room: '',
        requests: [],
    });
    const [isTableView, setIsTableView] = useState(false);

    const handleToggleView = (view) => {
        setIsTableView(view === 'table');
    };

    useEffect(() => {
        fetchData();
        getDataExamCode();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (subject.size > 0) {
            getDataExamCode();
        }
    }, [subject]);

    useEffect(() => {
        getCountStudent();
    }, []);

    useEffect(() => {
        handleFilter();
        handleSearch();
    }, [searchInput, filterOption]);

    const handleResize = () => {
        setIsMobile(window.innerWidth < 800);
    };
    const fetchData = () => {
        const getCheckoutDetails = authfetch(
            BACKEND_URL +
                `/GetCheckoutDetails/${user.userId}?startTime=${startTime}&endTime=${endTime}&roomName=${room}`,
        ).then((response) => response.json());

        const getViewRecordsViolations = authfetch(
            BACKEND_URL +
                `/Examiner/ReceiveViolation/GetAllViolationByProctorIdAndCheckOut?violationById=${user.userId}`,
        )
            .then((response) => response.json())
            .catch((error) => {
                console.error('Error fetching violation records:', error);
                return [];
            });

        Promise.all([getCheckoutDetails, getViewRecordsViolations])
            .then(([checkoutDetails, recordsViolations]) => {
                checkoutDetails = checkoutDetails || [];
                recordsViolations = Array.isArray(recordsViolations) ? recordsViolations : [];

                const updatedData = checkoutDetails.map((item) => {
                    const violationRecord = recordsViolations.find((record) => record.studentIdNumber === item.rollNo);

                    return {
                        ...item,
                        checkInStatus: item.isCheckin ? 'Present' : 'Absent',
                        checkSubmitStatus: item.isSubmit ? 'Submitted' : 'Not Submit',
                        checkoutTime: item.checkoutTime
                            ? new Date(item.checkoutTime).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                              })
                            : '',
                        time: item.time
                            ? new Date(item.time).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                              })
                            : '',
                        isCheckout: item.isCheckout,
                        violationTitle: violationRecord ? violationRecord.violationTitle : '',
                        resolveStatus: violationRecord ? violationRecord.resolveStatus : '',
                        note: Array.isArray(item.note) ? item.note : [],
                    };
                });
                console.log(updatedData);
                const hasSubmitted = checkoutDetails.some((item) => item.checkSubmitStatus === true);
                const subjects = new Set(checkoutDetails.map((item) => item.subjectCode));
                setData(updatedData);
                setSubject(subjects);
                setShowSubmitHeaders(hasSubmitted);
                const sections = new Set(checkoutDetails.flatMap((item) => item.note));
                setSelectedSections(sections);
                const notesMap = {};
                updatedData.forEach((item, index) => {
                    notesMap[index] = item.note[0] || [];
                });
                setNotes(notesMap);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
            });
    };

    const getDataExamCode = () => {
        const subjectCodes = Array.from(subject).join(',');
        authfetch(
            BACKEND_URL +
                `/api/ReceiveExamCode/GetExamCodeByProctorId/${user.userId}?startTime=${startTime}&endTime=${endTime}&subjectCodes=${subjectCodes}`,
        )
            .then((response) => response.json())
            .then((result) => {
                const sortedData = result.sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
                setDataExamCode(sortedData);

                // Determine which sections are available
                const sectionsMap = {};

                // Map each subjectCode to its available sections
                sortedData.forEach((data) => {
                    if (!sectionsMap[data.subjectCode]) {
                        sectionsMap[data.subjectCode] = new Set();
                    }
                    sectionsMap[data.subjectCode].add(data.section);
                });
                setAvailableSections(sectionsMap);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const getCountStudent = () => {
        authfetch(
            BACKEND_URL +
                `/GetCheckedOutStudentsCountByProctorId/${user.userId}?startTime=${startTime}&endTime=${endTime}&roomName=${room}`,
        )
            .then((res) => res.json())
            .then((result) => {
                setDataCountStudent(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleSearchInputChange = (e) => {
        setSearchRollNo(e.target.value);
    };

    const handleSearch = () => {
        if (!searchInput) {
            setFilteredData(data);
            return;
        }
        const filtered = data.filter(
            (item) =>
                item.rollNo.toLowerCase().includes(searchInput.toLowerCase()) ||
                item.fullName.toLowerCase().includes(searchInput.toLowerCase()),
        );
        setFilteredData(filtered);
    };

    const handleSearchButtonClick = () => {
        if (searchRollNo.trim() !== '') {
            setSearchInput(searchRollNo);
        } else {
            setSearchInput('');
            setFilteredData(data);
        }
    };

    const handleFilter = () => {
        let filtered = handleSearch();
        if (filterOption === 'Submitted') {
            filtered = filtered.filter((item) => item.checkSubmitStatus === 'Submitted');
        } else if (filterOption === 'Not Submit') {
            filtered = filtered.filter((item) => item.checkSubmitStatus === 'Not Submit');
        } else if (filterOption === 'Present') {
            filtered = filtered.filter((item) => item.checkInStatus === 'Present');
        } else if (filterOption === 'Absent') {
            filtered = filtered.filter((item) => item.checkInStatus === 'Absent');
        }
        setFilteredData(filtered);
    };

    const goToNextUser = () => {
        const newIndex = (currentIndex + 1) % data.length;
        setCurrentIndex(newIndex);
    };

    const goToPreviousUser = () => {
        const newIndex = (currentIndex - 1 + data.length) % data.length;
        setCurrentIndex(newIndex);
    };

    const handleCheckboxChange = async (index, status) => {
        const updatedData = [...filteredData];
        const previousStatus = updatedData[index].isCheckout;

        const currentTime = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        updatedData[index].isCheckout = status;
        updatedData[index].checkoutTime = status ? currentTime : '0001-01-01T00:00:00';

        if (status && !previousStatus) {
            setDataCountStudent((prev) => ({
                ...prev,
                checkedOutStudentsCount: prev.checkedOutStudentsCount + 1,
            }));
        } else if (!status && previousStatus) {
            setDataCountStudent((prev) => ({
                ...prev,
                checkedOutStudentsCount: prev.checkedOutStudentsCount - 1,
            }));
        }

        setFilteredData(updatedData);
        setChangedData((prev) => new Set(prev).add(index));

        // Prepare data for API request
        const notesForItem = Array.isArray(notes[index])
            ? notes[index]
            : notes[index]?.split(',').map((note) => note.trim()) || [];

        const dataToSend = {
            rollNo: updatedData[index].rollNo,
            isCheckout: status,
            checkoutTime: updatedData[index].checkoutTime,
            startTime: startTime,
            endTime: endTime,
            roomName: room,
            note: notesForItem,
        };
        console.log(dataToSend);
        try {
            // Make the API request
            const response = await authfetch(BACKEND_URL + '/UpdateIsCheckOut', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([dataToSend]),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error('Failed to submit checkout changes!');
                throw new Error(errorData.message || 'Failed to submit checkout changes');
            }

            toast.success('Checkout changes have been submitted successfully!');
            setIsEditMode(false);
        } catch (error) {
            setFilteredData((prev) => {
                const revertedData = [...prev];
                revertedData[index].isCheckout = !status;
                revertedData[index].checkoutTime = !status ? '0001-01-01T00:00:00' : revertedData[index].checkoutTime;
                return revertedData;
            });

            setDataCountStudent((prev) => ({
                ...prev,
                checkedOutStudentsCount: status ? prev.checkedOutStudentsCount - 1 : prev.checkedOutStudentsCount + 1,
            }));

            toast.error('Failed to save data');
            console.error('Error submitting checkout changes:', error);
        }
    };

    // const handleSubmit = async () => {
    //     const dataToSend = filteredData.map((item, index) => {
    //         const isCheckout = checkoutChanges[index]?.isCheckout ?? item.isCheckout;
    //         const checkoutTime = isCheckout ? checkoutChanges[index]?.checkoutTime : '01/01/1990 00:00:00';
    //         const notesForItem = Array.isArray(notes[index])
    //             ? notes[index]
    //             : notes[index]?.split(',').map((note) => note.trim()) || [];

    //         return {
    //             rollNo: item.rollNo,
    //             isCheckout: isCheckout,
    //             checkoutTime: checkoutTime,
    //             startTime: startTime,
    //             endTime: endTime,
    //             roomName: room,
    //             note: notesForItem,
    //         };
    //     });

    //     console.log(dataToSend);

    //     try {
    //         const response = await authfetch(BACKEND_URL + '/UpdateIsCheckOut', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(dataToSend),
    //         });

    //         if (!response.ok) {
    //             const errorData = await response.json();
    //             toast.error('Failed to submit checkout changes!');
    //             throw new Error(errorData.message || 'Failed to submit checkout changes');
    //         }

    //         toast.success('Checkout changes have been submitted successfully!');
    //         setIsEditMode(false);
    //     } catch (error) {
    //         toast.error('Failed to save data');
    //         console.error('Error submitting checkout changes:', error);
    //     }
    // };

    const handleCheckSubmitClick = async (studentIdNumber) => {
        const requestsToSend = [
            {
                studentIdNumber: studentIdNumber,
                roomName: room,
                startTime: startTime,
                endTime: endTime,
                proctorId: user.userId,
                requestTitle: 'Check Submit',
                note: '',
            },
        ];

        try {
            const response = await authfetch(BACKEND_URL + '/api/Request/AddRequests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestsToSend),
            });

            let responseData;
            if (response.headers.get('content-type')?.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                const errorMessage = responseData.message || responseData || 'Failed to add request';
                throw new Error(errorMessage);
            }

            toast.success('Request submitted successfully');
        } catch (error) {
            console.error('Error:', error);
            toast.error(`An error occurred while adding request: ${error.message}`);
        }
    };

    const fetchRequestData = async (rollNo) => {
        try {
            const response = await authfetch(
                BACKEND_URL +
                    `/api/Request/ViewAllRequestByStudentIdNumber?studentIdNumber=${rollNo}&startTime=${startTime}&endTime=${endTime}&roomName=${room}`,
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

    const handleCheckboxNoteChange = async (index, noteType) => {
        setNotes((prevNotes) => {
            const updatedNotes = { ...prevNotes };
            const noteArray = Array.isArray(updatedNotes[index])
                ? updatedNotes[index]
                : updatedNotes[index]?.split(',').map((note) => note.trim()) || [];

            if (noteArray.includes(noteType)) {
                updatedNotes[index] = noteArray.filter((note) => note !== noteType);
            } else {
                updatedNotes[index] = [...noteArray, noteType];
            }

            return updatedNotes;
        });
        const noteArray = Array.isArray(notes[index])
            ? notes[index]
            : notes[index]?.split(',').map((note) => note.trim()) || [];

        const updatedNotesForItem = noteArray.includes(noteType)
            ? noteArray.filter((note) => note !== noteType)
            : [...noteArray, noteType];

        await submitNotesChanges(index, updatedNotesForItem);
    };

    const submitNotesChanges = async (index, notesForItem) => {
        const currentNotes = Array.isArray(notes[index])
            ? notes[index]
            : notes[index]?.split(',').map((note) => note.trim()) || [];

        if (JSON.stringify(currentNotes) === JSON.stringify(notesForItem)) {
            return;
        }

        const dataToSend = {
            rollNo: filteredData[index].rollNo,
            isCheckout: filteredData[index].isCheckout || false,
            checkoutTime: filteredData[index].checkoutTime,
            startTime: startTime,
            endTime: endTime,
            roomName: room,
            note: notesForItem,
        };

        console.log(dataToSend);

        try {
            const response = await authfetch(BACKEND_URL + '/UpdateIsCheckOut', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([dataToSend]),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error('Failed to submit notes changes!');
                throw new Error(errorData.message || 'Failed to submit notes changes');
            }

            toast.success('Notes changes have been submitted successfully!');
        } catch (error) {
            toast.error('Failed to save notes data');
            console.error('Error submitting notes changes:', error);
        }
    };

    const currentUser = filteredData[currentIndex];

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-checkout">
                {!isMobile && (
                    <div>
                        <div className="checkout-management-header">
                            <Link
                                className="checkout-management-link"
                                to={`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                            >
                                Home
                            </Link>
                            {' > '}
                            <span style={{ fontSize: 14 }}> Check Out</span>{' '}
                        </div>
                        <h2 className="schedulemanage-management-title">
                            You are in the exam room: {room} Slot: {startTime}-{formatEndTime}{' '}
                        </h2>
                        <div className="body-container-checkout">
                            <span style={{ marginRight: 10 }}>Roll No: </span>
                            <input
                                type="text"
                                placeholder="Search by Roll No."
                                value={searchRollNo}
                                onChange={handleSearchInputChange}
                            />
                            <button className="btn btn-primary" onClick={handleSearchButtonClick}>
                                Search
                            </button>
                        </div>
                        <h2 style={{ display: 'inline', marginRight: '45px' }}>
                            Checked out: {dataCountStudent.checkedOutStudentsCount} / {filteredData.length}
                        </h2>
                        <table className="checkout-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Image</th>
                                    <th>Roll No.</th>
                                    <th>Full Name</th>
                                    <th>Citizen Identity</th>
                                    <th>Subject</th>
                                    <th className="text-center">Check In</th>
                                    <th>Checkin Time</th>
                                    <th className="text-center">Check Out</th>
                                    <th>Check Submit</th>
                                    {/* {showSubmitHeaders && <th>Submit File Dat</th>} */}
                                    <th>Checkout Time</th>
                                    <th>Section</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0
                                    ? filteredData.map((item, index) => (
                                          <tr key={index}>
                                              <td>{index + 1}</td>
                                              <td>
                                                  <img
                                                      src={item && item.image ? item.image : defaultImage}
                                                      alt="User Image"
                                                      className="user-image"
                                                      style={{ width: '100px', height: '100px' }}
                                                  />
                                              </td>
                                              <td>
                                                  <a href="#" onClick={() => handleRollNoClick(item.rollNo)}>
                                                      {item.rollNo}
                                                  </a>
                                              </td>
                                              <td>{item.fullName}</td>
                                              <td>{item.citizenIdentity}</td>
                                              <td>{item.subjectCode}</td>
                                              <td>{item.checkInStatus}</td>
                                              <td>{item.time}</td>
                                              <td className="text-center">
                                                  <Form.Check
                                                      inline
                                                      label="Checked Out"
                                                      type="radio"
                                                      id={`inline-radio-${index}-1`}
                                                      name={`group1-${index}`}
                                                      checked={item.isCheckout === true}
                                                      onChange={() => handleCheckboxChange(index, true)}
                                                  />
                                                  <Form.Check
                                                      inline
                                                      label="Not Checked Out"
                                                      type="radio"
                                                      id={`inline-radio-${index}-2`}
                                                      name={`group2-${index}`}
                                                      checked={item.isCheckout === false}
                                                      onChange={() => handleCheckboxChange(index, false)}
                                                  />
                                              </td>
                                              <td className="text-center">
                                                  <button
                                                      className="btn btn-primary"
                                                      onClick={() => handleCheckSubmitClick(item.rollNo)}
                                                  >
                                                      Check Submit
                                                  </button>
                                              </td>
                                              {/* {showSubmitHeaders && (
                                                  <td>{item.checkSubmitStatus === true ? 'Submitted' : 'Not yet'}</td>
                                              )} */}
                                              <td>{item.isCheckout ? item.checkoutTime : ''}</td>
                                              <td>
                                                  {availableSections[item.subjectCode] &&
                                                      availableSections[item.subjectCode].size > 0 && (
                                                          <div className="checkbox-group">
                                                              {availableSections[item.subjectCode].has('Listening') && (
                                                                  <label style={{ marginRight: 10, fontSize: '12px' }}>
                                                                      <input
                                                                          type="checkbox"
                                                                          checked={
                                                                              notes[index]
                                                                                  ? notes[index].includes('Listening')
                                                                                  : false
                                                                          }
                                                                          onChange={() =>
                                                                              handleCheckboxNoteChange(
                                                                                  index,
                                                                                  'Listening',
                                                                              )
                                                                          }
                                                                          style={{ marginRight: 5 }}
                                                                      />
                                                                      Listening
                                                                  </label>
                                                              )}
                                                              {availableSections[item.subjectCode].has('Reading') && (
                                                                  <label style={{ marginRight: 10, fontSize: '12px' }}>
                                                                      <input
                                                                          type="checkbox"
                                                                          checked={
                                                                              notes[index]
                                                                                  ? notes[index].includes('Reading')
                                                                                  : false
                                                                          }
                                                                          onChange={() =>
                                                                              handleCheckboxNoteChange(index, 'Reading')
                                                                          }
                                                                          style={{ marginRight: 5 }}
                                                                      />
                                                                      Reading
                                                                  </label>
                                                              )}
                                                              {availableSections[item.subjectCode].has('Writing') && (
                                                                  <label style={{ marginRight: 10, fontSize: '12px' }}>
                                                                      <input
                                                                          type="checkbox"
                                                                          checked={
                                                                              notes[index]
                                                                                  ? notes[index].includes('Writing')
                                                                                  : false
                                                                          }
                                                                          onChange={() =>
                                                                              handleCheckboxNoteChange(index, 'Writing')
                                                                          }
                                                                          style={{ marginRight: 5 }}
                                                                      />
                                                                      Writing
                                                                  </label>
                                                              )}
                                                              {availableSections[item.subjectCode].has('Speaking') && (
                                                                  <label style={{ marginRight: 10, fontSize: '12px' }}>
                                                                      <input
                                                                          type="checkbox"
                                                                          checked={
                                                                              notes[index]
                                                                                  ? notes[index].includes('Speaking')
                                                                                  : false
                                                                          }
                                                                          onChange={() =>
                                                                              handleCheckboxNoteChange(
                                                                                  index,
                                                                                  'Speaking',
                                                                              )
                                                                          }
                                                                          style={{ marginRight: 5 }}
                                                                      />
                                                                      Speaking
                                                                  </label>
                                                              )}
                                                          </div>
                                                      )}
                                              </td>
                                              <td>
                                                  {item.violationTitle && (
                                                      <>
                                                          <h6>Violation: {item.violationTitle}</h6>
                                                      </>
                                                  )}
                                                  {item.resolveStatus && (
                                                      <>
                                                          <br />
                                                          <h6>Handle: {item.resolveStatus}</h6>
                                                      </>
                                                  )}
                                              </td>
                                          </tr>
                                      ))
                                    : 'No Data...'}
                            </tbody>
                        </table>

                        {/* <div className="body-container-checkout">
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (isEditMode) {
                                        handleSubmit();
                                    } else {
                                        setIsEditMode(true);
                                    }
                                }}
                            >
                                {isEditMode ? 'Submit' : 'Edit'}
                            </button>
                        </div> */}
                    </div>
                )}
                {isMobile && (
                    <div>
                        <div className="checkout-management-header">
                            <Link
                                className="checkout-management-link"
                                to={`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                            >
                                Home
                            </Link>
                            {' > '}
                            <span style={{ fontSize: 14 }}> Check Out</span>{' '}
                        </div>
                        <div className="body-container-checkout">
                            <span style={{ marginRight: 10 }}>Roll No: </span>
                            <input
                                style={{ width: 250 }}
                                type="text"
                                placeholder="Search by Roll No."
                                value={searchRollNo}
                                onChange={handleSearchInputChange}
                            />
                            <button className="btn btn-primary" onClick={handleSearchButtonClick}>
                                Search
                            </button>
                        </div>
                        <div style={{ marginBottom: 20, marginTop: 0 }}>
                            <span className="icon-table1">
                                <h2 style={{ display: 'inline', marginRight: 20 }}>
                                    All Student: {currentIndex + 1} / {filteredData.length}
                                </h2>
                                <h2 style={{ display: 'inline', marginRight: '45px' }}>
                                    Checked out: {dataCountStudent.checkedOutStudentsCount} / {filteredData.length}
                                </h2>
                                <span className="icon-table-container">
                                    <span
                                        className={`icon-table-luoi ${isTableView ? 'active' : ''}`}
                                        onClick={() => handleToggleView('table')}
                                    >
                                        <i className="bi bi-justify"></i>
                                    </span>
                                    <span
                                        className={`icon-table-bang ${!isTableView ? 'active' : ''}`}
                                        onClick={() => handleToggleView('form')}
                                    >
                                        <i className="bi bi-person-circle"></i>
                                    </span>
                                </span>
                            </span>
                        </div>

                        {isTableView ? (
                            <table className="checkout-table" style={{ marginBottom: '150px' }}>
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Image</th>
                                        <th>Roll No.</th>
                                        <th>Full Name</th>
                                        <th>Citizen Identity</th>
                                        <th>Subject</th>
                                        <th className="text-center">Checkin</th>
                                        <th>Checkin Time</th>
                                        <th className="text-center">Checkout</th>
                                        <th>Check Submit</th>
                                        {/* {showSubmitHeaders && <th>Submit File Dat</th>} */}
                                        <th>Checkout Time</th>
                                        <th>Section</th>
                                        <th>Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length > 0
                                        ? filteredData.map((item, index) => (
                                              <tr key={index}>
                                                  <td data-title="Image :">
                                                      <img
                                                          src={item && item.image ? item.image : defaultImage}
                                                          alt="User Image"
                                                          className="user-image"
                                                          style={{ width: '50%', height: '50%' }}
                                                      />
                                                  </td>
                                                  <td data-title="Roll No">
                                                      <a href="#" onClick={() => handleRollNoClick(item.rollNo)}>
                                                          {item.rollNo}
                                                      </a>
                                                  </td>
                                                  <td data-title="Full Name :">{item.fullName}</td>
                                                  <td data-title="Citizen Identity :">{item.citizenIdentity}</td>
                                                  <td data-title="Subject :">{item.subjectCode}</td>
                                                  <td data-title="Checkin Time :">{item.time}</td>
                                                  <td className="text-center">
                                                      <Form.Check
                                                          inline
                                                          label="Checked Out"
                                                          type="radio"
                                                          id={`inline-radio-${index}-1`}
                                                          name={`group1-${index}`}
                                                          checked={item.isCheckout === true}
                                                          onChange={() => handleCheckboxChange(index, true)}
                                                      />
                                                      <Form.Check
                                                          inline
                                                          label="Not Checked Out"
                                                          type="radio"
                                                          id={`inline-radio-${index}-2`}
                                                          name={`group2-${index}`}
                                                          checked={item.isCheckout === false}
                                                          onChange={() => handleCheckboxChange(index, false)}
                                                      />
                                                  </td>
                                                  <td data-title="Check Submit :" className="text-center">
                                                      <button
                                                          className="btn btn-primary"
                                                          onClick={() => handleCheckSubmitClick(item.rollNo)}
                                                      >
                                                          Check Submit
                                                      </button>
                                                  </td>
                                                  {/* {showSubmitHeaders && (
                                                      <td>{item.isSubmitFileDat === true ? 'Submitted' : 'Not yet'}</td>
                                                  )} */}
                                                  <td data-title="Checkout Time :" style={{ paddingBottom: '20px' }}>
                                                      {item.isCheckout ? item.checkoutTime : ''}
                                                  </td>
                                                  <td data-title="Section: ">
                                                      {availableSections[item.subjectCode] &&
                                                          availableSections[item.subjectCode].size > 0 && (
                                                              <div className="checkbox-group">
                                                                  {availableSections[item.subjectCode].has(
                                                                      'Listening',
                                                                  ) && (
                                                                      <label
                                                                          style={{ marginRight: 10, fontSize: '12px' }}
                                                                      >
                                                                          <input
                                                                              type="checkbox"
                                                                              checked={
                                                                                  notes[index]
                                                                                      ? notes[index].includes(
                                                                                            'Listening',
                                                                                        )
                                                                                      : false
                                                                              }
                                                                              onChange={() =>
                                                                                  handleCheckboxNoteChange(
                                                                                      index,
                                                                                      'Listening',
                                                                                  )
                                                                              }
                                                                              style={{ marginRight: 5 }}
                                                                          />
                                                                          Listening
                                                                      </label>
                                                                  )}
                                                                  {availableSections[item.subjectCode].has(
                                                                      'Reading',
                                                                  ) && (
                                                                      <label
                                                                          style={{ marginRight: 10, fontSize: '12px' }}
                                                                      >
                                                                          <input
                                                                              type="checkbox"
                                                                              checked={
                                                                                  notes[index]
                                                                                      ? notes[index].includes('Reading')
                                                                                      : false
                                                                              }
                                                                              onChange={() =>
                                                                                  handleCheckboxNoteChange(
                                                                                      index,
                                                                                      'Reading',
                                                                                  )
                                                                              }
                                                                              style={{ marginRight: 5 }}
                                                                          />
                                                                          Reading
                                                                      </label>
                                                                  )}
                                                                  {availableSections[item.subjectCode].has(
                                                                      'Writing',
                                                                  ) && (
                                                                      <label
                                                                          style={{ marginRight: 10, fontSize: '12px' }}
                                                                      >
                                                                          <input
                                                                              type="checkbox"
                                                                              checked={
                                                                                  notes[index]
                                                                                      ? notes[index].includes('Writing')
                                                                                      : false
                                                                              }
                                                                              onChange={() =>
                                                                                  handleCheckboxNoteChange(
                                                                                      index,
                                                                                      'Writing',
                                                                                  )
                                                                              }
                                                                              style={{ marginRight: 5 }}
                                                                          />
                                                                          Writing
                                                                      </label>
                                                                  )}
                                                                  {availableSections[item.subjectCode].has(
                                                                      'Speaking',
                                                                  ) && (
                                                                      <label
                                                                          style={{ marginRight: 10, fontSize: '12px' }}
                                                                      >
                                                                          <input
                                                                              type="checkbox"
                                                                              checked={
                                                                                  notes[index]
                                                                                      ? notes[index].includes(
                                                                                            'Speaking',
                                                                                        )
                                                                                      : false
                                                                              }
                                                                              onChange={() =>
                                                                                  handleCheckboxNoteChange(
                                                                                      index,
                                                                                      'Speaking',
                                                                                  )
                                                                              }
                                                                              style={{ marginRight: 5 }}
                                                                          />
                                                                          Speaking
                                                                      </label>
                                                                  )}
                                                              </div>
                                                          )}
                                                  </td>
                                                  <td style={{ paddingBottom: 20 }} data-title="Violation :">
                                                      {item.violationTitle && (
                                                          <>
                                                              <h6>Violation: {item.violationTitle}</h6>
                                                          </>
                                                      )}
                                                      {item.resolveStatus && (
                                                          <>
                                                              <br />
                                                              <h6>Handle: {item.resolveStatus}</h6>
                                                          </>
                                                      )}
                                                  </td>
                                              </tr>
                                          ))
                                        : 'No Data...'}
                                </tbody>
                            </table>
                        ) : (
                            <div className="mobile-user-form" style={{ marginBottom: '70px' }}>
                                {currentUser && (
                                    <div className="user-details-checkout">
                                        <div className="user-info-checkout">
                                            <img
                                                src={
                                                    currentUser && currentUser.image ? currentUser.image : defaultImage
                                                }
                                                alt="User Image"
                                                className="user-image"
                                                style={{ width: '100%', height: '60%' }}
                                            />
                                            <div>
                                                <p>
                                                    Roll No:{' '}
                                                    <a href="#" onClick={() => handleRollNoClick(currentUser.rollNo)}>
                                                        {currentUser.rollNo}
                                                    </a>
                                                </p>
                                                <p>Name: {currentUser.fullName}</p>
                                                <p>Citizen Identity: {currentUser.citizenIdentity}</p>
                                                <p>Subject: {currentUser.subjectCode}</p>
                                                <p>Checkin Time: {currentUser.time}</p>
                                                <p>
                                                    {currentUser.violationTitle && (
                                                        <>
                                                            <p>Violation: {currentUser.violationTitle}</p>
                                                        </>
                                                    )}
                                                    {currentUser.resolveStatus && (
                                                        <>
                                                            <p>Handle: {currentUser.resolveStatus}</p>
                                                        </>
                                                    )}
                                                </p>
                                                <p>
                                                    Checkout Time:{' '}
                                                    {currentUser.isCheckout ? currentUser.checkoutTime : ''}
                                                </p>
                                                <div className="checkbox-group">
                                                    <p>Section:</p>
                                                    {availableSections[currentUser.subjectCode] &&
                                                        availableSections[currentUser.subjectCode].size > 0 && (
                                                            <div className="checkbox-group">
                                                                {availableSections[currentUser.subjectCode].has(
                                                                    'Listening',
                                                                ) && (
                                                                    <label
                                                                        style={{ marginRight: 10, fontSize: '12px' }}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                notes[currentIndex]
                                                                                    ? notes[currentIndex].includes(
                                                                                          'Listening',
                                                                                      )
                                                                                    : false
                                                                            }
                                                                            onChange={() =>
                                                                                handleCheckboxNoteChange(
                                                                                    currentIndex,
                                                                                    'Listening',
                                                                                )
                                                                            }
                                                                            style={{ marginRight: 5 }}
                                                                        />
                                                                        Listening
                                                                    </label>
                                                                )}
                                                                {availableSections[currentUser.subjectCode].has(
                                                                    'Reading',
                                                                ) && (
                                                                    <label
                                                                        style={{ marginRight: 10, fontSize: '12px' }}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                notes[currentIndex]
                                                                                    ? notes[currentIndex].includes(
                                                                                          'Reading',
                                                                                      )
                                                                                    : false
                                                                            }
                                                                            onChange={() =>
                                                                                handleCheckboxNoteChange(
                                                                                    currentIndex,
                                                                                    'Reading',
                                                                                )
                                                                            }
                                                                            style={{ marginRight: 5 }}
                                                                        />
                                                                        Reading
                                                                    </label>
                                                                )}
                                                                {availableSections[currentUser.subjectCode].has(
                                                                    'Writing',
                                                                ) && (
                                                                    <label
                                                                        style={{ marginRight: 10, fontSize: '12px' }}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                notes[currentIndex]
                                                                                    ? notes[currentIndex].includes(
                                                                                          'Writing',
                                                                                      )
                                                                                    : false
                                                                            }
                                                                            onChange={() =>
                                                                                handleCheckboxNoteChange(
                                                                                    currentIndex,
                                                                                    'Writing',
                                                                                )
                                                                            }
                                                                            style={{ marginRight: 5 }}
                                                                        />
                                                                        Writing
                                                                    </label>
                                                                )}
                                                                {availableSections[currentUser.subjectCode].has(
                                                                    'Speaking',
                                                                ) && (
                                                                    <label
                                                                        style={{ marginRight: 10, fontSize: '12px' }}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                notes[currentIndex]
                                                                                    ? notes[currentIndex].includes(
                                                                                          'Speaking',
                                                                                      )
                                                                                    : false
                                                                            }
                                                                            onChange={() =>
                                                                                handleCheckboxNoteChange(
                                                                                    currentIndex,
                                                                                    'Speaking',
                                                                                )
                                                                            }
                                                                            style={{ marginRight: 5 }}
                                                                        />
                                                                        Speaking
                                                                    </label>
                                                                )}
                                                            </div>
                                                        )}
                                                    {/* {availableSections.Listening && (
                                                        <label style={{ marginRight: 10, fontSize: '12px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    notes[currentIndex]
                                                                        ? notes[currentIndex].includes('Listening')
                                                                        : false
                                                                }
                                                                onChange={() =>
                                                                    handleCheckboxNoteChange(currentIndex, 'Listening')
                                                                }
                                                                // disabled={!isEditMode}
                                                                style={{ marginRight: 5 }}
                                                            />
                                                            Listening
                                                        </label>
                                                    )}
                                                    {availableSections.Reading && (
                                                        <label style={{ marginRight: 10, fontSize: '12px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    notes[currentIndex]
                                                                        ? notes[currentIndex].includes('Reading')
                                                                        : false
                                                                }
                                                                onChange={() =>
                                                                    handleCheckboxNoteChange(currentIndex, 'Reading')
                                                                }
                                                                // disabled={!isEditMode}
                                                                style={{ marginRight: 5 }}
                                                            />
                                                            Reading
                                                        </label>
                                                    )}
                                                    {availableSections.Writing && (
                                                        <label style={{ marginRight: 10, fontSize: '12px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    notes[currentIndex]
                                                                        ? notes[currentIndex].includes('Writing')
                                                                        : false
                                                                }
                                                                onChange={() =>
                                                                    handleCheckboxNoteChange(currentIndex, 'Writing')
                                                                }
                                                                // disabled={!isEditMode}
                                                                style={{ marginRight: 5 }}
                                                            />
                                                            Writing
                                                        </label>
                                                    )}
                                                    {availableSections.Speaking && (
                                                        <label style={{ marginRight: 10, fontSize: '12px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    notes[currentIndex]
                                                                        ? notes[currentIndex].includes('Speaking')
                                                                        : false
                                                                }
                                                                onChange={() =>
                                                                    handleCheckboxNoteChange(currentIndex, 'Speaking')
                                                                }
                                                                // disabled={!isEditMode}
                                                                style={{ marginRight: 5 }}
                                                            />
                                                            Speaking
                                                        </label>
                                                    )} */}
                                                </div>
                                                {/* {showSubmitHeaders && (
                                                    <p>
                                                        Submit File Dat:{' '}
                                                        {currentUser.isSubmitFileDat === true ? 'Submitted' : 'Not yet'}
                                                    </p>
                                                )} */}
                                                <p>
                                                    <div className="button-group">
                                                        <button
                                                            className={`btn ${
                                                                currentUser.isCheckout === true
                                                                    ? 'btn-danger'
                                                                    : 'btn-secondary'
                                                            }`}
                                                            style={{ fontSize: '12px', fontWeight: 'bold' }}
                                                            onClick={() => handleCheckboxChange(currentIndex, true)}
                                                            // disabled={!isEditMode}
                                                        >
                                                            Checked out
                                                        </button>
                                                        <button
                                                            className={`btn ${
                                                                currentUser.isCheckout === false
                                                                    ? 'btn-danger'
                                                                    : 'btn-secondary'
                                                            }`}
                                                            style={{ fontSize: '12px', fontWeight: 'bold' }}
                                                            onClick={() => handleCheckboxChange(currentIndex, false)}
                                                            // disabled={!isEditMode}
                                                        >
                                                            Not Checked out
                                                        </button>
                                                        {/* <button
                                                            className={`btn ${
                                                                checkoutChanges[currentIndex]?.isCheckout
                                                                    ? 'btn-danger'
                                                                    : 'btn-secondary'
                                                            }`}
                                                            onClick={() =>
                                                                handleCheckboxChange(currentIndex, 'checkout')
                                                            }
                                                            disabled={!isEditMode}
                                                        >
                                                            {checkoutChanges[currentIndex]?.isCheckout
                                                                ? 'Check Out'
                                                                : 'Check Out'}
                                                        </button> */}
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => handleCheckSubmitClick(currentUser.rollNo)}
                                                        >
                                                            Check Submit
                                                        </button>
                                                    </div>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {currentUser && (
                                    <div className="footer-fix">
                                        <div
                                            className="navigation-buttons-container navigation-buttons"
                                            style={{ marginLeft: '35px' }}
                                        >
                                            <div className="navigation-buttons-group">
                                                <button onClick={goToPreviousUser}>Back</button>
                                                <button onClick={goToNextUser}>Next</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* {currentUser && (
                            <div className="navigation-buttons-container navigation-buttons">
                                <div className="navigation-buttons-group">
                                    <button onClick={goToPreviousUser} disabled={currentIndex === 0}>
                                        Back
                                    </button>
                                    <button onClick={goToNextUser} disabled={currentIndex === filteredData.length - 1}>
                                        Next
                                    </button>
                                </div>
                                <button
                                    className="btn btn-primary edit-button"
                                    onClick={() => {
                                        if (isEditMode) {
                                            handleSubmit();
                                        } else {
                                            setIsEditMode(true);
                                        }
                                    }}
                                >
                                    {isEditMode ? 'Submit' : 'Edit'}
                                </button>
                            </div>
                        )} */}
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

export default CheckOut;
