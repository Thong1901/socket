const { Server } = require("socket.io");

const io = new Server({ cors: "https://chat-alpha-navy.vercel.app" });
let onlineUsers = []

io.on("connection", (socket) => {
    console.log("new connection", socket.id);
    //listen to a connection
    socket.on("addNewUser", (userId) => {
        !onlineUsers.some((user) => user.userId === userId) &&
            onlineUsers.push({
                userId,
                socketId: socket.id,
            });
        console.log("onlineUsers", onlineUsers);

        io.emit("getOnlineUsers", onlineUsers);
    });
    // add message
    socket.on("sendMessage", (message) => {
        const user = onlineUsers.find((user) => user.userId === message.recipientId);
        if (user) {
            io.to(user.socketId).emit("getMessage", message);
            io.to(user.socketId).emit("getNotification", {
                senderId: message.senderId,
                isRead: false,
                date: new Date(),
            });
        }
    });
    // *** Signaling cho gọi video ***
    socket.on("sendOffer", (data) => {
        const { recipientId, offer } = data;
        const user = onlineUsers.find((user) => user.userId === recipientId);
        if (user) {
            io.to(user.socketId).emit("receiveOffer", { senderId: data.senderId, offer });
        }
    });
    socket.on("sendAnswer", (data) => {
        const { recipientId, answer } = data;
        const user = onlineUsers.find((user) => user.userId === recipientId);
        if (user) {
            io.to(user.socketId).emit("receiveAnswer", { senderId: data.senderId, answer });
        }
    });
    socket.on("sendIceCandidate", (data) => {
        const { recipientId, candidate } = data;
        const user = onlineUsers.find((user) => user.userId === recipientId);
        if (user) {
            io.to(user.socketId).emit("receiveIceCandidate", { senderId: data.senderId, candidate });
        }
    });
    // Khi một người dùng từ chối cuộc gọi
    socket.on("rejectCall", (data) => {
        const { recipientId } = data;
        const user = onlineUsers.find((user) => user.userId === recipientId);
        if (user) {
            io.to(user.socketId).emit("callRejected", { senderId: data.senderId });
        }
    });
    // Khi một người dùng kết thúc cuộc gọi
    socket.on("endCall", (data) => {
        const { recipientId } = data;
        const user = onlineUsers.find((user) => user.userId === recipientId);
        if (user) {
            io.to(user.socketId).emit("callEnded", { senderId: data.senderId });
        }
    });
    socket.on("updateCallStatus", (data) => {
        const { userId, status } = data;
        const user = onlineUsers.find((user) => user.userId === userId);
        if (user) {
            user.status = status;
            io.emit("callStatusUpdated", onlineUsers);
        }
    });

    socket.on("disconnect", () => {
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
        io.emit("getOnlineUsers", onlineUsers);

    })

});
io.listen(3000);

