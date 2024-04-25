const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let jugadoresEnEspera = [];

const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'chatroom_node',
    insecureAuth: true
});

app.use(express.static(__dirname + '/public'));

connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión a la base de datos establecida');
});

io.on('connection', (socket) => {
    console.log('Usuario conectado');

    socket.on('mensaje', (mensaje) => {
        console.log('Mensaje recibido:', mensaje);
        io.emit('mensaje', mensaje);
    });

    socket.on('buscarPartida', (username) => {
        const jugadorActual = { id: socket.id, username: username };
        const index = jugadoresEnEspera.findIndex(jugador => jugador.id === jugadorActual.id);
        
        if (index === -1) {
            jugadoresEnEspera.push(jugadorActual);
            console.log('Cantidad de jugadores en espera: ', jugadoresEnEspera.length);
            console.log('Jugadores en espera: ', jugadoresEnEspera);
            console.log(`Jugador ${jugadorActual.username} en espera.`);
        } else {
            console.log(`Jugador ${jugadorActual.username} ya está en espera.`);
        }
    
        if (jugadoresEnEspera.length < 2) {
            console.log("Esperando a más jugadores...");
            return;
        }
    
        const jugador1 = jugadoresEnEspera.shift();
        const jugador2 = jugadoresEnEspera.shift();
    
        console.log(`Emparejando jugadores ${jugador1.username} y ${jugador2.username}.`);
    
        io.to(jugador1.id).emit('jugadoresEmparejados', { jugador1: jugador1.username, jugador2: jugador2.username });
        io.to(jugador2.id).emit('jugadoresEmparejados', { jugador1: jugador1.username, jugador2: jugador2.username });
    
        console.log(`Partida iniciada para jugadores ${jugador1.username} y ${jugador2.username}.`);
    });

    socket.on('resultado', (socketId) => {
        io.to(socketId).emit('finPartida', 'ganaste');
        socket.broadcast.emit('finPartida', 'perdiste');
    })

    socket.on('resultadoEmpate', () => {
        io.emit('finPartida', 'empate');
    })

    let socketIdEnviado;
    socket.on('movimiento', (datos) => {
        if (!socketIdEnviado) {
            socketIdEnviado = socket.id;
        }
        console.log('Movimiento recibido del cliente:', JSON.parse(datos));
        socket.broadcast.emit('movimiento', JSON.parse(datos));
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
        const index = jugadoresEnEspera.indexOf(socket.id);
        if (index !== -1) {
            jugadoresEnEspera.splice(index, 1);
            console.log(`Usuario ${socket.id} desconectado. Jugador eliminado de la lista de espera.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
