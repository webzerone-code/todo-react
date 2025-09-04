import React, { useState } from 'react';
import Kanban from './Components/Kanban'; // your Kanban component
import Login from './Components/Login';   // login form component

function App() {
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    const handleLogin = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    return token ? (
        <Kanban onLogout={handleLogout} />
    ) : (
        <Login onLogin={handleLogin} />
    );
}

export default App;