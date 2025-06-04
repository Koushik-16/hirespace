import React, { useEffect, useState , useCallback, use } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Box, Button, Typography } from '@mui/material';
import styled from '@emotion/styled';
import { useSocket } from '../context/Socket';
import { useParams } from 'react-router-dom';


const Component = styled.div`
  background: #F5F5F5`;
;

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'], 
  ['blockquote', 'code-block'],
  [{ 'header': 1 }, { 'header': 2 }],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  [{ 'script': 'sub' }, { 'script': 'super' }],
  [{ 'indent': '-1' }, { 'indent': '+1' }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'align': [] }],
  ['clean']
];


const Editor = () => {

    const { socket } = useSocket();
  const { sessionCode } = useParams();
  const [quill, setQuill] = useState();

  useEffect(  () => {
    const quillServer = new Quill('#container', {
      theme: 'snow',
      modules: { toolbar: toolbarOptions }
    });
  
    quillServer.setText('');
    setQuill(quillServer);


  }, []);


   useEffect(() => {
    if (! socket || ! quill) return;

    // Handle changes in the editor
    const handleChange = (delta, oldDelta, source) => {
      if (source === 'user') {
       
        socket.emit('send-changes', {delta , sessionCode});
      }
    };

    quill.on('text-change', handleChange);

    return () => {
      quill.off('text-change', handleChange);
    };
  }, [quill, socket]);

  useEffect(() => {
    if (socket === null || quill === null) return;

    // Listen for changes from the server
    const handleRemoteChange = (delta) => {
        quill.updateContents(delta);
     
    };

    socket.on('receive-changes', handleRemoteChange);

    return () => {
      socket.off('receive-changes', handleRemoteChange);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (! socket || ! quill ) return;

    // Load document
    socket.once('load-document', (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit('get-document', sessionCode);
  }, [quill, socket, sessionCode]);

  useEffect(() => {
    if (socket === null || quill === null) return;

    // Periodic save
    const interval = setInterval(() => {
      socket.emit('save-document', {updates : quill.getContents() , sessionCode});
    }, 2000);

    return () => clearInterval(interval);
  }, [socket, quill]);




  return (
    <Component>
        <Box className="container" id="container"></Box>
      </Component>
  )
}

export default Editor
