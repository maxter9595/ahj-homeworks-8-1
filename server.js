const WebSocket = require("ws");
const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

console.log(`WebSocket server is running on port ${port}`);

let users = {};

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    const data = JSON.parse(message);
    if (data.type === "register") {
      if (users[data.nickname]) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Nickname is already taken",
          }),
        );
      } else {
        users[data.nickname] = ws;
        ws.nickname = data.nickname;
        broadcastUsers();
        ws.send(JSON.stringify({ type: "registered" }));
      }
    } else if (data.type === "message") {
      broadcastMessage(data);
    }
  });

  ws.on("close", function () {
    delete users[ws.nickname];
    broadcastUsers();
  });
});

function broadcastUsers() {
  const userList = Object.keys(users);
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "users", users: userList }));
    }
  });
}

function broadcastMessage(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "message", ...data }));
    }
  });
}
