import React, { useEffect } from 'react';

const Toast = ({ title, message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast">
            <div className="toast-header">
                <div className="toast-title">{title}</div>
                <button className="toast-close" onClick={onClose}>×</button>
            </div>
            <div className="toast-message">{message}</div>
        </div>
    );
};

export default Toast;
