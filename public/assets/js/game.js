const urlParams = new URLSearchParams(window.location.search);
if(urlParams.get('jugador1') !== null){
    document.getElementById('jugador1').innerHTML = urlParams.get('jugador1')
    document.getElementById('jugador2').innerHTML = urlParams.get('jugador2')
}

const socket = io();
let enEspera = false;

socket.on('mensaje', (mensaje) => {
    const mensajesDiv = document.getElementById('mensajes');
    mensajesDiv.innerHTML += `<p>${mensaje}</p>`;
});

socket.on('movimiento', (movimiento) => {
    console.log('Movimiento recibido del servidor:', movimiento);
    actualizarTablero(movimiento);
    turno = turno === 'X' ? 'O' : 'X';
    enEspera = false;
});

socket.on('partidaIniciada', (data) => {
    console.log(data);
    document.getElementById('jugador2').innerHTML = data.jugador2;
    document.getElementById('jugador1').innerHTML = data.jugador1;
});

socket.on('jugadoresEmparejados', (data) => {
    window.location.href = `/game.html?jugador1=${data.jugador1}&jugador2=${data.jugador2}`;
});

socket.on('finPartida', (resultado) => {
    if (resultado === 'empate') {
        alert('¡Empate!');
    } else if (resultado === 'ganaste') {
        alert('¡Ganaste!');
    } else if (resultado === 'perdiste') {
        alert('¡Perdiste!');
    }
});

const actualizarTablero = ({ index, turno }) => {
    tablero[index] = turno;
    celdas[index].textContent = turno;
};

function enviarMensaje() {
    const mensajeInput = document.getElementById('mensajeInput');
    const mensaje = mensajeInput.value;
    socket.emit('mensaje', mensaje);
    mensajeInput.value = '';
}

function buscarPartida() {
    document.getElementById('mensajeBuscando').style.display = 'block';
    document.getElementById('buscarPartida').disabled = true;
    document.getElementById('loading-image').style.display = 'block';
    let username = document.getElementById('username').value;
    document.getElementById('username').disabled = true;
    socket.emit('buscarPartida', username);
}

const celdas = document.querySelectorAll('.celda');
let turno = 'X';
let tablero = ['', '', '', '', '', '', '', '', ''];

const manejarClic = (index) => {
    if (tablero[index] !== '' || !juegoEnCurso() || enEspera) {
        return;
    }

    tablero[index] = turno;
    celdas[index].textContent = turno;

    console.log('Índice del clic:', index);
    console.log('Turno del jugador:', turno);
    let datos=JSON.stringify({ index, turno })
    socket.emit('movimiento', datos);
    enEspera = true;
    actualizarTablero({ index, turno });
    turno = turno === 'X' ? 'O' : 'X';

    if (hayGanador()) {
        turno = turno === 'X' ? 'O' : 'X';
        console.log(`¡El jugador ${turno} ha ganado!`);
        socket.emit('resultado', socket.id);
    } else if (tableroCompleto()) {
        console.log('¡Empate!');
        socket.emit('resultadoEmpate');
    }
};

celdas.forEach((celda, index) => {
    celda.addEventListener('click', () => manejarClic(index));
});

const juegoEnCurso = () => {
    return !hayGanador() && !tableroCompleto();
};

const hayGanador = () => {
    const lineasGanadoras = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let linea of lineasGanadoras) {
        const [a, b, c] = linea;
        if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c]) {
            return true;
        }
    }
    return false;
};

const tableroCompleto = () => {
    return tablero.every(celda => celda !== '');
};
