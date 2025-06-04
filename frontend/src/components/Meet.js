import React, { useEffect, useCallback, useState, useRef, use } from 'react';
import { useSocket } from '../context/Socket';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import peer from '../service/peer';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
} from '@mui/material';
import { useAuthContext } from '../context/AuthContext';

const Meet = () => {
  const { socket } = useSocket();
  const { sessionCode } = useParams();
  const { authUser } = useAuthContext();
  const location = useLocation();
  const isHost = location.state?.isHost || false;
 const navigate = useNavigate();
  const [RemoteUser, setRemoteUser] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [incommingCall, setIncommingCall] = useState(false);
  const [remoteOffer, setRemoteOffer] = useState(null);
  const [streamsSent, setStreamsSent] = useState(false);
  const [called, setCalled] = useState(false);

  const sendStreams = useCallback(() => {
    if (!myStream || !remoteSocketId) return;
    for (const track of myStream.getTracks()) {
       peer.peer.addTrack(track, myStream);
    }
    setStreamsSent(true);
  }, [myStream, remoteSocketId]);


  const handelAcceptCall = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    setMyStream(stream);
    const ans = await peer.getAnswer(remoteOffer);
    socket.emit('call-accepted', { ans, to: remoteSocketId });
    setIncommingCall(false);
    sendStreams();
  }, [socket, remoteSocketId, remoteOffer, sendStreams]);

  const handelcallAccepted = useCallback(async ({ from, ans }) => {
    setRemoteSocketId(from);
    await peer.setLocalDescription(ans);
    sendStreams();
  }, [sendStreams]);

  const handelNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit('peer-nego-needed', { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    const offer = await peer.getOffer();
    socket.emit('user-call', { offer, to: remoteSocketId });
    setMyStream(stream);
    setCalled(true);
  }, [socket, remoteSocketId]);

  const handleNegoNeedIncomming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit('peer-nego-final', { offer: ans, to: from });
  }, [socket]);

  const handleNegoNeedFinal = useCallback(async ({ from, offer }) => {
    await peer.setLocalDescription(offer);
  }, []);

  useEffect(() => {
    // Fallback if state is not passed via navigate()
    const isHost = location?.state?.isHost ?? false;

    // Emit joinSession when component mounts
    if (socket && sessionCode && authUser) {
      socket.emit('joinSession', { code : sessionCode, authUser, isHost , socketId: socket.id });
    }
  }, [socket, sessionCode, authUser ,  location ]);

  useEffect(() => {
    peer.peer.addEventListener('negotiationneeded', handelNegoNeeded);
    return () => {
      peer.peer.removeEventListener('negotiationneeded', handelNegoNeeded);
    };
  }, [handelNegoNeeded]);

  useEffect(() => {
    if (!socket) return;
    socket.on('incomming-call', ({ from, offer }) => {
      setIncommingCall(true);
      setRemoteOffer(offer);
      setRemoteSocketId(from);
    });

    socket.on('call-accepted', handelcallAccepted);
    socket.on('peer-nego-needed', handleNegoNeedIncomming);
    socket.on('peer-nego-final', handleNegoNeedFinal);

    return () => {
      socket.off('incomming-call');
      socket.off('call-accepted');
      socket.off('peer-nego-needed');
      socket.off('peer-nego-final');
    };
  }, [socket, handelcallAccepted, handleNegoNeedIncomming, handleNegoNeedFinal]);

  useEffect(() => {
    peer.peer.addEventListener('track', (event) => {
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream);
    });
    return () => {
      peer.peer.removeEventListener('track',() =>{});
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('user-connected', ({ remoteUser, remoteSocketId }) => {
      setRemoteUser(remoteUser);
      setRemoteSocketId(remoteSocketId);
    });

    return () => {
      socket.off('user-connected');
    };
  }, [socket]);

  useEffect(() => {
    if(!socket) return;
         socket.on('user-left', ({ user }) => {
        setRemoteUser(null);
        setRemoteStream(null);
        setRemoteSocketId(null);
        setStreamsSent(false);
        setRemoteOffer(null);
        setCalled(false);
        alert(`${user?.name} has left the session`);
    });
      return () => {
        socket.off('user-left');
      }
  }, []);

  useEffect(() => {
  if (!socket) return;

  socket.on('session-ended', () => {
    alert('Host ended the session');

    myStream?.getTracks().forEach((track) => track.stop());
    peer.resetPeer();
      setCalled(false);
      setIncommingCall(false);
      setRemoteUser(null);
      setRemoteStream(null);
      setMyStream(null);
      setRemoteSocketId(null);
      setStreamsSent(false);
      setRemoteOffer(null);
      setRemoteUser(null);

    navigate('/', { replace: true });
  });

  return () => {
    socket.off('session-ended');
  };
}, [socket, myStream, navigate]);

  const handleEndSession = async() => {
    try {
    // 1. Stop local media tracks
    myStream?.getTracks().forEach((track) => track.stop());

    // 2. Close the peer connection
    peer.resetPeer();

    // 3. Emit socket event to inform other user
     socket.emit('session-ended', { code: sessionCode });

    // 4. Delete session from server (for host only)
    const data = await axios.post(`/api/interview/sessions/${sessionCode}/delete`,
      {sessionCode }, {withCredentials: true});

    if (data.data.success) {
      // 5. Redirect or cleanup (e.g., to home page)
      setCalled(false);
      setIncommingCall(false);
      setRemoteUser(null);
      setRemoteStream(null);
      setMyStream(null);
      setRemoteSocketId(null);
      setStreamsSent(false);
      setRemoteOffer(null);
      setRemoteUser(null);
      navigate('/' ,{ replace: true });
    } else {
      console.error('Error ending session:', data.data.message);
    }
  } catch (error) {
    console.error('Failed to end session:', error.message);
  }

  };

  const handleLeaveSession = async () => {
    try {
      // Stop local media tracks
      myStream?.getTracks().forEach((track) => track.stop());

      // Close the peer connection
      peer.peer.close();
      peer.resetPeer();

      // Emit socket event to inform other user
      socket.emit('user-left', { code: sessionCode , user : authUser });
      setCalled(false);
      setIncommingCall(false);
      setRemoteUser(null);
      setRemoteStream(null);
      setMyStream(null);
      setRemoteSocketId(null);
      setStreamsSent(false);
      setRemoteOffer(null);
      // Redirect to home page
      navigate('/', { replace: true });
    } catch(error) {
        console.error('Failed to leave session:', error.message);
      }
  };

  // console.log('Remote User:', RemoteUser);

  return (
    <Box p={4} minHeight="100vh" bgcolor="#f5f5f5">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" gutterBottom>Session ID: {sessionCode}</Typography>
        <Typography variant="subtitle1" gutterBottom>
          {RemoteUser ? `Connected to: ${RemoteUser}` : 'Not connected to anyone'}
        </Typography>

        <Grid container spacing={4} mt={2}>
          {myStream && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>My Stream</Typography>
                  <ReactPlayer playing muted height="200px" width="100%" url={myStream} />
                </CardContent>
              </Card>
            </Grid>
          )}

          {remoteStream && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Remote Stream</Typography>
                  <ReactPlayer playing height="200px" width="100%" url={remoteStream} />
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        <Box mt={4} display="flex" gap={2} flexWrap="wrap">
          {RemoteUser && isHost && !called && (
            <Button variant="contained" color="primary" onClick={handleCallUser}>
              Call
            </Button>
          )}

          {myStream && !streamsSent && !isHost && (
            <Button variant="outlined" color="secondary" onClick={sendStreams}>
              Send Stream
            </Button>
          )}

          {incommingCall && (
            <Button variant="contained" color="success" onClick={handelAcceptCall}>
              Accept Call from {RemoteUser}
            </Button>
          )}

          {isHost ? (
            <Button variant="contained" color="error" onClick={handleEndSession}>
              End Session
            </Button>
          ) : (
            <Button variant="contained" color="warning" onClick={handleLeaveSession}>
              Leave Session
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Meet;
