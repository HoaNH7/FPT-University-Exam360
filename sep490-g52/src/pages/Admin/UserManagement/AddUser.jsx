import {BACKEND_URL} from '../../../constant';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './userManagerment.scss';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthFetch } from '../../../auth';

const AddUserPage = () => {
    const [email, setEmail] = useState('');
    const [campusId, setCampusId] = useState('');
    const [rolesId, setRolesId] = useState([]);
    const [isActive, setIsActive] = useState(0);
    const [emailError, setEmailError] = useState('');

    const [roles, setRoles] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const navigate = useNavigate();
    const authfetch = useAuthFetch();

    useEffect(() => {
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

    const handleSave = async (e) => {
        e.preventDefault();
        if (!email || !rolesId.length || !campusId) {
            toast.error('All fields are required');
            return;
        }
        const fullEmail = `${email}@fpt.edu.vn`;
        const url = BACKEND_URL + '/Admin/ManageUser/AddUser';

        const data = {
            email: fullEmail,
            campusId: campusId,
            roleId: rolesId,
            isActive: isActive === 1,
        };
        console.log('data: ', data);
        try {
            const response = await authfetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                toast.error('Fail to add new user!');
                return;
            }
            toast.success('User has been added!');
            setTimeout(() => {
                navigate('/admin/usermanagement');
            }, 4000);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleActiveChange = (e) => {
        setIsActive(e.target.checked ? 1 : 0);
    };

    const handleRoleChange = (e) => {
        const roleId = parseInt(e.target.value);
        setRolesId((prevRolesId) =>
            prevRolesId.includes(roleId) ? prevRolesId.filter((id) => id !== roleId) : [...prevRolesId, roleId],
        );
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="container">
                <div className="edit-user-header">
                    <h1>Add User</h1>
                </div>

                <form className="form-adduser" onSubmit={handleSave}>
                    <div className="form-group row">
                        <label className="col-form-label">Roles</label>
                        <div className="col-sm-5">
                            {roles.map((role) => (
                                <div key={role.roleId} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        value={role.roleId}
                                        checked={rolesId.includes(role.roleId)}
                                        onChange={handleRoleChange}
                                    />
                                    <label className="form-check-label">{role.roleName}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-form-label">Campus</label>
                        <div className="col-sm-5">
                            <select
                                className="form-control"
                                value={campusId}
                                onChange={(e) => setCampusId(e.target.value)}
                            >
                                <option value="">Select Campus</option>
                                {campuses.map((campus) => (
                                    <option key={campus.campusId} value={campus.campusId}>
                                        {campus.campusName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-form-label">Login</label>
                        <div className="col-sm-5">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setEmailError('');
                                    }}
                                />
                                <div className="input-group-append">
                                    <span className="input-group-text">@fpt.edu.vn</span>
                                </div>
                            </div>
                            {emailError && <div className="text-danger mt-1">{emailError}</div>}
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-form-label">Is Active</label>
                        <div className="col-sm-5 mb-4">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isActive === 1}
                                onChange={handleActiveChange}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="col-sm-5">
                            <button className="btn btn-primary" type="submit">
                                Create
                            </button>
                        </div>
                    </div>
                </form>
                <Link className="backtolist" to="/admin/usermanagement">
                    Back to List
                </Link>
            </div>
        </Fragment>
    );
};

export default AddUserPage;
