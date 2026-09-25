import { BoardApiClient } from './api/board-api-client.js';
import { BoardState } from './state/board-state.js';
import { BoardView } from './ui/board-view.js';
import { BoardRealtimeClient } from './api/board-realtime-client.js';

let lastOperation = null;

async function init() {
    BoardView.initialize('boardCanvas', publishLocalChange);
    setupEventListeners();
    showStatus('Listo para empezar', 'IDLE');
}

// Único puente entre BoardView (cambios locales) y BoardRealtimeClient (STOMP).
function publishLocalChange(type, payload) {
    BoardRealtimeClient.publish(type, payload);
}

function setupEventListeners() {
    document.getElementById('addRectBtn').addEventListener('click', () => {
        BoardView.resetInteractionState();
        BoardState.setInteractionMode('ADD_RECTANGLE');
        showStatus('Haz clic en el tablero para agregar un Rectángulo', 'INFO');
    });

    document.getElementById('addTextBtn').addEventListener('click', () => {
        BoardView.resetInteractionState();
        BoardState.setInteractionMode('ADD_TEXT');
        showStatus('Haz clic en el tablero para agregar Texto', 'INFO');
    });

    document.getElementById('connectBtn').addEventListener('click', () => {
        BoardView.resetInteractionState();
        BoardState.setInteractionMode('ADD_CONNECTOR');
        showStatus('Haz clic en el origen y luego en el destino', 'INFO');
    });

    document.getElementById('deleteBtn').addEventListener('click', () => {
        const selectedId = BoardState.getSelectedElementId();
        if (selectedId) {
            BoardState.removeElement(selectedId);
            BoardView.render();
            // Propagar eliminación desde el botón
            BoardRealtimeClient.publish('ELEMENT_DELETED', { id: selectedId });
        }
    });

    document.getElementById('newBoardBtn').addEventListener('click', async () => {
        const name = document.getElementById('boardName').value || "Tablero Nuevo";
        await executeRemoteOperation('CREATE', () => BoardApiClient.createBoard(name));
    });

    document.getElementById('loadBtn').addEventListener('click', async () => {
        const id = document.getElementById('boardId').value;
        if (!id) return alert("Por favor ingresa un ID para cargar");
        await executeRemoteOperation('LOAD', () => BoardApiClient.getBoard(id));
    });

    document.getElementById('saveBtn').addEventListener('click', async () => {
        const board = BoardState.getBoard();
        if (!board || !board.id) return alert("Crea o carga un tablero antes de guardar");
        await executeRemoteOperation('SAVE', () => BoardApiClient.updateBoard(board.id, board));
    });

    document.getElementById('retryBtn').addEventListener('click', async () => {
        if (lastOperation) {
            await executeRemoteOperation(lastOperation.name, lastOperation.func);
        }
    });
}

async function executeRemoteOperation(operationName, apiFunction) {
    showStatus('Comunicando con el servidor...', 'LOADING');
    document.getElementById('retryBtn').hidden = true;

    try {
        const result = await apiFunction();
        if (operationName === 'CREATE' || operationName === 'LOAD') {
            if (result) {
                if (!result.elements) result.elements = [];
                BoardState.setBoard(result);
                document.getElementById('boardId').value = result.id;
                BoardView.render();

                // Conectar a WebSockets tras obtener el ID
                BoardRealtimeClient.connect(result.id, handleRemoteEvent);
            }
        }
        showStatus(`Operación ${operationName} completada`, 'SUCCESS');
        lastOperation = null;
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'ERROR');
        lastOperation = { name: operationName, func: apiFunction };
        document.getElementById('retryBtn').hidden = false;
    }
}

function handleRemoteEvent(event) {
    console.log("Evento recibido desde el servidor:", event);
    const payload = event.payload;
    switch(event.type) {
        case 'ELEMENT_CREATED':
        case 'CONNECTOR_CREATED':
            BoardState.addElement(payload);
            break;
        case 'ELEMENT_MOVED':
            BoardState.updateElementPosition(payload.id, payload.x, payload.y);
            break;
        case 'ELEMENT_UPDATED':
            BoardState.updateElement(payload.id, payload);
            break;
        case 'ELEMENT_DELETED':
            BoardState.removeElement(payload.id);
            break;
    }
    BoardView.render();
}

function showStatus(message, state) {
    const remoteBadge = document.getElementById('remoteStatus');
    const messageText = document.getElementById('message');

    remoteBadge.textContent = state;
    messageText.textContent = message;

    if (state === 'ERROR') remoteBadge.style.backgroundColor = '#ff6b6b';
    else if (state === 'SUCCESS') remoteBadge.style.backgroundColor = '#20b2aa';
    else remoteBadge.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
}

document.addEventListener('DOMContentLoaded', init);