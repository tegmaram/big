const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

let players = {};

io.on('connection', (socket) => {
    console.log('Verbindung: ' + socket.id);

    // Standard Werte
    players[socket.id] = {
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        angle: 0,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        name: "Gast",
        isAdmin: false
    };

    socket.on('join', (data) => {
        let rawName = data.name || "Gast";
        let finalName = rawName;
        let isAdmin = false;

        // --- DER GEHEIME CHECK ---
        // Wenn der Name mit "!!!" beginnt, ist es ein Admin
        if (rawName.startsWith("!!!")) {
            isAdmin = true;
            finalName = rawName.substring(3); // Entfernt die !!!
            socket.emit('adminAuthSuccess', true); // Sagt dem Client: "Du bist drin"
        } else {
            socket.emit('adminAuthSuccess', false);
        }

        // Sicherheits-Check: Name nicht zu lang
        if(finalName.length > 12) finalName = finalName.substring(0,12);

        if(players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].color = data.color;
            players[socket.id].name = finalName;
            players[socket.id].isAdmin = isAdmin;
        }
        
        // Liste an alle senden (OHNE Admin-Info, damit niemand es im Code sieht)
        io.emit('updatePlayerList', getPublicPlayerList());
    });

    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            
            // Nur Bewegungsdaten weitersenden
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: data.x, y: data.y, angle: data.angle
            });
        }
    });

    // --- TROLL FUNKTIONEN ---
    socket.on('adminAction', (data) => {
        // Nur echte Admins dürfen das
        if(!players[socket.id] || !players[socket.id].isAdmin) return;

        const targetId = data.targetId;
        const action = data.action;

        if(players[targetId]) {
            if(action === 'freeze') {
                io.to(targetId).emit('trollEvent', { type: 'freeze' });
            }
            else if(action === 'spin') {
                // Lässt den Gegner unkontrolliert drehen
                io.to(targetId).emit('trollEvent', { type: 'spin' });
            }
            else if(action === 'teleportTo') {
                const target = players[targetId];
                socket.emit('forceTeleport', { x: target.x, y: target.y });
            }
            else if(action === 'bringHere') {
                const admin = players[socket.id];
                io.to(targetId).emit('forceTeleport', { x: admin.x, y: admin.y });
            }
            else if(action === 'kick') {
                // Fake Kick Nachricht
                io.to(targetId).emit('trollEvent', { type: 'fakeKick' });
            }
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayerList', getPublicPlayerList());
    });
});

function getPublicPlayerList() {
    let publicList = {};
    for (let id in players) {
        publicList[id] = {
            x: players[id].x, y: players[id].y,
            angle: players[id].angle, color: players[id].color,
            name: players[id].name
        };
    }
    return publicList;
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
