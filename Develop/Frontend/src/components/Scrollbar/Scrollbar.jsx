/* src/components/Scrollbar/Scrollbar.jsx */
import React from 'react';
import './Scrollbar.css';

const Scrollbar = ({ children, className = "", style = {} }) => {
  return (
    <div 
      className={`custom-scrollbar-container ${className}`} 
      style={style}
    >
      {children}
    </div>
  );
};

export default Scrollbar;