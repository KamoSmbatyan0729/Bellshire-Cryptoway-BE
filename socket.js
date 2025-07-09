const jwt = require("jsonwebtoken");
const { saveMessage, editMessage, deleteMessage } = require("./models/messageModel");
const { saveDmMessage, editDMMessage, deleteDMMessage, deleteContact } = require("./models/dmChatModel");

const { deleteServer } = require("./controllers/serverController");
const { deleteGroupWithMessages } = require("./models/groupModel");
const { leaveServer } = require("./models/serverModel");

function getDmId(user1, user2) {
    return [user1, user2].join('_');
}

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

        socket.on("join server", (serverId) => {
            socket.join(serverId);
            console.log("Joined server:", serverId);
        });

        socket.on("new message", async (msg) => {
            const result = await saveMessage(msg.messageId, msg.groupId, wallet_address, msg.content, null);
            io.to(msg.serverId).emit("message received", result);
        });

        socket.on("edit message", async (msg) => {
            const result = await editMessage(msg.groupId, msg.messageId, wallet_address, msg.newContent);
            io.to(msg.serverId).emit("edit message", result);
        });

        socket.on("delete message", async (msg) => {
            const result = await deleteMessage(msg.groupId, msg.messageId, wallet_address);
            io.to(msg.serverId).emit("delete message", result);
        });

        socket.on("delete server", async (msg) => {
            const result = await deleteServer(msg.serverId, wallet_address);
            io.to(msg.serverId).emit("delete server", result);
        });

        socket.on("leave server", async (msg) => {
            const result = await leaveServer(msg.serverId, wallet_address);
            io.to(msg.serverId).emit("leave server", result);
        });

        socket.on("delete group", async (msg) => {
            const result = await deleteGroupWithMessages(msg.groupId, msg.serverId);
            io.to(msg.serverId).emit("delete group", result);
        });

        socket.on("typing", (serverId) => {
            socket.in(serverId).emit("typing", wallet_address);
        });

        socket.on("stop typing", (serverId) => {
            socket.in(serverId).emit("stop typing", wallet_address);
        });

        //----------------------DM---------------------------------------//
        socket.on("dm setup", () => {
            socket.join(wallet_address);
            socket.emit("dm connected");
        });

        socket.on("join contact", (contact) => {
            const dmId = getDmId(contact.wallet_address, contact.contact_wallet);
            socket.join(dmId);
        });

        socket.on("new dm message", async (msg) => {
            const dmId = getDmId(msg.contact.wallet_address, msg.contact.contact_wallet);
            const result = await saveDmMessage(msg.messageId, msg.contact.wallet_address, msg.contact.contact_wallet, wallet_address, msg.content, null);
            console.log("result", result)
            io.to(dmId).emit("message dm received", result);
        });

        socket.on("edit dm message", async (msg) => {
            const dmId = getDmId(msg.contact.wallet_address, msg.contact.contact_wallet);
            const result = await editDMMessage(dmId, msg.messageId, wallet_address, msg.newContent);
            io.to(dmId).emit("edit dm message", result);
        });

        socket.on("delete dm message", async (msg) => {
            const dmId = getDmId(msg.contact.wallet_address, msg.contact.contact_wallet);
            const result = await deleteDMMessage(dmId, msg.messageId, wallet_address);
            io.to(dmId).emit("delete dm message", result);
        });

        socket.on("delete contact", async (msg) => {
            const dmId = getDmId(msg.contact.wallet_address, msg.contact.contact_wallet);
            const result = await deleteContact(msg.contact, wallet_address);
            console.log(dmId)
            io.to(dmId).emit("delete contact", result);
        });

        socket.on("dm typing", (msg) => {
            const dmId = getDmId(msg.contact.wallet_address, msg.contact.contact_wallet);
            socket.in(dmId).emit("dm typing", wallet_address);
        });

        socket.on("stop dm typing", (msg) => {
            const dmId = getDmId(msg.contact.wallet_address, msg.contact.contact_wallet);
            socket.in(dmId).emit("stop dm typing", wallet_address);
        });

        socket.on("disconnect", () => {
            console.log("❌ Disconnected:", wallet_address);
        });
    });
};
