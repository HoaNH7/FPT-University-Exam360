import {BACKEND_URL} from '../../../constant';
import './userManagerment.scss';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthFetch } from '../../../auth';

const EditUserPage = () => {
    const location = useLocation();
    const { user } = location.state || {};

    const initialEmail = user?.email ? user.email.replace('@fpt.edu.vn', '') : '';
    const [editUserId, setEditUserId] = useState(user?.userId || '');
    const [editCampusId, setEditCampusId] = useState(user?.campus?.campusId || '');
    const [editEmail, setEditEmail] = useState(initialEmail);
    const [editRoles, setEditRoles] = useState(user?.roles?.map((role) => role.roleId) || []);
    const [editIsActive, setEditIsActive] = useState(user?.isActive || 0);
    console.log(editRoles);
    const { id } = useParams();
    const [data, setData] = useState([]);
    const [roles, setRoles] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const navigate = useNavigate();
    const filteredRoles = roles.filter((role) => role.roleName);
    const authfetch = useAuthFetch(0);

    useEffect(() => {
        authfetch(BACKEND_URL + '/api/ManageCampusUser/GetUserById/' + id)
            .then((res) => res.json())
            .then((data) => setData(data))
            .catch((err) => console.log(err));
        getRoles();
        getCampuses();
    }, []);

    const getRoles = () => {
        authfetch(BACKEND_URL + '/api/ManageCampusUser/GetRolesManageByEH')
            .then((res) => res.json())
            .then((result) => {
                setRoles(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const getCampuses = () => {
        authfetch(BACKEND_URL + '/api/ManageCampusUser/GetOnlyCampusByExaminerHead')
            .then((res) => res.json())
            .then((result) => {
                setCampuses([result]);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleEditActiveChange = (e) => {
        setEditIsActive(e.target.checked ? 1 : 0);
    };

    const handleRoleChange = (roleId, isChecked) => {
        setEditRoles((prevRoles) => {
            if (isChecked) {
                return [...prevRoles, roleId];
            } else {
                return prevRoles.filter((role) => role !== roleId);
            }
        });
    };

    const handleUpdate = async () => {
        const fullEmail = `${editEmail}@fpt.edu.vn`;
        const updatedUser = {
            userId: editUserId,
            roleId: editRoles,
            campusId: editCampusId,
            email: fullEmail,
            isActive: editIsActive === 1,
        };
        console.log('update: ', updatedUser);
        try {
            const response = await authfetch(BACKEND_URL + `/api/ManageCampusUser/UpdateCampusUser/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedUser), // convert update user  object to json
            });
            if (!response.ok) {
                // Parse the response to JSON to get the error message
                const errorData = await response.json();
                // Throw an error with the message from the response or a default error message
                throw new Error(errorData.message || 'Failed to add user');
            }
            navigate('/examinerhead/usermanagement');
            toast.success('User updated successfully');
        } catch (error) {
            console.log(error);
            toast.error('User can not be updated !');
        }
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="container">
                <div className="edit-user-header">
                    <h1>Edit User</h1>
                </div>
                <form className="form-edituser">
                    <div className="form-group row">
                        <label htmlFor="roles" className="col-form-label">
                            Roles
                        </label>
                        <div className="col-sm-5">
                            {filteredRoles.map((role) => (
                                <div key={role?.roleId} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={editRoles.includes(role?.roleId)}
                                        onChange={(e) => handleRoleChange(role?.roleId, e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor={`role-${role?.roleId}`}>
                                        {role?.roleName}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="form-group row">
                        <label htmlFor="campusId" className=" col-form-label">
                            Campus
                        </label>
                        <div className="col-sm-5">
                            <select
                                id="campusId"
                                className="form-control"
                                value={editCampusId}
                                onChange={(e) => setEditCampusId(e.target.value)}
                            >
                                <option>Select Campus</option>
                                {campuses.map((campus) => (
                                    <option key={campus?.campusId} value={campus?.campusId}>
                                        {campus?.campusName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group row">
                        <label htmlFor="login" className=" col-form-label">
                            Login
                        </label>
                        <div className="col-sm-5">
                            <div className="input-group">
                                <input
                                    type="email"
                                    className="form-control"
                                    id="login"
                                    placeholder="Enter email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                                <div className="input-group-append">
                                    <span className="input-group-text">@fpt.edu.vn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <label htmlFor="isActive" className=" col-form-label">
                            Is Active
                        </label>
                        <div className="col-sm-5 mb-4">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="isActive"
                                checked={editIsActive == 1}
                                onChange={handleEditActiveChange}
                                value={editIsActive}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="col-sm-5">
                            <button className="btn btn-primary" onClick={handleUpdate} type="button">
                                Save
                            </button>
                        </div>
                    </div>
                </form>
                <Link style={{ marginLeft: '22px' }} to="/examinerhead/usermanagement">
                    Back to List
                </Link>
            </div>
        </Fragment>
    );
};

export default EditUserPage;
