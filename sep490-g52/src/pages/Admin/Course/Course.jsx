import React from 'react';
import { Link } from 'react-router-dom';
import './course.scss';

const Course = () => {
    return (
        <div className="course-top-header">
            <div className="course-text-header">
                <Link className="course-link-header" to="/admin">
                    Home
                </Link>
                <span> > </span>
                <Link className="course-link-header" to="/newsemester">
                    Setup for the new semester
                </Link>
                <span> > Course</span>
            </div>
            <div className="course-top-content">
                <form className="course-form-content">
                    <div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ marginRight: 20 }}>Course Name:</label>
                            <input className="course-input-content" type="text" name="name" />
                            <input
                            className="course-button-content"
                            type="submit"
                            value="Search"
                        />
                        <Link style={{marginLeft: 20}} to="">Add New</Link>
                        <Link style={{marginLeft: 30}} to="">Import Course</Link>
                        </div>
                        <div>
                            <label style={{ marginRight: 42 }}> Subject ID:</label>
                            <select className="course-select-content">
                                <option>--- Choose Subject ---</option>
                                <option>SEP490</option>
                                <option>HCM201</option>
                                <option>MLN131</option>
                                <option>VNR202</option>
                            </select>
                        </div>
                        
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Course;
