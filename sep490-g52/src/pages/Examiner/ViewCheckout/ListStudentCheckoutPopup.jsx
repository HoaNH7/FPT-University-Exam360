import React from 'react';
import './ListStudentCheckoutPopup.scss';

const SimplePopup = ({ room, onClose }) => {
    const defaultImage = 'https://exam360.blob.core.windows.net/exam360/defaultImage.jpg';

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.open();
        printWindow.document.write(`
            <html>
            <head>
                <title>Print Preview</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                    th { background-color: #f4f4f4; }
                    img { width: 100px; height: 100px; }
                    h1, h2 {
                        margin: 0;
                        padding: 0;
                        position: absolute;
                        right: 20px; 
                        top: 20px; 
                        text-align: right;
                    }
                    h1 {
                        font-size: 24px; 
                    }
                    h2 {
                        font-size: 20px; 
                        margin-top: 40px; 
                    }
                    .header-container {
                        position: relative;
                        height: 100px; 
                    }
                    .center-content {
                        text-align: center;
                        margin-top: 120px; 
                    }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <h1>DANH SÁCH SINH VIÊN THI CUỐI KỲ</h1>
                    <h2>LIST OF STUDENT TAKING FINAL EXAM</h2>
                </div>
                <div class="center-content">
                    <h3>Phòng thi/Exam room: ${room.roomName}</h3>
                    <h3>Ngày thi/Exam date: ${room.date}</h3>
                    <h3>Giờ thi/Exam time: ${room.time}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Roll No</th>
                                <th>Citizen Identity</th>
                                <th>Subject Code</th>
                                <th>Is Checkin</th>
                                <th>Checkin Time</th>
                                <th>Is Checkout</th>
                                <th>Checkout Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                room.students.length > 0
                                    ? room.students
                                          .map(
                                              (student, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${student.fullName}</td>
                                <td>${student.email}</td>
                                <td>${student.studentIdNumber}</td>
                                <td>${student.citizenIdentity}</td>
                                <td>${student.subjectCode}</td>
                                <td>${student.isCheckin ? 'Present' : 'Absent'}</td>
                                <td>${student.checkinTime}</td>
                                <td>${student.isCheckout ? 'Checked out' : 'Not Checked out'}</td>
                                <td>${student.isCheckout ? student.checkoutTime || '' : ''}</td>
                            </tr>
                        `,
                                          )
                                          .join('')
                                    : `
                            <tr>
                                <td colspan="11">No students found</td>
                            </tr>
                        `
                            }
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <div className="popup-checkout">
            <div className="popup-inner-checkout">
                <button className="close-btn" onClick={onClose}>
                    Close
                </button>
                <button className="btn btn-primary btn-print" onClick={handlePrint}>
                    Print
                </button>
                <h3>Room: {room.roomName}</h3>
                <h3>Date: {room.date}</h3>
                <h3>Time: {room.time}</h3>
                <table className="student-table-checkout table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Roll No</th>
                            <th>Citizen Identity</th>
                            <th>Subject Code</th>
                            <th>Section</th>
                            <th>Is Checkin</th>
                            <th>Checkin Time</th>
                            <th>Is Checkout</th>
                            <th>Checkout Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {room.students.length > 0 ? (
                            room.students.map((student, index) => (
                                <tr key={student.studentId}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <img
                                            src={student.image || defaultImage}
                                            alt="Student Image"
                                            className="user-image"
                                            style={{ width: '100px', height: '100px' }}
                                        />
                                    </td>
                                    <td>{student.fullName}</td>
                                    <td>{student.email}</td>
                                    <td>{student.studentIdNumber}</td>
                                    <td>{student.citizenIdentity}</td>
                                    <td>{student.subjectCode}</td>
                                    <td>{student.section}</td>
                                    <td>{student.isCheckin ? 'Present' : 'Absent'}</td>
                                    <td>{student.checkinTime}</td>
                                    <td>{student.isCheckout ? 'Checked out' : 'Not Checked out'}</td>
                                    <td>{student.isCheckout ? student.checkoutTime || '' : ''}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="11">No students found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SimplePopup;
