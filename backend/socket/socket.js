import { Server } from "socket.io";
import Session from "../models/session.model.js";
import CodeSnippet from "../models/code.model.js";
import User from "../models/user.model.js";

let io; // Variable to hold the Socket.IO server instance
const userToSocketMap = new Map(); // Map to track user sockets
const socketToUserMap = new Map(); // Map to track socket-user relationships

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // Replace with your frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  


  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinSession", async ({ code, authUser, isHost }) => {
        try {
          let session = await Session.findOne({ sessionCode: code });
        if (!session) {
          socket.emit("joinedSession", { success: false });
          return;
        }
        socket.join(code); // Join the socket to the session room

        if (!session.participants.includes(authUser._id)) {
          session.participants.push(authUser._id);
          await session.save();
         // console.log("User added to session");

        } else {
          //console.log("User already a part of the session");
        }
        
        if(session.participants.length === 2) {

       const host = await User.findById(session.host)
      // console.log("Host User", host._id.toString());
       const otherId = session.participants.filter((id) => id !== session.host.toString());
       const otherUser = await User.findById(otherId).select('-password');
      //console.log("Other User", otherUser);
      const socketsInRoom = await io.in(code).fetchSockets();
    //  console.log("Sockets in room:", socketsInRoom.map(s => s.id));
      const otherSocket = socketsInRoom.find(s => s.id !== socket.id);

       if(authUser._id.toString() === host._id.toString()) {
        socket.broadcast.to(code).emit("user-connected" , {remoteUser : host.username ,  remoteSocketId : socket.id});
        socket.emit("user-connected" , {remoteUser :otherUser.username  , remoteSocketId : otherSocket.id});
       }else {
       
       socket.broadcast.to(code).emit("user-connected" , {remoteUser : otherUser.username ,  remoteSocketId : socket.id});
       socket.emit("user-connected" , {remoteUser :host.username  , remoteSocketId : otherSocket.id});
       }

       }
        
       socket.emit("joinedSession", { success: true, session });

        } catch (error) {
          console.error("Error joining session:", error);
        }
    });



     socket.on('user-call', ({ offer , to }) => {
      console.log("User call to", to);
    io.to(to).emit('incomming-call', { from: socket.id, offer });
  });
  

  socket.on("call-accepted", ({ ans , to }) => {
    io.to(to).emit("call-accepted", { from: socket.id, ans });
  });


  socket.on("peer-nego-needed", ({ offer, to }) => {
    io.to(to).emit("peer-nego-needed", { from: socket.id, offer });
  });


  socket.on("peer-nego-final", ({ offer, to }) => {
    io.to(to).emit("peer-nego-final", { from: socket.id, offer });
  });


  socket.on('session-ended', ({ code }) => {
    // Notify all participants in the room
    io.to(code).emit('session-ended');
    // Optionally remove everyone from the room manually
    io.socketsLeave(code);
    
  });


  socket.on('user-left' , async ({ code , user }) => { 
    console.log(user._id);
    // Optionally remove the user from the session participants
   await Session.findOneAndUpdate({ sessionCode: code }, { $pull: { participants: user._id } })
      .catch(err => console.error(`Error removing user from session: ${err}`));
      socket.broadcast.to(code).emit('user-left', { user });
      socket.leave(code);
  });













    /**
     * Document Handling Logic
     */
    socket.on("get-document", async (sessionCode) => {
      const session = await Session.findOne({ sessionCode });
      const document = await CodeSnippet.findOne({ sessionId: session._id });
      socket.join(sessionCode);

      socket.emit("load-document", document.code);

      socket.on("send-changes", async ({ delta , sessionCode }) => {
        socket.broadcast.to(sessionCode).emit("receive-changes", delta);
      });

      socket.on("save-document", async ({ updates }) => {
        const session = await Session.findOne({ sessionCode });
       if(session) {
        const document = await CodeSnippet.findOne({ sessionId: session._id });
        await CodeSnippet.findByIdAndUpdate(document._id, { code: updates });
      }
      });
    });

   
    /**
     * Disconnect Logic
     */
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
    
  });

  return io;
};

const getSocketInstance = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized. Call initializeSocket first.");
  }
  return io;
};

export { initializeSocket, getSocketInstance };
