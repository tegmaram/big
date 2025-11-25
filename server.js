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

app.get('/', (req, res) => { res.send('ULTRA RACER BACKEND ONLINE'); });

io.on('connection', (socket) => {
    log(`+ Verbindung: ${socket.id}`);

    // Init Spieler
    players[socket.id] = {
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        angle: 0,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        name: "Guest",
        isAdmin: false
    };

    // 1. JOIN
    socket.on('join', (data) => {
        let name = data.name || "Guest";
        let isAdmin = false;

        // AUTH SYSTEM
        if (name.startsWith("!!!")) {
            isAdmin = true;
            name = name.substring(3); // Code entfernen
            socket.emit('adminAuth', true);
            log(`[ADMIN LOGIN] ${name} (${socket.id})`);
        } else {
            socket.emit('adminAuth', false);
        }

        // Daten speichern
        if(players[socket.id]) {
            players[socket.id].name = name.substring(0, 15);
            players[socket.id].color = data.color;
            players[socket.id].isAdmin = isAdmin;
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
        }

        // Update an alle
        io.emit('playerList', getPublicList());
    });

    // 2. MOVEMENT
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            
            // Nur an andere senden (Bandbreite sparen)
            socket.broadcast.emit('pMove', {
                id: socket.id,
                x: data.x, y: data.y, a: data.angle
            });
        }
    });

    // 3. ADMIN ACTIONS
    socket.on('adminCmd', (data) => {
        const admin = players[socket.id];
        if(!admin || !admin.isAdmin) return; // Security Check

        const { type, targetId, payload } = data;
        
        log(`[CMD] ${admin.name} -> ${type} -> ${targetId || 'ALL'}`);

        if(type === 'announce') {
            // Nachricht an ALLE senden
            io.emit('serverMsg', { text: payload, from: admin.name });
        }
        else if(targetId && players[targetId]) {
            // Zielgerichtete Trolls
            if(type === 'freeze') io.to(targetId).emit('effect', 'freeze');
            if(type === 'spin') io.to(targetId).emit('effect', 'spin');
            if(type === 'kick') io.to(targetId).emit('effect', 'kick');
            if(type === 'teleport') {
                const t = players[targetId];
                socket.emit('forcePos', { x: t.x, y: t.y });
            }
            if(type === 'pull') {
                io.to(targetId).emit('forcePos', { x: admin.x, y: admin.y });
            }
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerList', getPublicList());
    });
});

function getPublicList() {
    let list = {};
    for (let id in players) {
        list[id] = {
            x: players[id].x, y: players[id].y,
            a: players[id].angle, c: players[id].color,
            n: players[id].name
        };
    }
    return list;
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => log(`Server listening on ${PORT}`));
