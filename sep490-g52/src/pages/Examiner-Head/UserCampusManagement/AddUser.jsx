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
    const [roleId, setRoleId] = useState('');
    const [isActive, setIsActive] = useState(0);
    const [emailError, setEmailError] = useState('');

    const [roles, setRoles] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const filteredRoles = roles.filter((role) => role.roleName);
    const navigate = useNavigate();
    const authfetch = useAuthFetch();

    useEffect(() => {
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
                console.log('this is a campus:', result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleSave = async (event) => {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Validate if email, roleId, and campusId are provided; if not, show an error toast and return early
        if (!email || !roleId || !campusId) {
            toast.error('All fields are required');
            return;
        }

        // Construct the full email address by appending the domain
        const fullEmail = `${email}@fpt.edu.vn`;

        // URL for the POST request to add a user
        const url = BACKEND_URL + '/Admin/ManageUser/AddUser';

        // Create the data object to be sent in the request body
        const data = {
            email: fullEmail, // User's email
            campusId: campusId, // Campus ID
            roleId: roleId, // Role ID
            isActive: isActive === 1, // isActive flag based on isActive value
        };

        // Log the data object to the console for debugging
        console.log('data', data);

        try {
            // Use authFetch to send a POST request with the specified URL and options
            const response = await authfetch(url, {
                method: 'POST', // HTTP method
                headers: {
                    'Content-Type': 'application/json', // Set the content type to JSON
                },
                body: JSON.stringify(data), // Convert the data object to a JSON string
            });

            // Check if the response is not OK (status code is not in the 200-299 range)
            if (!response.ok) {
                // Parse the response to JSON to get the error message
                const errorData = await response.json();
                // Throw an error with the message from the response or a default error message
                throw new Error(errorData.message || 'Failed to add user');
            }
            console.log(data);
            toast.success('User has been added successfully');
            setTimeout(() => {
                navigate('/examinerhead/usermanagement');
            }, 4000);
        } catch (error) {
            // Log the error to the console
            console.log('Error:', error);
            // Show an error toast message with the error message
            toast.error(error.message);
        }
    };

    const handleActiveChange = (e) => {
        // if checked value =1 , otherwise value =0
        setIsActive(e.target.checked ? 1 : 0);
    };

    const handleRoleChange = (e) => {
        const roleId = parseInt(e.target.value);
        setRoleId((prevRolesId) =>
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
                        <label className=" col-form-label">Role</label>
                        <div className="col-sm-5">
                            {roles.map((role) => (
                                <div key={role.roleId} className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        value={role.roleId}
                                        checked={roleId.includes(role.roleId)}
                                        onChange={handleRoleChange}
                                    />
                                    <label className="form-check-label">{role.roleName}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className=" col-form-label">Campus</label>
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
                        <label className=" col-form-label">Login</label>
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
                        <label className=" col-form-label">Is Active</label>
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
                <Link className="backtolist" to="/examinerhead/usermanagement">
                    Back to List
                </Link>
            </div>
        </Fragment>
    );
};

export default AddUserPage;
