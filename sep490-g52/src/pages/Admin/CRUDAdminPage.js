import React, { useState, useEffect, Fragment } from 'react';
import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CRUD = () => {
    const [updateShow, setUpdateShow] = useState(false);
    const [detailShow, setDetailShow] = useState(false);
    const [addShow, setAddShow] = useState(false);

    const handleClose = () => setUpdateShow(false);
    const handleShow = () => setUpdateShow(true);

    const handleDetailClose = () => setDetailShow(false);
    const handleDetailShow = () => setDetailShow(true);

    const handleAddClose = () => setAddShow(false);
    const handleAddShow = () => setAddShow(true);

    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [isActive, setIsActive] = useState(0);

    const [editUserID, setEditUserId] = useState('');
    const [editUserName, setEditUserName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editRoleId, setEditRoleId] = useState('');
    const [editIsActive, setEditIsActive] = useState(0);

    const [detailData, setDetailData] = useState({});
    const [data, setData] = useState([]);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        getData();
        getRoles();
    }, []);

    const getData = () => {
        axios
            .get('http://localhost:5020/Admin/ManageUser/GetAllUsers')
            .then((result) => {
                console.log(result.data);
                setData(result.data);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const getRoles = () => {
        axios
            .get('http://localhost:5020/Admin/ManageUser/GetAllRoles')
            .then((result) => {
                console.log(result.data);
                setRoles(result.data);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleEdit = (userId) => {
        handleShow();
        axios
            .get(`http://localhost:5020/Admin/ManageUser/GetUser/${userId}`)
            .then((result) => {
                setEditUserName(result.data.userName);
                setEditEmail(result.data.email);
                setEditPassword(result.data.password);
                setEditRoleId(result.data.roleId);
                setEditIsActive(result.data.isActive ? 1 : 0);
                setEditUserId(userId);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleDelete = (userId) => {
        // eslint-disable-next-line eqeqeq
        if (window.confirm('Are you sure to delete this user') == true) {
            // Log khi yêu cầu xóa được gửi đi
            console.log(`Sending delete request for user with ID: ${userId}`);

            axios
                .delete(`http://localhost:5020/Admin/ManageUser/DeleteUser/${userId}`)
                .then((result) => {
                    // Log khi nhận được phản hồi từ máy chủ
                    console.log('Delete request successful');

                    if (result.status === 500) {
                        toast.success('User has been deleted');
                        getData();
                        handleClose();
                    }
                })
                .catch((error) => {
                    // Log lỗi
                    console.error('Delete request failed', error);

                    toast.error(error);
                });
        }
    };

    const handleDetail = (id) => {
        console.log('Selected ID:', id); // Debug: log the selected ID
        const detail = data.find((item) => item.userId === id);
        console.log('Selected Detail:', detail); // Debug: log the selected detail data
        setDetailData(detail);
        handleDetailShow();
    };

    const handleUpdate1 = () => {
        const url = `http://localhost:5020/Admin/ManageUser/UpdateUser/${editUserID}`;
        const data = {
            userId: editUserID,
            userName: editUserName,
            email: editEmail,
            password: editPassword,
            role: editRoleId,
            isActive: editIsActive === 1,
        };
        axios
            .put(url, data)
            .then((result) => {
                getData();
                clear();
            })
            .catch((error) => {
                toast.error(error);
            });
    };

    const handleUpdate = () => {
        const url = `http://localhost:5020/Admin/ManageUser/UpdateUser/${editUserID}`;
        const data = {
            userId: editUserID,
            userName: editUserName,
            email: editEmail,
            password: editPassword,
            role: editRoleId,
            isActive: editIsActive === 1,
        };
        console.log('Sending data:', data);
        axios
            .put(url, data)
            .then((result) => {
                handleClose();
                getData();
                clear();
                toast.success('User has been updated');
            })
            .catch((error) => {
                console.log('Error:', error.response);
                toast.error(error.response?.data || error.message);
            });
    };

    const handleAdd = () => {
        handleAddShow();
    };

    const handleSave = () => {
        if (!userName || !email || !password || !roleId) {
            toast.error('All fields are required');
            return;
        }
        const url = 'http://localhost:5020/Admin/ManageUser/AddUser';
        const data = {
            userName: userName,
            email: email,
            password: password,
            roleId: roleId,
            isActive: isActive === 1,
        };
        console.log('Sending data:', data);
        axios
            .post(url, data)
            .then((result) => {
                console.log('Response:', result);
                handleClose();
                getData();
                clear();
                toast.success('User has been added');
            })
            .catch((error) => {
                console.log('Error:', error.response);
                toast.error(error.response?.data || error.message);
            });
    };

    const clear = () => {
        setUserName('');
        setEmail('');
        setPassword('');
        setRoleId('');
        setIsActive(0);

        setEditUserName('');
        setEditEmail('');
        setEditPassword('');
        setEditRoleId('');
        setEditIsActive(0);
        setEditUserId('');
    };

    const handleAcitveChange = (e) => {
        if (e.target.checked) {
            setIsActive(1);
        } else {
            setIsActive(0);
        }
    };

    const handleEditAcitveChange = (e) => {
        setEditIsActive(e.target.checked ? 1 : 0);
    };
    const filteredRoles = roles.filter((role) => role.roleName !== 'Admin');
    return (
        <Fragment>
            <ToastContainer />
            <Container>
                <Modal show={addShow} onHide={handleAddClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add new user</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter username"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                />
                            </Col>
                            <Col>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Enter email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Col>
                            <Col>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </Col>
                            <Col>
                                {/* <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter Role"
                                    value={roleId}
                                    onChange={(e) => setRoleId(e.target.value)}
                                /> */}

                                <select
                                    className="form-control"
                                    value={roleId}
                                    onChange={(e) => setRoleId(e.target.value)}
                                >
                                    <option value="">Select Role</option>
                                    {filteredRoles.map((role) => (
                                        <option key={role.roleId} value={role.roleId}>
                                            {role.roleName}
                                        </option>
                                    ))}
                                </select>
                            </Col>
                            <Col>
                                <input
                                    type="checkbox"
                                    checked={isActive == 1 ? true : false}
                                    onChange={(e) => handleAcitveChange(e)}
                                    value={isActive}
                                />
                                <label>IsActive</label>
                            </Col>
                        </Row>
                        <Button variant="secondary" onClick={handleAddClose}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={() => handleSave()}>
                            Add new
                        </Button>
                    </Modal.Body>
                    <Modal.Footer></Modal.Footer>
                </Modal>
                <button
                    style={{
                        float: 'right',
                        marginRight: 50,
                        marginTop: 15,
                        marginBottom: 15,
                        paddingLeft: 70,
                        paddingRight: 70,
                        paddingTop: 10,
                        paddingBottom: 10,
                    }}
                    className="btn btn-primary"
                    onClick={() => handleAdd()}
                >
                    Add new user
                </button>

                {/* <Row style={{ marginBottom: 20 }}>
                    <Col>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter username"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                        />
                    </Col>
                    <Col>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Col>
                    <Col>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Col>
                    <Col>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Role"
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                        />
                    </Col>
                    <Col style={{ paddingTop: 6 }}>
                        <input
                            type="checkbox"
                            checked={isActive == 1 ? true : false}
                            onChange={(e) => handleAcitveChange(e)}
                            value={isActive}
                        />
                        <label style={{ marginLeft: 5 }}>IsActive</label>
                    </Col>
                    <Col style={{ paddingRight: 50 }}>
                        <button className="btn btn-primary" onClick={() => handleSave()}>
                            Add
                        </button>
                    </Col>
                </Row> */}
            </Container>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>isActive</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {data && data.length > 0
                        ? data.map((item, index) => (
                              <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td>{item.userId}</td>
                                  <td>{item.email}</td>
                                  <td>{item.role?.roleName ?? 'N/A'}</td>
                                  <td>{item.isActive ? 1 : 0}</td>
                                  <td colSpan={2}>
                                      <button className="btn btn-primary" onClick={() => handleEdit(item.userId)}>
                                          Edit
                                      </button>{' '}
                                      &nbsp;
                                      <button className="btn btn-primary" onClick={() => handleDelete(item.userId)}>
                                          Delete
                                      </button>
                                      &nbsp;
                                      <button className="btn btn-primary" onClick={() => handleDetail(item.userId)}>
                                          Detail
                                      </button>
                                  </td>
                              </tr>
                          ))
                        : 'No Data...'}
                </tbody>
            </Table>

            <Modal show={updateShow} onHide={handleClose} animation={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Modify / Update User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter username"
                                value={editUserName}
                                onChange={(e) => setEditUserName(e.target.value)}
                            />
                        </Col>
                        <Col>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Enter email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                            />
                        </Col>
                        <Col>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                            />
                        </Col>
                        <Col>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter Role"
                                value={editRoleId}
                                onChange={(e) => setEditRoleId(e.target.value)}
                            />
                        </Col>
                        <Col>
                            <input
                                type="checkbox"
                                checked={editIsActive == 1 ? true : false}
                                onChange={(e) => handleEditAcitveChange(e)}
                                value={editIsActive}
                            />
                            <label>IsActive</label>
                        </Col>
                    </Row>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleUpdate1}>
                        Save Changes
                    </Button>
                </Modal.Body>
                <Modal.Footer></Modal.Footer>
            </Modal>

            <Modal show={detailShow} onHide={handleDetailClose}>
                <Modal.Header closeButton>
                    <Modal.Title>User Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>Username:</strong> {detailData?.userName}
                    </p>
                    <p>
                        <strong>Email:</strong> {detailData?.email}
                    </p>
                    <p>
                        <strong>Password:</strong> {detailData?.password}
                    </p>
                    <p>
                        <strong>Role:</strong> {detailData?.role?.roleName ?? 'N/A'}
                    </p>
                    <p>
                        <strong>IsActive:</strong> {detailData?.isActive ? 'Yes' : 'No'}
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleDetailClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Fragment>
    );
};

export default CRUD;
