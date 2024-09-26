import {BACKEND_URL} from '../../../constant';
import React, { Fragment, useEffect, useState } from 'react';
import './SendNotification.scss';
import { useAuthFetch } from '../../../auth';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useCurrentUserInfo } from '../../../auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const SendNotification = () => {
    const [data, setData] = useState([]);
    const authfetch = useAuthFetch();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const user = useCurrentUserInfo();
    const [deleteId, setDeleteId] = useState(null);
    const [updateId, setUpdateId] = useState(null);
    const [updateTitle, setUpdateTitle] = useState('');
    const [updateContent, setUpdateContent] = useState('');
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    useEffect(() => {
        getData();
    }, []);

    const getData = () => {
        authfetch(BACKEND_URL + '/Examiner/MakeCommonNotice/GetAllNotices')
            .then((res) => res.json())
            .then((rs) => {
                const sortedData = rs.sort((a, b) => new Date(b.sendTime) - new Date(a.sendTime));
                setData(sortedData);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleSend = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('Please enter both title and content');
            return;
        }

        const sendToData = {
            senderId: user.userId,
            title: title.trim(),
            content: content.trim(),
        };
        console.log(sendToData);
        try {
            const res = await authfetch(BACKEND_URL + '/Examiner/MakeCommonNotice/AddNotice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sendToData),
            });
            const contentType = res.headers.get('content-type');
            let responseData;

            if (contentType && contentType.indexOf('application/json') !== -1) {
                responseData = await res.json();
            } else {
                responseData = await res.text();
            }

            if (!res.ok) {
                throw new Error(responseData.message || responseData || 'Server error');
            }

            if (responseData.success) {
                toast.error('Failed to send notification');
            } else {
                toast.success('send notification successfully');
                getData();
                setTitle('');
                setContent('');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`An error occurred while send notification: ${error.message}`);
        }
    };

    const handleDelete = async () => {
        try {
            const url = BACKEND_URL + `/Examiner/MakeCommonNotice/DeleteNotice/${deleteId}`;
            const response = await authfetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to delete Notice');
            } else {
                toast.success('Notice deleted successfully!');
            }

            setShowConfirmDelete(false);
            setDeleteId(null);

            const updatedData = data.filter((item) => item.commonNoticeId !== deleteId);
            setData(updatedData);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete Notice!');
        }
    };

    const handleConfirmDelete = (deleteId) => {
        setDeleteId(deleteId);
        setShowConfirmDelete(true);
    };
    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
        setDeleteId(null);
    };

    const handleUpdate = async () => {
        if (!updateId || !updateTitle.trim() || !updateContent.trim()) {
            toast.error('Please enter both title and content');
            return;
        }

        const updatedData = {
            senderId: user.userId,
            title: updateTitle.trim(),
            content: updateContent.trim(),
        };

        console.log(updatedData);

        const url = BACKEND_URL + `/Examiner/MakeCommonNotice/UpdateNotice/${updateId}`;
        try {
            const response = await authfetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error('Failed to update notice');
            }

            toast.success('Notification updated successfully!');
            getData(); // Refresh the list of notices
            setUpdateTitle(''); // Clear input fields
            setUpdateContent('');
            setUpdateId(null);
            setShowUpdateModal(false); // Close the update modal
        } catch (error) {
            console.error(error);
            toast.error(`Failed to update notification: ${error.message}`);
        }
    };

    const handleEditClick = (id, title, content) => {
        setUpdateId(id);
        setUpdateTitle(title);
        setUpdateContent(content);
        setShowUpdateModal(true);
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="send-notification">
                <h1>Send Notification</h1>
                <div className="input-title-group">
                    <input
                        type="text"
                        placeholder="Enter Your Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                        rows={5}
                        placeholder="Enter your Content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <button onClick={handleSend}>Send</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Title</th>
                            <th>Content</th>
                            <th>Sender</th>
                            <th>Send Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((note, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td
                                    style={{ cursor: 'pointer', color: 'blue' }}
                                    onClick={() => handleEditClick(note.commonNoticeId, note.title, note.content)}
                                >
                                    {note.title}
                                </td>
                                <td>{note.content}</td>
                                <td>{note.email}</td>
                                <td>{note.sendTime}</td>
                                <td data-title="Action">
                                    <FontAwesomeIcon
                                        icon={faTrash}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleConfirmDelete(note.commonNoticeId)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Modal show={showConfirmDelete} onHide={handleCancelDelete}>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm Delete</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>Are you sure you want to delete this notice?</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCancelDelete}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                            Delete
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Update Notice</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group controlId="formTitle">
                                <Form.Label>Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={updateTitle}
                                    onChange={(e) => setUpdateTitle(e.target.value)}
                                    placeholder="Enter the updated title"
                                />
                            </Form.Group>
                            <Form.Group controlId="formContent">
                                <Form.Label>Content</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={updateContent}
                                    onChange={(e) => setUpdateContent(e.target.value)}
                                    placeholder="Enter the updated content"
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleUpdate}>
                            Update
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </Fragment>
    );
};

export default SendNotification;
