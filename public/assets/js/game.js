const socket = io();

socket.on('mensaje', (mensaje) => {
    const mensajesDiv = document.getElementById('mensajes');
    mensajesDiv.innerHTML += `<p>${mensaje}</p>`;
});

function enviarMensaje() {
    const mensajeInput = document.getElementById('mensajeInput');
    const mensaje = mensajeInput.value;
    socket.emit('mensaje', mensaje);
    mensajeInput.value = '';
}

socket.on('matchFound', (data) => {
    changeToGameView();
    document.getElementById('jugador1').innerHTML = data.opponent + ' juega con ' + data.icon;
    document.getElementById('jugador2').innerHTML = 'Tu juegas con ' + data.player;
});

socket.on('updateCell', ({ index, value }) => {
    const cell = document.getElementById(`cell-${index}`);
    cell.textContent = value || '';
});

socket.on('gameOver', (data) => {
    let gameoverText = document.getElementById('gameover');
    gameoverText.style.display = 'block';
    if (data.result === 'win') {
        gameoverText.innerHTML = 'La partida ha terminado. Ganaste!';
        data.winnerCells.forEach(position => {
            document.getElementById(`cell-${position}`).classList.add('winner-cell');
        });
        document.getElementById('gameover').style.color = 'darkgreen';
    } else if (data.result === 'lose') {
        gameoverText.innerHTML = 'La partida ha terminado. Perdiste :(';
        data.winnerCells.forEach(position => {
            document.getElementById(`cell-${position}`).classList.add('looser-cell');
        });
        document.getElementById('gameover').style.color = 'orangered';
    } else if (data.result === 'draw') {
        gameoverText.innerHTML = 'La partida ha terminado en empate';
    }
    document.getElementById('return-btn').style.display = 'block';
});

function handleCellClick(index) {
    console.log(index);
    socket.emit('move', index);
}

function searchForMatch() {
    let username = document.getElementById('username').value;
    if (username !== '') {
        document.getElementById('errorMsg').innerHTML = '';
        document.getElementById('username').disabled = true;
        document.getElementById('loading-image').style.display = 'block';
        document.getElementById('mensajeBuscando').style.display = 'block';
        let button = document.getElementById('searchForMatch');
        button.disabled = true;
        button.style.backgroundColor = 'grey';
        socket.emit('searchForMatch', username);
    } else {
        document.getElementById('errorMsg').innerHTML = 'Debe introducir un nombre';
    }
}

function changeToGameView() {
    document.getElementById('index-container').style.display = 'none';
    document.getElementById('container').style.display = 'block';
}
