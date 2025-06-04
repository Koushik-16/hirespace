import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import image from '../assets/image.jpeg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuthUser } = useAuthContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      localStorage.setItem("hireSpace_token", JSON.stringify(data));
      setAuthUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        '::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay
          backdropFilter: 'blur(8px)', // Blur effect
          zIndex: 1,
        },
      }}
    >
      {/* Content Wrapper */}
      <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            color: '#fff',
            textShadow: '2px 2px 6px rgba(0,0,0,0.7)',
            mb: 4,
          }}
        >
          Welcome to HireSpace
        </Typography>

        <Paper
          elevation={6}
          sx={{
            padding: 4,
            width: 400,
            maxWidth: '100%',
            backdropFilter: 'blur(2px)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            mx: 'auto',
          }}
        >
          <Typography variant="h5" align="center" gutterBottom>
            Login
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
              Login
            </Button>
            <Typography align="center" sx={{ mt: 2 }}>
              Don't have an account? <Link to="/register">register</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
