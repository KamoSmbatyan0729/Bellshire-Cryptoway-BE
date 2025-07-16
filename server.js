const express = require("express");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const serverRoutes = require("./routes/serverRoutes");
const groupRoutes = require("./routes/groupRoutes");
const messageRoutes = require("./routes/messageRoutes");
const dmChatRoutes = require("./routes/dmChatRoutes");
const uploadRoutes = require('./routes/uploadRoutes');
const http = require("http");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
require('./service/cronjob');

dotenv.config();
const app = express();

const cors = require('cors');
app.use(cors());
app.use(express.json()); // to accept json data

// app.get("/", (req, res) => {
//   res.send("API Running!");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", serverRoutes);
app.use("/api/chat/group", groupRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/chat/dm", dmChatRoutes);    // dm + friends
// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use('/api', uploadRoutes);

// --------------------------deployment------------------------------

app.get('/files/:filename/:originalName', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filePath, req.params.originalName); // <-- automatically sets Content-Disposition
});

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

// Create socket.io server
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*", // or frontend URL
    methods: ["GET", "POST"],
  },
});

// ✅ Pass `io` to your socket logic
require("./socket")(io); // this runs the exported function from socket.js

// Start listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
