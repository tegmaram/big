const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingTimeout: 60000,
    pingInterval: 25000
});

// --- SERVER STATE ---
let players = {};

// --- LOGGER ---
function log(msg) {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${msg}`);
}

// Serve static files (optional) from project folder
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => { res.send('ULTRA RACER BACKEND ONLINE'); });

io.on('connection', (socket) => {
    log(`+ connection: ${socket.id}`);

    // Initialize player record
    players[socket.id] = {
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        angle: 0,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        name: 'Guest',
        isAdmin: false
    };

    // 1. JOIN
    socket.on('join', (data) => {
        let name = (data && data.name) ? data.name : 'Guest';
        let isAdmin = false;

        // AUTH SYSTEM: client uses prefix !!! to indicate admin intent
        if (typeof name === 'string' && name.startsWith('!!!')) {
            isAdmin = true;
            name = name.substring(3); // strip prefix for display
            socket.emit('adminAuth', true);
            log(`[ADMIN LOGIN] ${name} (${socket.id})`);
        } else {
            socket.emit('adminAuth', false);
        }

        if (players[socket.id]) {
            players[socket.id].name = name.substring(0, 15);
            if (data && data.color) players[socket.id].color = data.color;
            players[socket.id].isAdmin = isAdmin;
            if (data && typeof data.x === 'number') players[socket.id].x = data.x;
            if (data && typeof data.y === 'number') players[socket.id].y = data.y;
        }

        // Broadcast updated player list
        io.emit('playerList', getPublicList());
    });

    // 2. MOVEMENT
    socket.on('move', (data) => {
        if (players[socket.id]) {
            if (typeof data.x === 'number') players[socket.id].x = data.x;
            if (typeof data.y === 'number') players[socket.id].y = data.y;
            if (typeof data.angle === 'number') players[socket.id].angle = data.angle;

            // Send to others only
            socket.broadcast.emit('pMove', {
                id: socket.id,
                x: data.x, y: data.y, a: data.angle
            });
        }
    });

    // 3. ADMIN ACTIONS
    socket.on('adminCmd', (data) => {
        const admin = players[socket.id];
        if (!admin || !admin.isAdmin) return; // security check

        const { type, targetId, payload } = data || {};
        log(`[CMD] ${admin.name} -> ${type} -> ${targetId || 'ALL'}`);

        // Broadcast commands
        if (type === 'announce') {
            // Send announcement to all
            io.emit('serverMsg', { text: payload, from: admin.name });
            return;
        }

        // If no targetId provided, and command is an effect, broadcast it
        if (!targetId) {
            // Allow broadcast of some effects
            if (['freeze','spin','blind','boost'].includes(type)) {
                io.emit('effect', type);
            }
            return;
        }

        // Target-specific commands
        if (players[targetId]) {
            // Simple effect mapping
            if (type === 'freeze' || type === 'spin' || type === 'blind' || type === 'boost') {
                io.to(targetId).emit('effect', type);
            }

            if (type === 'kick') {
                // tell client it's kicked then forcibly disconnect on server
                io.to(targetId).emit('effect', 'kick');
                // disconnect socket server-side
                const targetSocket = io.sockets.sockets.get(targetId);
                if (targetSocket) {
                    try {
                        targetSocket.disconnect(true);
                    } catch (err) {
                        // ignore
                    }
                }
                // remove from player list and broadcast
                delete players[targetId];
                io.emit('playerList', getPublicList());
            }

            if (type === 'teleport') {
                // send position of target back to admin (for inspection)
                const t = players[targetId];
                socket.emit('forcePos', { x: t.x, y: t.y });
            }

            if (type === 'pull') {
                // Move the target to the admin's current position (force)
                const a = players[socket.id];
                if (a) {
                    io.to(targetId).emit('forcePos', { x: a.x, y: a.y });
                }
            }
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerList', getPublicList());
        log(`- disconnected: ${socket.id}`);
    });
});

function getPublicList() {
    const list = {};
    for (let id in players) {
        list[id] = {
            x: players[id].x,
            y: players[id].y,
            a: players[id].angle,
            c: players[id].color,
            n: players[id].name
        };
    }
    return list;
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => log(`Server listening on ${PORT}`));
