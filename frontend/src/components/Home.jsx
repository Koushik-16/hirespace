import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  Container,
  Grid,
  TextField,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useSocket } from '../context/Socket';

const HomePage = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const { socket } = useSocket();

  const handleCreateInterview = async () => {
    try {
      const response = await axios.post(
        '/api/interview/sessions',
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        const code = response.data.code;
      //  socket.emit('joinSession', { code, authUser });
        navigate(`/interview/sessions/${code}`, { state: { isHost: true } });
      } else {
        setError('Failed to create interview session. Please try again.');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleJoinInterview = async () => {
    try {
      const response = await axios.post(
        `/api/interview/sessions/${sessionCode}`,
        { sessionCode },
        { withCredentials: true }
      );

      if (response.data.success) {
        // socket.emit('joinSession', { code: sessionCode, authUser });
        navigate(`/interview/sessions/${sessionCode}`, {
          state: { isHost: false },
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      localStorage.removeItem('hireSpace_token');
      setAuthUser(null);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={3}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            HireSpace
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Grid container spacing={4} justifyContent="center">
          {/* Create Interview */}
          <Grid item xs={12} sm={10} md={6}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Create a New Interview
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Instantly start a session and invite your candidate.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleCreateInterview}
              >
                Create Interview
              </Button>
            </Paper>
          </Grid>

          {/* Join Interview */}
          <Grid item xs={12} sm={10} md={6}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Join an Interview
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Enter your interview code to join the session.
              </Typography>
              <TextField
                label="Interview Code"
                variant="outlined"
                fullWidth
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                sx={{ mb: 2 }}
              />
              {error && (
                <Typography color="error" mb={2}>
                  {error}
                </Typography>
              )}
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                size="large"
                onClick={handleJoinInterview}
              >
                Join Interview
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage;
