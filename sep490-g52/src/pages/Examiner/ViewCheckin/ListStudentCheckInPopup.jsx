import React from 'react';
const defaultImage = '/default-avatar.jpg';
const ListStudentCheckIn = ({ room, onClose }) => {
    // Check if room and room.students are defined
    const hasStudents = room && room.length > 0;

    return (
        <div className="popup">
            <div className="popup-inner">
                <button className="close-btn" onClick={onClose}>
                    Close
                </button>
                <h2>Room: {room?.roomName}</h2>
                <h3>Date: {room?.date}</h3>
                <h3>Time: {room?.time}</h3>
                <table className="student-table table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Image</th>
                            <th>Full Name</th>
                            <th>Roll No</th>
                            <th>Citizen Identity</th>
                            <th>Subject Code</th>
                            <th>Is Checkin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hasStudents ? (
                            room.map((students, index) => (
                                <tr key={students.studentId}>
                                    <td data-title="No">{index + 1}</td>
                                    <td data-title="Image">
                                        <img
                                            src={students && students.image ? students.image : defaultImage}
                                            alt="User Image"
                                            className="user-image"
                                            style={{ width: '100px', height: '100px' }}
                                        />
                                    </td>
                                    <td data-title="Full Name">{students.fullName}</td>
                                    <td data-title="Email">{students.rollNo}</td>
                                    <td data-title="Citizen Identity">{students.citizenIdentity}</td>
                                    <td data-title="Subject Code">{students.subjectCode}</td>
                                    <td data-title="Is Checkin">{students.isCheckin ? 'Present' : 'Absent'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">No students found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListStudentCheckIn;
