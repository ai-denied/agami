import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './pages/Navbar'; 
import Home from './pages/Home'; 
import Login from './pages/Login'; 
import Price from './pages/Price';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navbar /> 
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/price" element={<Price />} />
        </Routes>

      </Router>
    </ThemeProvider>
  );
}

export default App;