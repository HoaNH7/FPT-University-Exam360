import {BACKEND_URL} from '../../../constant';
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './userManagerment.scss';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthFetch } from '../../../auth';

const DetailUserPage = () => {
    const location = useLocation();
    const { user } = location.state || {};

    const { id } = useParams();
    const [user1, setUser] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const authfetch = useAuthFetch();

    useEffect(() => {
        authfetch(BACKEND_URL + `/api/ManageCampusUser/GetUserById/${id}`)
            .then((res) => res.json())
            .then((response) => {
                setUser(response);
                setIsLoading(false);
            })
            .catch((error) => {
                console.log(error);
                setIsLoading(false);
            });
    }, [id]);

    const handleDelete = async (userId) => {
        // ask for user confirmation before deleting
        if (window.confirm('Are you sure to delete this user')) {
            try {
                // use authfetch to send a delete request
                const response = await authfetch(
                    BACKEND_URL + `/api/ManageCampusUser/DeleteCampusUser/${userId}`,
                    {
                        method: 'DELETE', // specify the HTTP method as DELETE
                    },
                );
                // check if reponse
                if (response.status === 200) {
                    // navigate to the user manage page
                    navigate('/examinerhead/usermanagement');
                    //show a success toast message
                    toast.success('User has been deleted');
                } else {
                    toast.error('Failed to delete user');
                }
            } catch (error) {
                console.error('Delete request failed', error);
                toast.error('Failed to delete user');
            }
        }
    };

    if (isLoading) {
        return <div>No Data...</div>;
    }

    return (
        <div className="container">
            <div className="edit-user-header">
                <h1>Detail User</h1>
            </div>
            <div className="detail-info">
                <div className="form-group row">
                    <label htmlFor="login" className=" col-form-label">
                        Login
                    </label>
                    <div className="col-sm-5">
                        <div className="input-group">
                            <input type="email" readOnly className="form-control" value={user?.email} />
                            {/* <div className="input-group-append">
                                <span className="input-group-text">@fpt.edu.vn</span>
                            </div> */}
                        </div>
                    </div>
                </div>

                <div className="form-group row">
                    <label className=" col-form-label">Campus</label>
                    <div className="col-sm-5">
                        <input type="text" readOnly className="form-control" value={user?.campus?.campusName} />
                    </div>
                </div>
                <div className="form-group row">
                    <label className=" col-form-label">Role</label>
                    <div className="col-sm-5">
                        <input
                            type="text"
                            readOnly
                            className="form-control"
                            value={user?.roles?.map((role) => role.roleName)}
                        />
                    </div>
                </div>
                <div className="form-group row">
                    <label htmlFor="isActive" className=" col-form-label">
                        Is Active
                    </label>
                    <div className="col-sm-5">
                        <input type="checkbox" disabled className="form-check-input" checked={user?.isActive} />
                    </div>
                </div>
            </div>

            <div style={{ marginLeft: '23px', marginTop: 20 }}>
                <Link to={`/examinerhead/usermanagement/editUser/${id}`} state={{ user }}>
                    Edit
                </Link>{' '}
                <Link style={{ border: 0, backgroundColor: 'white' }} onClick={() => handleDelete(id)}>
                    Delete
                </Link>{' '}
                <Link to="/examinerhead/usermanagement">Back to List</Link>
            </div>
        </div>
    );
};

export default DetailUserPage;
