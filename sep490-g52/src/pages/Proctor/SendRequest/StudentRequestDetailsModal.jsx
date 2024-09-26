import React from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import './StudentRequestDetailsModal.scss';

const StudentRequestDetailsModal = ({ show, onHide, rollNo, startTime, endTime, room, requests }) => {
    const firstRequest = requests[0] || {};

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending':
                return 'status-pending';
            case 'resolved':
                return 'status-resolved';
            case 'rejected':
                return 'status-rejected';
            default:
                return '';
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" className="student-details-modal">
            <Modal.Header closeButton>
                <Modal.Title>Student Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    <strong>Full Name:</strong> {firstRequest.fullName || 'N/A'}
                </p>
                <p>
                    <strong>Roll No:</strong> {rollNo}
                </p>
                <p>
                    <strong>Subject Code:</strong> {firstRequest.subjectCode || 'N/A'}
                </p>
                <h5>All Student Requests:</h5>
                <Table className="request-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Resolve Status</th>
                            <th>Request Date</th>
                            <th>Request Handler</th>
                            <th>Resolve Date</th>
                            <th>My Note</th>
                            <th>Handler's Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, index) => (
                            <tr key={index}>
                                <td data-title="Request Title :">{request.requestTitle}</td>
                                <td data-title="Status :">
                                    <span className={`status-text ${getStatusClass(request.resolveStatus)}`}>
                                        {request.resolveStatus}
                                    </span>
                                </td>
                                <td data-title="Request Date :">{new Date(request.requestDate).toLocaleString()}</td>
                                <td data-title="Request Handler : ">{request.requestHandlerEmail}</td>
                                <td data-title="Resolve Date :">{request.resolveDate}</td>
                                <td data-title="My Note :">{request.note}</td>
                                <td data-title="Handler's Note">{request.responseNote}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default StudentRequestDetailsModal;
