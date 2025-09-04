import React, { useState } from 'react';
import { Container, Card, Form, Button, Spinner,Alert } from 'react-bootstrap';
import axios from 'axios';
import { API_URLS } from '../constants/ApiUrls';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [variant, setVariant] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(API_URLS.LOGIN, { email, password });
            // Assuming the API returns { token: '...' }
            const token = response.data.access_token;
            localStorage.setItem('token', token);
            onLogin(token); // update App state
            setVariant('success');
            setMessage('Login successful!');
        } catch (err) {
            // console.error(err);
            // alert(err.response?.data?.message || 'Login failed');
            setMessage(err.response?.data?.message || 'Wrong email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container
            className="d-flex justify-content-center align-items-center"
            style={{ height: '100vh' }}
        >
            <Card style={{ width: '400px', padding: '20px' }}>
                <Card.Body>
                    <h3 className="text-center mb-4">Login</h3>
                    {message && <Alert variant={variant}>{message}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : 'Login'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Login;