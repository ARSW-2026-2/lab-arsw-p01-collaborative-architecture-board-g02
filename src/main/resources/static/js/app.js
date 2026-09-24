import { BoardApiClient } from './api/board-api-client.js';
import { BoardState } from './state/board-state.js';
import { BoardView } from './ui/board-view.js';

let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let lastOperation = null;

async function init() {
    // Conecta con tu lienzo SVG
    BoardView.initialize('boardCanvas');
    setupEventListeners();
    showStatus('Listo para empezar', 'IDLE');
}

function setupEventListeners() {
    const svg = document.getElementById('boardCanvas');

    // 1. CLICS EN EL TABLERO (Seleccionar, Agregar, Conectar)
    svg.addEventListener('mousedown', (e) => {
        const target = e.target;
        const mode = BoardState.getInteractionMode();
        const rect = svg.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (mode === 'SELECT') {
            if (target.classList.contains('board-element') && target.tagName !== 'line') {
                const elementId = target.getAttribute('id');
                BoardState.setSelectedElementId(elementId);
                
                const elX = parseFloat(target.getAttribute('x') || 0);
                const elY = parseFloat(target.getAttribute('y') || 0);
                dragOffset = { x: x - elX, y: y - elY };
                isDragging = true;
            } else {
                BoardState.setSelectedElementId(null);
            }
        } else if (mode === 'ADD_RECTANGLE') {
            const newId = 'rect-' + Date.now();
            BoardState.addElement({ id: newId, type: 'RECTANGLE', x: x, y: y, width: 140, height: 80 });
            BoardState.setInteractionMode('SELECT');
        } else if (mode === 'ADD_TEXT') {
            const newId = 'text-' + Date.now();
            const textValue = prompt("Ingresa el texto de la tarjeta:") || "Nuevo Texto";
            BoardState.addElement({ id: newId, type: 'TEXT', x: x, y: y, width: 120, height: 40, text: textValue });
            BoardState.setInteractionMode('SELECT');
        } else if (mode === 'ADD_CONNECTOR') {
            const sourceId = BoardState.getSelectedElementId();
            if (target.classList.contains('board-element') && sourceId) {
                const targetId = target.getAttribute('id');
                if (sourceId !== targetId) {
                    const newId = 'conn-' + Date.now();
                    BoardState.addElement({ id: newId, type: 'CONNECTOR', sourceId: sourceId, targetId: targetId });
                    BoardState.setInteractionMode('SELECT');
                    BoardState.setSelectedElementId(null);
                }
            }
        }
        BoardView.render();
    });

    // 2. ARRASTRAR ELEMENTOS
    svg.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const selectedId = BoardState.getSelectedElementId();
        if (selectedId) {
            const rect = svg.getBoundingClientRect();
            const x = e.clientX - rect.left - dragOffset.x;
            const y = e.clientY - rect.top - dragOffset.y;
            BoardState.updateElementPosition(selectedId, x, y);
            BoardView.render();
        }
    });

    svg.addEventListener('mouseup', () => { isDragging = false; });
    svg.addEventListener('mouseleave', () => { isDragging = false; });

    // 3. BOTONES DE LA BARRA HERRAMIENTAS
    document.getElementById('addRectBtn').addEventListener('click', () => {
        BoardState.setInteractionMode('ADD_RECTANGLE');
        showStatus('Haz clic en el tablero para agregar un Rectángulo', 'INFO');
    });

    document.getElementById('addTextBtn').addEventListener('click', () => {
        BoardState.setInteractionMode('ADD_TEXT');
        showStatus('Haz clic en el tablero para agregar Texto', 'INFO');
    });

    document.getElementById('connectBtn').addEventListener('click', () => {
        if (!BoardState.getSelectedElementId()) {
            alert("Primero selecciona el elemento de origen haciendo clic en él");
            return;
        }
        BoardState.setInteractionMode('ADD_CONNECTOR');
        showStatus('Ahora haz clic en el elemento destino para conectarlos', 'INFO');
    });

    document.getElementById('deleteBtn').addEventListener('click', () => {
        const selectedId = BoardState.getSelectedElementId();
        if (selectedId) {
            BoardState.removeElement(selectedId);
            BoardView.render();
        }
    });

    // 4. BOTONES API REST
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