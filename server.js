const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { random } = require('lodash');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let playersWaiting = [];
let playerBoards = {};
let currentTurn = {};

app.use(express.static('public'));

function findAndMatchPlayers() {
    if (playersWaiting.length >= 2) {
        const player1 = playersWaiting.shift();
        const player2 = playersWaiting.shift();

        const randomKey1 = random(0, 1) === 0 ? 'X' : 'O';
        const randomKey2 = randomKey1 === 'X' ? 'O' : 'X';

        console.log('El primero tiene' + randomKey1)
        console.log('El segundo tiene' + randomKey2)

        playerBoards[player1.id] = { board: Array(9).fill(null), opponent: player2.id, player: randomKey1 };
        playerBoards[player2.id] = { board: Array(9).fill(null), opponent: player1.id, player: randomKey2 };

        if(randomKey1 === 'X'){
            currentTurn[player1.id + player2.id] = 'X';
        } else {
            currentTurn[player2.id + player1.id] = 'X';
        }

        io.to(player1.id).emit('matchFound', { opponent: player2.username, player: randomKey1, icon: randomKey2 });
        io.to(player2.id).emit('matchFound', { opponent: player1.username, player: randomKey2, icon: randomKey1 });

        console.log(`Partida iniciada para jugadores ${player1.username} (X) y ${player2.username} (O).`);
    }
}

function checkWinner(board) {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return condition;
        }
    }
    return null;
}

function checkDraw(board) {
    return board.every(cell => cell !== null);
}

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        playersWaiting = playersWaiting.filter(player => player.id !== socket.id);
        delete playerBoards[socket.id];
    });

    socket.on('searchForMatch', (username) => {
        const player = { id: socket.id, username: username };

        const index = playersWaiting.findIndex(player => player.id === socket.id);
        if (index === -1) {
            playersWaiting.push(player);
            console.log(`Jugador ${player.username} en espera.`);
        } else {
            console.log(`Jugador ${player.username} ya está en espera.`);
        }

        findAndMatchPlayers();
    });

    socket.on('move', (index) => {
        const board = playerBoards[socket.id].board;
        const opponent = playerBoards[socket.id].opponent;
        const opponentBoard = playerBoards[opponent].board;
        const currentPlayer = playerBoards[socket.id].player;
        let currentTurnKey;

        if(currentTurn[socket.id + opponent] === 'X'){
            currentTurnKey = socket.id + opponent;
        } else {
            currentTurnKey = opponent + socket.id;
        }
    
        if (currentPlayer === currentTurn[currentTurnKey] && board[index] === null) {
            board[index] = currentPlayer;
            opponentBoard[index] = currentPlayer;
    
            const winner = checkWinner(board);
            const draw = checkDraw(board);
    
            io.to(socket.id).emit('updateCell', { index, value: currentPlayer });
            io.to(opponent).emit('updateCell', { index, value: currentPlayer });
    
            if (winner || draw) {
                if (winner) {
                    let winnerCells = winner;
                    io.to(socket.id).emit('gameOver', { result: 'win', winnerCells: winnerCells });
                    io.to(opponent).emit('gameOver', { result: 'lose', winnerCells: winnerCells });
                } else {
                    io.to(socket.id).emit('gameOver', { result: 'draw' });
                    io.to(opponent).emit('gameOver', { result: 'draw' });
                }
                delete playerBoards[socket.id];
                delete playerBoards[opponent];
            } else {
                currentTurn[currentTurnKey] = currentPlayer === 'X' ? 'O' : 'X';
            }
        }
    });

    socket.on('mensaje', (mensaje) => {
        io.emit('mensaje', mensaje);
    })
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
