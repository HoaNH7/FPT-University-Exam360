import React from 'react';

const NotFoundPage = () => {
    return (
        <div className="container text-center my-5">
            <h1 className="display-1">404</h1>
            <h2 className="mb-4">Page Not Found</h2>
            <p className="mb-4">Sorry, the page you are looking for does not exist.</p>
            <a href="../" className="btn btn-primary">Go to Homepage</a>
        </div>
    );
};

export default NotFoundPage;
