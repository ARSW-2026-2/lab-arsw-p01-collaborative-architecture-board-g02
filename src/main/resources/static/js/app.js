import { BoardApiClient } from './api/board-api-client.js';
import { BoardState } from './state/board-state.js';
import { BoardView } from './ui/board-view.js';

let lastOperation = null;

async function init() {
    BoardView.initialize('boardCanvas');
    setupEventListeners();
    showStatus('Listo para empezar', 'IDLE');
}

function setupEventListeners() {
    // Botones de la barra de herramientas: solo cambian el modo de interacción.
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
        showStatus('Haz clic en el elemento de origen y luego en el elemento destino', 'INFO');
    });

    document.getElementById('deleteBtn').addEventListener('click', () => {
        const selectedId = BoardState.getSelectedElementId();
        if (selectedId) {
            BoardState.removeElement(selectedId);
            BoardView.render();
        }
    });

    // Botones de API REST
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