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
    const [editRoleId, setEditRoleId] = useState(user?.roles?.map((role) => role.roleId) || []);
    const [editIsActive, setEditIsActive] = useState(user?.isActive || 0);
    console.log(editRoleId);
    const { id } = useParams();
    const [data, setData] = useState([]);
    const [roles, setRoles] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const navigate = useNavigate();
    const filteredRoles = roles.filter((role) => role.roleName !== 'Examiner');
    const authfetch = useAuthFetch();

    useEffect(() => {
        authfetch(BACKEND_URL + '/Admin/ManageUser/GetUserById/' + id)
            .then((res) => setData(res.json()))
            .catch((err) => console.log(err));
        getRoles();
        getCampuses();
    }, []);

    const getRoles = () => {
        authfetch(BACKEND_URL + '/Admin/ManageUser/GetAllRoles')
            .then((res) => res.json())
            .then((result) => {
                setRoles(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const getCampuses = () => {
        authfetch(BACKEND_URL + '/Admin/ManageCampus/GetAllCampuses')
            .then((res) => res.json())
            .then((result) => {
                setCampuses(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleEditActiveChange = (e) => {
        setEditIsActive(e.target.checked ? 1 : 0);
    };

    const handleUpdate = async () => {
        const fullEmail = `${editEmail}@fpt.edu.vn`;
        const updatedUser = {
            userId: editUserId,
            roleId: editRoleId,
            campusId: editCampusId,
            email: fullEmail,
            isActive: editIsActive === 1,
        };
        console.log(updatedUser);
        try {
            const response = await authfetch(BACKEND_URL + `/Admin/ManageUser/UpdateUser/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedUser),
            });
            if (!response.ok) {
                toast.error('Error updating user');
            }
            toast.success('User is updated successfully');
            setTimeout(() => {
                navigate('/admin/usermanagement');
            }, 4000);
        } catch (error) {
            toast.error('Error updating user');
        }
        // .then((response) => {
        //     navigate('/admin/usermanagement');
        //     toast.success('User updated successfully');
        // })
        // .catch((error) => {
        //     toast.error('Error updating user');
        //     console.log(error);
        // });
    };

    const handleRoleChange = (roleId, isChecked) => {
        setEditRoleId((prevRoles) => {
            if (isChecked) {
                return [...prevRoles, roleId];
            } else {
                return prevRoles.filter((role) => role !== roleId);
            }
        });
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
                        <label htmlFor="roleId" className=" col-form-label">
                            Role ID
                        </label>
                        <div className="col-sm-5">
                            {filteredRoles.map((role) => (
                                <div key={role?.roleId} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={editRoleId.includes(role?.roleId)}
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
                                checked={editIsActive == 1 ? true : false}
                                onChange={(e) => handleEditActiveChange(e)}
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
                <Link style={{ marginLeft: '22px' }} to="/admin/usermanagement">
                    Back to List
                </Link>
            </div>
        </Fragment>
    );
};

export default EditUserPage;
