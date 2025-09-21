// Enkel WebSocket-server för lobbyhantering
const WebSocket = require('ws');
const PORT = 3001;
const wss = new WebSocket.Server({ port: PORT });

// Lobbys: { lobbyCode: [ { id, name, isAdmin } ] }
const lobbies = {};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      return;
    }

    // Hantera spelstart
    if (data.type === 'startGame') {
      broadcastToLobby(data.lobbyCode, {
        type: 'gameStarted',
        lobbyCode: data.lobbyCode,
      });
    }

    if (data.type === 'getPlayers') {
      const players = lobbies[data.lobbyCode] || [];
      ws.send(JSON.stringify({ type: 'players', players }));
    }

    if (data.type === 'joinLobby') {
      if (!lobbies[data.lobbyCode]) lobbies[data.lobbyCode] = [];
      // Skapa ett unikt id för spelaren
      const player = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: data.player.name,
        isAdmin: data.player.isAdmin || false,
      };
      lobbies[data.lobbyCode].push(player);
      // Skicka uppdaterad lista till alla anslutna
      broadcastToLobby(data.lobbyCode, {
        type: 'playerJoined',
        players: lobbies[data.lobbyCode],
      });
    }
  });
});

function broadcastToLobby(lobbyCode, msg) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
}

console.log(`WebSocket-servern körs på ws://localhost:${PORT}`);