import React from 'react';
import { Link } from 'react-router-dom';
import './newsemester.scss';

const NewSemester = () => {
    return (
        <div className="semester-top-header">
            <div className="semester-text-header">
                <Link className="semester-link-header" to="/admin">
                    Home
                </Link>
                <span style={{ fontSize: 14 }}> > Setup for the new semester</span>
            </div>
            <div className="semester-top-content">Setup for the new semester</div>
            <ul className="semester-ul-content">
                <li className="semester-li-content">
                    <Link className="semester-link-content" to="">
                        Semesters management
                    </Link>
                </li>
                <li className="semester-li-content">
                    <Link className="semester-link-content" to="">
                        Subjects management
                    </Link>
                </li>
                <li className="semester-li-content">
                    <Link className="semester-link-content" to="">
                        Specialization management
                    </Link>
                </li>
                <li className="semester-li-content">
                    <Link className="semester-link-content" to="/course">
                        Courses management
                    </Link>
                </li>
                <li className="semester-li-content">
                    <Link className="semester-link-content" to="">
                        Students management
                    </Link>
                </li>
                <li className="semester-li-content">
                    <Link className="semester-link-content" to="">
                        Courses Deadline management
                    </Link>
                </li>
                <li className="semester-li-content">
                    <Link className="semester-link-content" to="">
                        Messages management
                    </Link>
                </li>
                <li className="semester-li-content">
                    <Link className="semester-link-content" to="">
                        Validity Check
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default NewSemester;
