const jwt = require("jsonwebtoken");
const { 

    saveMessage,
    editMessage,
    deleteMessage

 } = require("./models/messageModel");

 const { deleteServerAndGroups } = require("./controllers/chatController");
 const { deleteGroupById } = require("./models/groupModel");;

module.exports = function (io) {
    // ✅ Middleware: JWT auth
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Not authorized"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            return next(new Error("Token invalid"));
        }
    });

    io.on("connection", (socket) => {

        console.log("✅ User connected:", socket.user.id);
        const wallet_address = socket.user.id;
        socket.on("setup", () => {
            socket.join(wallet_address);
            socket.emit("connected");
        });

        socket.on("join group", (groupId) => {
            socket.join(groupId);
            console.log("Joined group:", groupId);
        });

        socket.on("new message", async (msg) => {            
            const result = await saveMessage(msg.groupId, wallet_address, msg.content, msg.url);
            io.to(msg.groupId).emit("message received", result);
        });

        socket.on("edit message", async (msg) => {            
            const result = await editMessage(msg.groupId, msg.messageId, wallet_address, msg.newContent);
            io.to(msg.groupId).emit("edit", result);
        });

        socket.on("delete message", async (msg) => {            
            const result = await deleteMessage(msg.groupId, msg.messageId, wallet_address);
            io.to(msg.groupId).emit("delete message", result);
        });

        socket.on("delete server", async (msg) => {            
            const result = await deleteServerAndGroups(msg.serverId);
            io.to(msg.groupId).emit("delete server", result);
        });

        socket.on("delete group", async (msg) => {            
            const result = await deleteGroupById(msg.groupId);
            io.to(msg.groupId).emit("delete group", result);
        });

        socket.on("typing", (groupId) => {
            socket.in(groupId).emit("typing", wallet_address);
        });

        socket.on("stop typing", (groupId) => {
            socket.in(groupId).emit("stop typing", wallet_address);
        });

        socket.on("disconnect", () => {
            console.log("❌ Disconnected:", wallet_address);
        });
    });
};
