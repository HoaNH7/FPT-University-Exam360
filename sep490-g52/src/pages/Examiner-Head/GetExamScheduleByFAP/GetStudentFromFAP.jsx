import {BACKEND_URL} from '../../../constant';
import React, { useState, useEffect } from 'react';

const GetStudentFromFAP = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(BACKEND_URL + '/api/Exam/get-all-students-fee?campusCode=APHL');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStudents(data.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading data: {error}</p>;

  return (
    <div>
      <h1>Student Fees</h1>
      <table>
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Full Name</th>
            <th>Member Code</th>
            <th>Email</th>
            <th>Avatar</th>
            <th>Major</th>
            <th>Current Term</th>
            <th>Specialization</th>
            <th>Status</th>
            <th>Scholarship</th>
            <th>Graduation Decision Date</th>
            <th>Internship Decision Date</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.rollNumber}>
              <td>{student.rollNumber}</td>
              <td>{student.fullname}</td>
              <td>{student.memberCode}</td>
              <td>{student.email}</td>
              <td>
                <img src={student.avarta} alt={student.fullname} width="50" />
              </td>
              <td>{student.nganh}</td>
              <td>{student.currentTermNo}</td>
              <td>{student.chuyenNganh}</td>
              <td>{student.statusCode}</td>
              <td>{student.mucHocbong}</td>
              <td>{student.date_QD_TN}</td>
              <td>{student.date_QD_TH}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GetStudentFromFAP;
