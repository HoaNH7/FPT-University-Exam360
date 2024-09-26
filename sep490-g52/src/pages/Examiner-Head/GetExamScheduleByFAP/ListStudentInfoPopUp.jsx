import React from 'react';
import './ListStudentInfoPopup.scss';

const ListStudentInfo = ({ room, onClose }) => {
    const defaultImage = '/default-avatar.jpg';
    return (
        <div className="popup">
            <div className="popup-inner">
                <button className="close-btn" onClick={onClose}>
                    Close
                </button>
                <h2>Room {room.examRoomId}</h2>
                {/* <h3 className="proctor-email">Proctor: {room.proctor.email}</h3> */}
                <table className="student-table table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Image</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Student ID Card</th>
                            <th>Citizen Identity</th>
                            <th>Subject Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        {room.studentRoomSubjects.map((studentSubject, index) => (
                            <tr key={studentSubject.studentId}>
                                <td data-title="No">{index + 1}</td>
                                <td>
                                    <img
                                        src={
                                            studentSubject.student && studentSubject.student.avatar
                                                ? studentSubject.student.avatar
                                                : defaultImage
                                        }
                                        alt="User Image"
                                        className="user-image"
                                        style={{ width: '100px', height: '100px' }}
                                    />{' '}
                                </td>
                                <td data-title="Full Name">{studentSubject.student.fullName}</td>
                                <td data-title="Email">{studentSubject.student.email}</td>
                                <td data-title="Student Id Card">{studentSubject.student.studentIdNumber}</td>
                                <td data-title="Citizen Identity">{studentSubject.student.citizenIdentity}</td>
                                <td data-title="Subject Code">{studentSubject.subject.subjectCode}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListStudentInfo;
