import {BACKEND_URL} from '../../../constant';
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
const DetailExamCode = () => {
    const location = useLocation();
    const { campus } = location.state || {};
    const { id } = useParams();
    const [name, setName] = useState(campus?.name || '');
    const [address, setAddress] = useState(campus?.address || '');
    const [contact, setContact] = useState(campus?.contact || '');
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        getData();
    }, []);
    const getData = () => {
        axios
            .get(BACKEND_URL + `/Admin/ManageCampus/GetCampusById/${id}`)
            .then((response) => {
                const campusData = response.data;
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
    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this examcode?')) {
            axios
                .delete(BACKEND_URL + `/Admin/ManageCampus/DeleteCampus/${id}`)
                .then((response) => {
                    if (response.status === 200) {
                        navigate('/campusmanagement');
                        toast.success('ExamCode has been deleted successfully');
                    } else {
                        toast.error('Failed to delete ExamCode');
                    }
                })
                .catch((error) => {
                    console.error('Delete request failed', error);
                    toast.error('Failed to delete examcode');
                });
        }
    };
    if (isLoading) {
        return <div>No Data...</div>;
    }
    return (
        <div className="container">
            <div className="edit-user-header">
                <h1>Detail Exam Code</h1>
            </div>
            <div className="detail-info">
                <div className="form-group row">
                    <label htmlFor="name" className=" col-form-label">
                        Subject
                    </label>
                    <div className="col-sm-5">
                        <input type="text" readOnly className="form-control" value={name} />
                    </div>
                </div>
                <div className="form-group row">
                    <label htmlFor="address" className=" col-form-label">
                        Exam Code
                    </label>
                    <div className="col-sm-5">
                        <input type="text" readOnly className="form-control" value={address} />
                    </div>
                </div>
                <div className="form-group row">
                    <label htmlFor="contact" className=" col-form-label">
                        Slot
                    </label>
                    <div className="col-sm-5">
                        <input type="text" readOnly className="form-control" value={contact} />
                    </div>
                </div>
                <div className="form-group row">
                    <label htmlFor="contact" className=" col-form-label">
                        Date
                    </label>
                    <div className="col-sm-5">
                        <input type="text" readOnly className="form-control" value={contact} />
                    </div>
                </div>
                <div className="form-group row">
                    <label htmlFor="contact" className=" col-form-label">
                        Note
                    </label>
                    <div className="col-sm-5">
                        <input type="text" readOnly className="form-control" value={contact} />
                    </div>
                </div>
            </div>
            <div style={{ marginLeft: '23px', marginTop: 20 }}>
                <Link to={`/editExamCode/${id}`} state={{ campus }}>
                    Edit
                </Link>{' '}
                <Link onClick={handleDelete}>Delete</Link> <Link to="/examcodemanagement">Back to List</Link>
            </div>
        </div>
    );
};
export default DetailExamCode;
