import {BACKEND_URL} from '../../../constant';
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../UserManagement/userManagerment.scss';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthFetch } from '../../../auth';

const DetailCampusPage = () => {
    const location = useLocation();
    const { campus } = location.state || {};
    console.log('this is campus:', campus);
    const { id } = useParams();
    const [name, setName] = useState(campus?.campusName || '');
    console.log('this is name campus', name);
    console.log('tcampus?.campusName :', campus?.campusName);
    const [address, setAddress] = useState(campus?.address || '');
    const [contact, setContact] = useState(campus?.contact || '');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const authfetch = useAuthFetch();

    useEffect(() => {
        getData();
    }, []);

    const getData = () => {
        authfetch(BACKEND_URL + `/Admin/ManageCampus/GetCampusById/${id}`)
            .then((response) => {
                const campusData = response.json();
                setName(campusData.name);
                setAddress(campusData.address);
                setContact(campusData.contact);
                setIsLoading(false);
            })
            .catch((error) => {
                console.log(error);
                setIsLoading(false);
            });
    };

    const handleDelete = async () => {
        // Ask for user confirmation before deleting
        if (window.confirm('Are you sure you want to delete this campus?')) {
            try {
                // Construct the URL for the DELETE request
                const url = BACKEND_URL + `/Admin/ManageCampus/DeleteCampus/${id}`;

                // Use authFetch to send a DELETE request to the specified URL
                const response = await authfetch(url, {
                    method: 'DELETE', // Specify the HTTP method as DELETE
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                // Check if the response status is OK (status code 200-299)
                if (!response.ok) {
                    toast.error('Campus cannot be deleted due to response not OK');
                    console.log('Campus cannot be deleted');
                } else {
                    toast.success('Campus has been deleted');
                    console.log('Campus has been deleted');
                    // Navigate to the campus management page
                    // setTimeout(() => {
                    //     navigate('/admin/campusmanagement');
                    // }, 4000);
                    navigate('/admin/campusmanagement');
                    // Show a success toast message
                }
            } catch (error) {
                // Log the error to the console for debugging purposes
                console.error('Error deleting campus:', error);
                // Show an error toast message in case of an exception
                toast.error('Campus cannot be deleted catch');
            }
        }
    };

    if (isLoading) {
        return <div>No Data...</div>;
    }

    return (
        <div className="container">
            <div className="edit-campus-header">
                <h1>Detail Campus</h1>
            </div>
            <div className="detail-info-campus">
                <div className="form-group-campus row">
                    <label htmlFor="name" className=" col-form-label">
                        Name
                    </label>
                    <div className="col-sm-5">
                        <input type="text" readOnly className="form-control" value={campus?.campusName} />
                    </div>
                </div>
                <div className="form-group-campus row">
                    <label htmlFor="address" className=" col-form-label">
                        Address
                    </label>
                    <div className="col-sm-5">
                        <textarea rows={4} type="text" readOnly className="form-control" value={campus?.address} />
                    </div>
                </div>
                <div className="form-group-campus row">
                    <label htmlFor="contact" className=" col-form-label">
                        Contact
                    </label>
                    <div className="col-sm-5">
                        <input type="text" readOnly className="form-control" value={campus?.contact} />
                    </div>
                </div>
            </div>

            <div className="button-detail-campus">
                <Link to={`/admin/campusmanagement/editCampus/${id}`} state={{ campus }}>
                    Edit
                </Link>{' '}
                <Link onClick={handleDelete}>Delete</Link> <Link to="/admin/campusmanagement">Back to List</Link>
            </div>
        </div>
    );
};

export default DetailCampusPage;
