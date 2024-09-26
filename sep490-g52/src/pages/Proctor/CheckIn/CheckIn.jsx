import {BACKEND_URL} from '../../../constant';
import './CheckIn.scss';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import { useCurrentUserInfo } from '../../../auth';
import { useAuthFetch } from '../../../auth';
import bob1 from '../Image/bob1.jpg';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Modal from 'react-bootstrap/Modal';
import imageCompression from 'browser-image-compression';
import HeaderComponent from '../../../components/HeaderComponent/HeaderComponent';

const CheckIn = () => {
    const [data, setData] = useState([]);
    const [dataMobile, setDataMobile] = useState([]);
    const [dataAll, setDataAll] = useState([]);
    const [dataCountStudent, setDataCountStudent] = useState([]);
    const [searchRollNo, setSearchRollNo] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const user = useCurrentUserInfo();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const room = query.get('roomName');
    const authfetch = useAuthFetch();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 800);
    const [notes, setNotes] = useState({});
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);
    const [filteredTotalCount, setFilteredTotalCount] = useState(0);
    const totalPages = Math.ceil(filteredTotalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;
    const [changedData, setChangedData] = useState(new Set());
    const defaultImage = '/default-avatar.jpg';
    const [images, setImages] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);
    const [currentIndexImage, setCurrentIndexImage] = useState(0);
    const imageRefs = useRef([]);
    const [studentId, setStudentId] = useState('');
    const [initialData, setInitialData] = useState([]);
    const [initialDataMobile, setInitialDataMoblie] = useState([]);
    const [isTableView, setIsTableView] = useState(false);

    const handleToggleView = (view) => {
        setIsTableView(view === 'table');
    };

    useEffect(() => {
        fetchData();
        fetchDataMobile();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        getCountStudent();
    }, []);

    useEffect(() => {
        if (filteredData[currentIndex]) {
            setStudentId(filteredData[currentIndex].studentId);
            setImages(filteredData[currentIndex].imageStudent.map((image) => image.uploadImage));
        }
    }, [currentIndex, filteredData]);

    useEffect(() => {
        if (imageRefs.current[currentIndexImage]) {
            imageRefs.current[currentIndexImage].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [currentIndexImage]);

    const handleResize = () => {
        setIsMobile(window.innerWidth < 800);
    };

    const formatTime = (timeString) => {
        const date = new Date(timeString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    useEffect(() => {
        fetchData();
        fetchDataMobile();
        fetchAllData();
    }, [pageNumber, statusFilter]);

    const fetchData = () => {
        let queryString = `rollNo=${encodeURIComponent(searchRollNo)}`;
        if (statusFilter) {
            queryString += `&status=${encodeURIComponent(statusFilter)}`;
        }

        authfetch(
            BACKEND_URL + `/api/CheckIn/GetAllStudentsToCheckinByProctorId/${user.userId}?startTime=${startTime}&${queryString}&endTime=${endTime}&roomName=${room}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalCount, studentRequests } = result;

                const updatedData = studentRequests.map((item) => ({
                    ...item,
                    isCheckin: item.isCheckin !== undefined ? item.isCheckin : null,
                    time: formatTime(item.time),
                }));

                const image = studentRequests?.map((item) =>
                    item.imageStudent.map((image) => ({
                        ...image,
                    })),
                );
                setInitialData(
                    updatedData.map((item) => ({
                        rollNo: item.rollNo,
                        checkinTime: item.checkinTime,
                        isCheckin: item.isCheckin,
                    })),
                );
                setData(updatedData);
                setFilteredData(updatedData);
                setFilteredTotalCount(totalCount);
                if (updatedData.length > 0) {
                    setStudentId(updatedData[0].studentId);
                    setImages(image[0] || []);
                }
            })
            .catch((error) => {
                console.log('Error fetching data:', error);
            });
    };

    const fetchAllData = () => {
        authfetch(
            BACKEND_URL + `/api/CheckIn/GetAllStudentsToCheckinByProctorId/${user.userId}?startTime=${startTime}&endTime=${endTime}&roomName=${room}&pageNumber=${pageNumber}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalCount, studentRequests } = result;

                const updatedData = studentRequests.map((item) => ({
                    ...item,
                    isCheckin: item.isCheckin,
                    time: formatTime(item.time),
                }));

                const image = studentRequests?.map((item) =>
                    item.imageStudent.map((image) => ({
                        ...image,
                    })),
                );
                const uniqueStatus = getUniqueStatus(updatedData);
                setStatusOptions(uniqueStatus);

                setDataAll(updatedData);
                setTotalCount(totalCount);
                if (updatedData.length > 0) {
                    setStudentId(updatedData[0].studentId);
                    setImages(image[0] || []);
                }
            })
            .catch((error) => {
                console.log('Error fetching data:', error);
            });
    };

    const fetchDataMobile = () => {
        let queryString = `rollNo=${encodeURIComponent(searchRollNo)}`;
        if (statusFilter) {
            queryString += `&status=${encodeURIComponent(statusFilter)}`;
        }
        authfetch(
            BACKEND_URL + `/api/CheckIn/GetAllStudentsToCheckinByProctorId/${user.userId}?startTime=${startTime}&${queryString}&endTime=${endTime}&roomName=${room}&pageNumber=${pageNumber}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalCount, studentRequests } = result;

                const updatedData = studentRequests.map((item) => ({
                    ...item,
                    isCheckin: item.isCheckin,
                    time: formatTime(item.time),
                    note: item.note || '',
                }));

                const image = studentRequests?.map((item) =>
                    item.imageStudent.map((image) => ({
                        ...image,
                    })),
                );
                setInitialDataMoblie(
                    updatedData.map((item) => ({
                        rollNo: item.rollNo,
                        checkinTime: item.checkinTime,
                        isCheckin: item.isCheckin,
                    })),
                );
                setDataMobile(updatedData);
                if (updatedData.length > 0) {
                    setStudentId(updatedData[0].studentId);
                    setImages(image[0] || []);
                }
            })
            .catch((error) => {
                console.log('Error fetching data:', error);
            });
    };

    const getUniqueStatus = (data) => {
        const uniqueStatus = [...new Set(data.map((item) => item.isCheckin))];
        return uniqueStatus;
    };

    const handleSearchRollNo = () => {
        setPageNumber(1);
        fetchData();
    };

    const handleSearchRollNoMobile = () => {
        fetchDataMobile();
    };

    const getCountStudent = () => {
        authfetch(
            BACKEND_URL + `/api/CheckIn/GetCheckedInStudentsCountByProctorId/${user.userId}?startTime=${startTime}&endTime=${endTime}&roomName=${room}`,
        )
            .then((res) => res.json())
            .then((result) => {
                console.log('API Result:', result);
                setDataCountStudent(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleCheckInChange = async (index, status) => {
        const updatedData = [...filteredData];
        const previousStatus = updatedData[index].isCheckin;
        updatedData[index].isCheckin = status;

        const currentTime = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        updatedData[index].checkinTime = status
            ? updatedData[index].checkinTime === '0001-01-01T00:00:00'
                ? currentTime
                : updatedData[index].checkinTime
            : '0001-01-01T00:00:00';

        setFilteredData(updatedData);
        setChangedData((prev) => new Set(prev).add(index));

        if (status && !previousStatus) {
            setDataCountStudent((prev) => ({
                ...prev,
                checkedInStudentsCount: prev.checkedInStudentsCount + 1,
            }));
        } else if (!status && previousStatus) {
            setDataCountStudent((prev) => ({
                ...prev,
                checkedInStudentsCount: prev.checkedInStudentsCount - 1,
            }));
        }

        const dataToSend = {
            rollNo: updatedData[index].rollNo,
            isCheckin: status,
            checkinTime: updatedData[index].checkinTime,
            startTime: startTime,
            endTime: endTime,
            roomName: room,
            note: notes[index] || updatedData[index].note,
        };

        console.log(dataToSend);

        try {
            const response = await authfetch(BACKEND_URL + '/api/CheckIn/AddStudentsIntoCheckIn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([dataToSend]),
            });

            const contentType = response.headers.get('content-type');
            let responseData;
            if (contentType && contentType.indexOf('application/json') !== -1) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!responseData.success) {
                toast.success('Status updated successfully!');
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            toast.error('Failed to update status');
            console.error(error);
        }
    };

    const handleCheckInMobileChange = async (index, status) => {
        const updatedData = [...dataMobile];
        const previousStatus = updatedData[index].isCheckin;

        // Update the check-in status and time
        updatedData[index].isCheckin = status;
        updatedData[index].checkinTime = status
            ? updatedData[index].checkinTime === '0001-01-01T00:00:00'
                ? new Date().toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                  })
                : updatedData[index].checkinTime
            : '0001-01-01T00:00:00';

        // Optimistic UI update for data count
        if (status && !previousStatus) {
            setDataCountStudent((prev) => ({
                ...prev,
                checkedInStudentsCount: prev.checkedInStudentsCount + 1,
            }));
        } else if (!status && previousStatus) {
            setDataCountStudent((prev) => ({
                ...prev,
                checkedInStudentsCount: prev.checkedInStudentsCount - 1,
            }));
        }

        // Update the local state
        setDataMobile(updatedData);
        setChangedData((prev) => new Set(prev).add(index));

        const dataToSend = {
            rollNo: updatedData[index].rollNo,
            isCheckin: status,
            checkinTime: updatedData[index].checkinTime,
            startTime: startTime,
            endTime: endTime,
            roomName: room,
            note: notes[index] || updatedData[index].note,
        };

        console.log(dataToSend);

        try {
            const response = await authfetch(BACKEND_URL + '/api/CheckIn/AddStudentsIntoCheckIn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([dataToSend]),
            });

            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.indexOf('application/json') !== -1) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (responseData.success) {
                toast.error('Failed to check in');
            } else {
                toast.success('Students have been checked in!');
            }
        } catch (error) {
            toast.error('Failed to save data');
            console.log(error);
        }
    };

    const handleNoteChange = (index, value) => {
        setNotes((prevNotes) => ({
            ...prevNotes,
            [index]: value,
        }));
        setChangedData((prev) => new Set(prev).add(index));
    };

    const handleKeyDown = async (index, event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            // Save the note change
            await SaveNoteChange(index);
        }
    };

    const SaveNoteChange = async (index) => {
        const updatedData = [...filteredData];

        // Use the current check-in status
        const status = updatedData[index].isCheckin;
        const currentTime = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        if (status) {
            updatedData[index].checkinTime =
                updatedData[index].checkinTime === '0001-01-01T00:00:00' ? currentTime : updatedData[index].checkinTime;
        } else {
            updatedData[index].checkinTime = '0001-01-01T00:00:00';
        }

        setFilteredData(updatedData);
        setChangedData((prev) => new Set(prev).add(index));

        const dataToSend = {
            rollNo: updatedData[index].rollNo,
            isCheckin: status,
            checkinTime: updatedData[index].checkinTime,
            startTime: startTime,
            endTime: endTime,
            roomName: room,
            note: notes[index] || updatedData[index].note,
        };

        console.log(dataToSend);
        try {
            const response = await authfetch(BACKEND_URL + '/api/CheckIn/AddStudentsIntoCheckIn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([dataToSend]),
            });

            const contentType = response.headers.get('content-type');
            let responseData;
            const newCount = status
                ? dataCountStudent.checkedInStudentsCount + 1
                : dataCountStudent.checkedInStudentsCount - 1;

            setDataCountStudent({
                ...dataCountStudent,
                checkedInStudentsCount: newCount,
            });
            if (contentType && contentType.indexOf('application/json') !== -1) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!responseData.success) {
                toast.success('Note updated successfully!');
            } else {
                toast.error('Failed to update note');
            }
        } catch (error) {
            toast.error('Failed to update note');
            console.log(error);
        }
    };

    const handleSaveMobile = async () => {
        const currentTime = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        const updatedData = dataMobile.map((user, index) => {
            const initialEntry = initialDataMobile[index];
            const wasPresent = initialDataMobile[index]?.isCheckin;
            const isPresentNow = user.isCheckin;

            return {
                rollNo: user.rollNo,
                isCheckin: isPresentNow,
                checkinTime: isPresentNow ? (wasPresent ? initialEntry.checkinTime : currentTime) : user.checkinTime,
                startTime: startTime,
                endTime: endTime,
                roomName: room,
                note: notes[index] || user.note,
            };
        });
        console.log(updatedData);
        try {
            const response = await authfetch(BACKEND_URL + '/api/CheckIn/AddStudentsIntoCheckIn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.indexOf('application/json') !== -1) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (responseData.success) {
                toast.error('Failed to checked in');
            } else {
                toast.success('Students have been checked in!');
            }
        } catch (error) {
            toast.error('Failed to save data');
            console.log(error);
        }
    };

    const handleSave = async () => {
        const currentTime = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        const updatedData = filteredData.map((user, index) => {
            const initialEntry = initialData[index];
            const wasPresent = initialData[index]?.isCheckin;
            const isPresentNow = user.isCheckin;
            console.log(filteredData);
            return {
                rollNo: user.rollNo,
                isCheckin: isPresentNow,
                checkinTime: isPresentNow ? (wasPresent ? initialEntry.checkinTime : currentTime) : user.checkinTime,
                startTime: startTime,
                endTime: endTime,
                roomName: room,
                note: notes[index] || user.note,
            };
        });
        console.log(updatedData);
        try {
            const response = await authfetch(BACKEND_URL + '/api/CheckIn/AddStudentsIntoCheckIn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.indexOf('application/json') !== -1) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (responseData.success) {
                toast.error('Failed to checked in');
            } else {
                toast.success('Students have been checked in!');
            }
        } catch (error) {
            toast.error('Failed to save data');
            console.log(error);
        }
    };

    const handleEditSubmitToggle = () => {
        if (isEditMode) {
            handleSave();
        }
        setIsEditMode(!isEditMode);
        setChangedData(new Set());
    };

    const handleEditSubmitToggleMobile = () => {
        if (isEditMode) {
            handleSaveMobile();
        }
        setIsEditMode(!isEditMode);
        setChangedData(new Set());
    };

    const goToNextUser = () => {
        const newIndex = (currentIndex + 1) % dataMobile.length;
        setCurrentIndex(newIndex);
        setStudentId(dataMobile[newIndex].studentId);
        setImages(dataMobile[newIndex].ImageStudent || []);
    };

    const goToPreviousUser = () => {
        const newIndex = (currentIndex - 1 + dataMobile.length) % dataMobile.length;
        setCurrentIndex(newIndex);
        setStudentId(dataMobile[newIndex].studentId);
        setImages(dataMobile[newIndex].ImageStudent || []);
    };

    const handleFileUpload = async (event) => {
        const imageFile = event.target.files[0];
        if (!imageFile) {
            toast.error('No image selected.');
            return;
        }

        try {
            // Resize the image
            const resizedImageFile = await resizeImage(imageFile, 800, 600);

            const formData = new FormData();
            formData.append('image', resizedImageFile);
            formData.append('studentid', studentId);

            const response = await authfetch(BACKEND_URL + '/api/CheckIn/UploadImageStudent', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            fetchData();
            const result = await response.json();
            const { fileUrl } = result;

            setImages((prevImages) => [...prevImages, fileUrl]);
            toast.success('Image uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload image');
            console.log(error);
        }
    };

    const handleNext = () => {
        setCurrentIndexImage((prevIndex) => {
            const newIndex = (prevIndex + 1) % images.length;
            imageRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return newIndex;
        });
    };

    const handlePrev = () => {
        setCurrentIndexImage((prevIndex) => {
            const newIndex = (prevIndex - 1 + images.length) % images.length;
            imageRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return newIndex;
        });
    };

    const handleImageClick = (image) => {
        setSelectedImage(image);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const resizeImage = (file, maxWidth, maxHeight) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                console.log(`Original Size: ${img.width}x${img.height}`);
                console.log(`Resized Size: ${canvas.width}x${canvas.height}`);

                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: file.type }));
                }, file.type);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const handleSaveImage = async () => {
        if (!studentId) {
            toast.error('Student ID is not set.');
            return;
        }

        const imageFile = fileInputRef.current.files[0];
        if (!imageFile) {
            toast.error('No image selected.');
            return;
        }

        try {
            const resizedImageFile = await resizeImage(imageFile, 800, 600);

            const formData = new FormData();
            formData.append('image', resizedImageFile);
            formData.append('studentid', studentId);

            const response = await authfetch(BACKEND_URL + '/api/CheckIn/UploadImageStudent', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            fetchData();
            const result = await response.json();
            const { fileUrl } = result;

            setImages((prevImages) => [...prevImages, fileUrl]);
            toast.success('Image uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload image');
            console.log(error);
        }
    };
    const currentUser = dataMobile[currentIndex];

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-checkin">
                {!isMobile && (
                    <div>
                        <div className="checkin-management-header">
                            <Link
                                className="checkin-management-link"
                                to={`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                            >
                                Home
                            </Link>
                            {' > '}
                            <span style={{ fontSize: 14 }}> Check In</span>{' '}
                        </div>
                        <div className="body-container-checkin">
                            <span style={{ marginTop: '10px' }}>Roll No: </span>
                            <input
                                style={{ width: 250 }}
                                type="text"
                                placeholder="Search by Roll No."
                                value={searchRollNo}
                                onChange={(e) => setSearchRollNo(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={handleSearchRollNo}>
                                Search
                            </button>
                        </div>
                        <div className="body-container-examcode">
                            <span style={{ marginRight: 22 }}>Filter Status: </span>
                            {/* <Form.Select
                                className="form-select-examcode fs-6"
                                aria-label="Default select example"
                                value={filterOption}
                                onChange={(e) => setFilterOption(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                            </Form.Select> */}
                            <Form.Group controlId="formRoomName">
                                <Form.Control
                                    className="form-select-examcode fs-6"
                                    style={{ width: 150 }}
                                    as="select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="true">Present</option>
                                    <option value="false">Absent</option>
                                    {/* {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {status === true ? 'Present' : 'Absent'}
                                        </option>
                                    ))} */}
                                </Form.Control>
                            </Form.Group>
                        </div>
                        <h1 style={{ marginTop: 20 }}>Student List</h1>
                        <h2 style={{ display: 'inline' }}>
                            Present: {dataCountStudent.checkedInStudentsCount} / {totalCount}
                        </h2>
                        <table className="checkin-table table-striped">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>IMAGE</th>
                                    <th>Roll No.</th>
                                    <th>Full Name</th>
                                    <th>Citizen Identity</th>
                                    <th>Subject</th>
                                    <th className="text-center">CheckIn</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0
                                    ? filteredData.map((item, index) => (
                                          <tr key={index}>
                                              <td>{startIndex + index}</td>
                                              <td>
                                                  <img
                                                      src={item && item.image ? item.image : defaultImage}
                                                      alt="User Image"
                                                      className="user-image"
                                                      style={{ width: '100px', height: '100px' }}
                                                  />
                                              </td>
                                              <td>{item.rollNo}</td>
                                              <td>{item.fullName}</td>
                                              <td>{item.citizenIdentity}</td>
                                              <td>{item.subjectCode}</td>
                                              <td className="text-center">
                                                  <Form>
                                                      <div className="mb-3">
                                                          <Form.Check
                                                              inline
                                                              label="Present"
                                                              name={`group1-${index}`}
                                                              type="radio"
                                                              id={`inline-radio-${index}-1`}
                                                              checked={item.isCheckin === true}
                                                              onChange={() => handleCheckInChange(index, true)}
                                                              //   disabled={!isEditMode}
                                                          />
                                                          <Form.Check
                                                              inline
                                                              label="Absent"
                                                              name={`group1-${index}`}
                                                              type="radio"
                                                              id={`inline-radio-${index}-2`}
                                                              checked={item.isCheckin === false}
                                                              onChange={() => handleCheckInChange(index, false)}
                                                              //   disabled={!isEditMode}
                                                          />
                                                      </div>
                                                  </Form>
                                              </td>
                                              <td>
                                                  <input
                                                      type="text"
                                                      style={{ width: 300 }}
                                                      value={notes[index] ? notes[index] : item.note}
                                                      onChange={(e) => handleNoteChange(index, e.target.value)}
                                                      onKeyDown={(e) => handleKeyDown(index, e)}
                                                      //   disabled={!isEditMode}
                                                  />
                                              </td>
                                          </tr>
                                      ))
                                    : 'No Data...'}
                            </tbody>
                        </table>
                        <div>
                            <div>
                                <ul className="pagination" style={{ marginTop: 10 }}>
                                    <li className={`page-item ${pageNumber === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPageNumber(pageNumber - 1)}>
                                            Previous
                                        </button>
                                    </li>
                                    {Array.from({ length: totalPages }, (_, index) => (
                                        <li
                                            key={index}
                                            className={`page-item ${pageNumber === index + 1 ? 'active' : ''}`}
                                        >
                                            <button className="page-link" onClick={() => setPageNumber(index + 1)}>
                                                {index + 1}
                                            </button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${pageNumber === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPageNumber(pageNumber + 1)}>
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            {/* <div className="body-container-checkin">
                                <button className="btn btn-primary" onClick={handleEditSubmitToggle}>
                                    {isEditMode ? 'Submit' : 'Edit'}
                                </button>
                            </div> */}
                        </div>
                    </div>
                )}
                {isMobile && (
                    <div>
                        <div className="checkin-management-header">
                            <Link
                                className="checkin-management-link"
                                to={`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                            >
                                Home
                            </Link>
                            {' > '}
                            <span style={{ fontSize: 14 }}> Check In</span>{' '}
                        </div>
                        <div className="body-container-checkin">
                            <span>Roll No: </span>
                            <input
                                style={{ width: 150 }}
                                type="text"
                                placeholder="Search by Roll No."
                                value={searchRollNo}
                                onChange={(e) => setSearchRollNo(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={handleSearchRollNoMobile}>
                                Search
                            </button>
                            <Form.Group controlId="formRoomName">
                                <Form.Control
                                    className="form-select-examcode fs-6"
                                    style={{ width: 100 }}
                                    as="select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">Filter Status</option>
                                    <option value="true">Present</option>
                                    <option value="false">Absent</option>
                                    {/* {statusOptions.map((status) => (
                                        <option key={status} value={status}>
                                            {status === true ? 'Present' : 'Absent'}
                                        </option>
                                    ))} */}
                                </Form.Control>
                            </Form.Group>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <div>
                                <span className="icon-table">
                                    <h2 style={{ display: 'inline', marginRight: 20 }}>
                                        All Student: {currentIndex + 1} / {totalCount}
                                    </h2>
                                    <h2 style={{ display: 'inline', marginRight: '54px' }}>
                                        Present: {dataCountStudent.checkedInStudentsCount} / {totalCount}
                                    </h2>
                                    <span className="icon-table-container" style={{ marginLeft: '26px' }}>
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
                        </div>

                        {isTableView ? (
                            <table className="checkin-table table-striped" style={{ marginBottom: '150px' }}>
                                <thead>
                                    <tr>
                                        <td>No</td>
                                        <td>IMAGE</td>
                                        <td>Roll No.</td>
                                        <td>Full Name</td>
                                        <td>Citizen Identity</td>
                                        <td>Subject</td>
                                        <td className="text-center">CheckIn</td>
                                        <td>Note</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataMobile.length > 0
                                        ? dataMobile.map((item, index) => (
                                              <tr key={index}>
                                                  <td data-title="Image :">
                                                      <img
                                                          src={item && item.image ? item.image : defaultImage}
                                                          alt="User Image"
                                                          className="user-image"
                                                          style={{ width: '50%', height: '50%' }}
                                                      />
                                                  </td>
                                                  <td data-title="Roll No :">{item.rollNo}</td>
                                                  <td data-title="Full Name :">{item.fullName}</td>
                                                  <td data-title="Citizen Identity :">{item.citizenIdentity}</td>
                                                  <td data-title="Subject :">{item.subjectCode}</td>
                                                  <td data-title="Status :" className="text-center button-group-list">
                                                      <Form>
                                                          <div className="mb-3">
                                                              <Form.Check
                                                                  inline
                                                                  label="Present"
                                                                  name={`group1-${index}`}
                                                                  type="radio"
                                                                  id={`inline-radio-${index}-1`}
                                                                  checked={item.isCheckin === true}
                                                                  onChange={() =>
                                                                      handleCheckInMobileChange(index, true)
                                                                  }
                                                                  //   disabled={!isEditMode}
                                                              />
                                                              <Form.Check
                                                                  inline
                                                                  label="Absent"
                                                                  name={`group1-${index}`}
                                                                  type="radio"
                                                                  id={`inline-radio-${index}-2`}
                                                                  checked={item.isCheckin === false}
                                                                  onChange={() =>
                                                                      handleCheckInMobileChange(index, false)
                                                                  }
                                                                  //   disabled={!isEditMode}
                                                              />
                                                          </div>
                                                      </Form>
                                                  </td>
                                                  <td data-title="Note :">
                                                      <input
                                                          type="text"
                                                          style={{ width: 150 }}
                                                          value={notes[index] ? notes[index] : item.note}
                                                          onChange={(e) => handleNoteChange(index, e.target.value)}
                                                          onKeyDown={(e) => handleKeyDown(index, e)}
                                                          //   disabled={!isEditMode}
                                                      ></input>
                                                  </td>
                                              </tr>
                                          ))
                                        : 'No Data...'}
                                </tbody>
                                <div className="footer-fix">
                                    {/* <div className="navigation-buttons-container navigation-buttons">
                                        <button
                                            className="btn btn-primary edit-button"
                                            onClick={handleEditSubmitToggleMobile}
                                        >
                                            {isEditMode ? 'Submit' : 'Edit'}
                                        </button>
                                    </div> */}
                                </div>
                            </table>
                        ) : (
                            <div className="mobile-user-form" style={{ marginBottom: '80px' }}>
                                {currentUser && (
                                    <div className="user-details">
                                        <div className="user-info">
                                            <img
                                                src={
                                                    currentUser && currentUser.image ? currentUser.image : defaultImage
                                                }
                                                alt="User Image"
                                                className="user-image"
                                                style={{ width: '100%', height: '60%' }}
                                            />
                                            <h5>Recent Photos: </h5>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                                                <button
                                                    onClick={handlePrev}
                                                    style={{ border: 0, backgroundColor: 'white' }}
                                                >
                                                    {'<'}
                                                </button>
                                                <div
                                                    className="image-grid"
                                                    style={{ display: 'flex', overflowX: 'auto', margin: '0 10px' }}
                                                >
                                                    {images.map((image, index) => (
                                                        <img
                                                            key={index}
                                                            src={image}
                                                            alt={`Uploaded ${index}`}
                                                            ref={(el) => (imageRefs.current[index] = el)}
                                                            style={{
                                                                width: '100px',
                                                                height: '100px',
                                                                cursor: 'pointer',
                                                                marginRight: '10px',
                                                                border:
                                                                    currentIndexImage === index
                                                                        ? '2px solid blue'
                                                                        : 'none',
                                                            }}
                                                            onClick={() => handleImageClick(image)}
                                                        />
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={handleNext}
                                                    style={{ border: 0, backgroundColor: 'white' }}
                                                >
                                                    {'>'}
                                                </button>
                                            </div>
                                            <div>
                                                <button
                                                    style={{ marginBottom: 10, marginRight: 10, width: 70 }}
                                                    className="btn btn-primary"
                                                    onClick={() => fileInputRef.current.click()}
                                                >
                                                    Upload
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    style={{ display: 'none' }}
                                                    onChange={handleFileUpload}
                                                    multiple
                                                />
                                                {/* <button
                                                    style={{ marginBottom: 10, width: 70 }}
                                                    onClick={handleSaveImage}
                                                    className="btn btn-primary"
                                                >
                                                    Save
                                                </button> */}
                                            </div>
                                            {/* <div style={{ marginBottom: 20 }}>
                                            </div> */}
                                            <Modal show={showModal} onHide={handleCloseModal}>
                                                <Modal.Body>
                                                    {selectedImage && (
                                                        <img
                                                            src={selectedImage}
                                                            alt="Selected"
                                                            style={{ width: '100%' }}
                                                        />
                                                    )}
                                                </Modal.Body>
                                            </Modal>
                                            <div>
                                                <p>Roll No: {currentUser.rollNo}</p>
                                                <p>Name: {currentUser.fullName}</p>
                                                <p>Citizen Identity: {currentUser.citizenIdentity}</p>
                                                <p>Subject: {currentUser.subjectCode}</p>
                                                <p>
                                                    Note:
                                                    <input
                                                        type="text"
                                                        style={{ width: 250, marginLeft: 10 }}
                                                        value={
                                                            notes[currentIndex] ? notes[currentIndex] : currentUser.note
                                                        }
                                                        onChange={(e) => handleNoteChange(currentIndex, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(currentIndex, e)}
                                                        // disabled={!isEditMode}
                                                    />
                                                </p>
                                                <div className="button-group">
                                                    <button
                                                        className={`btn ${
                                                            currentUser.isCheckin === true
                                                                ? 'btn-danger'
                                                                : 'btn-secondary'
                                                        }`}
                                                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                                                        onClick={() => handleCheckInMobileChange(currentIndex, true)}
                                                        // disabled={!isEditMode}
                                                    >
                                                        Present
                                                    </button>
                                                    <button
                                                        className={`btn ${
                                                            currentUser.isCheckin === false
                                                                ? 'btn-danger'
                                                                : 'btn-secondary'
                                                        }`}
                                                        style={{ fontSize: '12px', fontWeight: 'bold' }}
                                                        onClick={() => handleCheckInMobileChange(currentIndex, false)}
                                                        // disabled={!isEditMode}
                                                    >
                                                        Absent
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Fragment>
    );
};

export default CheckIn;
