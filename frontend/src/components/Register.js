import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import {useAuthContext} from "../context/AuthContext"

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuthUser } = useAuthContext();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;

    }

    try {
      const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, email, password }),
				credentials : 'include',
			});

			const data = await res.json();
      console.log(data);
			if (data.error) {
				throw new Error(data.error);
			}
			localStorage.setItem("hireSpace_token", JSON.stringify(data));
			setAuthUser(data);
      navigate("/");
     
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 4, width: 400, margin: '50px auto' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Register
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Box component="form" onSubmit={handleRegister}>
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
          required
        />
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
        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          required
        />
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Register
        </Button>
        <Typography align="center" sx={{ mt: 2 }}>
          Already have an account? <Link to="/login">login</Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default Register;
