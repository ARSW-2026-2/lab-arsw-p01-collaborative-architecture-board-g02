import { BoardState } from '../state/board-state.js';

// Obligatory Namespace for SVG elements:
const SVG_NS = "http://www.w3.org/2000/svg";
let svgContainer = null;
let isDragging = false;
let draggedElementId = null;
let dragOffset = { x: 0, y: 0 };
let connectorSourceId = null;

export const BoardView = {

    initialize(svgElementId) {
        svgContainer = document.getElementById(svgElementId);
        if (svgContainer) {
            this.setupInteractions();
        }
    },

    // Limpia arrastre y origen de conector pendientes al cambiar de modo.
    resetInteractionState() {
        isDragging = false;
        draggedElementId = null;
        connectorSourceId = null;
        BoardState.setSelectedElementId(null);
        this.render();
    },

    render() {
        if (!svgContainer) return;
        
        svgContainer.innerHTML = '';
        
        const board = BoardState.getBoard();
        if (!board || !board.elements) return;

        const selectedId = BoardState.getSelectedElementId();

        //First render connectors.
        board.elements
            .filter(el => el.type === 'CONNECTOR')
            .forEach(conn => {
                const line = this.createConnectorNode(conn, board.elements);
                if (line) svgContainer.appendChild(line);
            });

        //Second render rectangles and texts on top of connectors.
        board.elements
            .filter(el => el.type !== 'CONNECTOR')
            .forEach(el => {
                let node;
                if (el.type === 'RECTANGLE') {
                    node = this.createRectangleNode(el, selectedId === el.id);
                } else if (el.type === 'TEXT') {
                    node = this.createTextNode(el, selectedId === el.id);
                }
                
                if (node) {
                    svgContainer.appendChild(node);
                }
            });
    },

    // Auxiliar Functions.
    createRectangleNode(element, isSelected) {
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('id', element.id);
        rect.setAttribute('x', element.x);
        rect.setAttribute('y', element.y);
        rect.setAttribute('width', element.width);
        rect.setAttribute('height', element.height);
        
        rect.setAttribute('fill', '#fef08a'); 
        rect.setAttribute('rx', '16'); // Bordes mucho más curvos y suaves
        
        rect.setAttribute('stroke', isSelected ? '#d946ef' : '#fbbf24');
        rect.setAttribute('stroke-width', isSelected ? '4' : '2');
        rect.setAttribute('class', 'board-element');
        
        rect.style.cursor = 'pointer';
        return rect;
    },

    createTextNode(element, isSelected) {
        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('id', element.id);
        text.setAttribute('x', element.x + element.width / 2);
        text.setAttribute('y', element.y + element.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        
        text.setAttribute('fill', isSelected ? '#d946ef' : '#334155');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-family', '"Nunito", "Comic Sans MS", sans-serif'); // Letra más casual
        text.textContent = element.text || 'Texto';
        text.setAttribute('class', 'board-element');
        text.style.pointerEvents = 'all'; // debe recibir clics para poder seleccionarse/arrastrarse
        text.style.cursor = 'pointer';
        return text;
    },

    createConnectorNode(connector, allElements) {
        const source = allElements.find(e => e.id === connector.sourceId);
        const target = allElements.find(e => e.id === connector.targetId);

        if (!source || !target) return null;

        const x1 = source.x + (source.width / 2);
        const y1 = source.y + (source.height / 2);
        const x2 = target.x + (target.width / 2);
        const y2 = target.y + (target.height / 2);

        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('id', connector.id);
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        
        line.setAttribute('stroke', '#8b5cf6');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-linecap', 'round'); 
        return line;
    },

    setupInteractions() {

        svgContainer.addEventListener('pointerdown', (e) => {
            const target = e.target;
            const mode = BoardState.getInteractionMode();


            if (target === svgContainer) {
                if (mode === 'ADD_RECTANGLE' || mode === 'ADD_TEXT') {

                    const rect = svgContainer.getBoundingClientRect();
                    const textValue = mode === 'ADD_TEXT'
                        ? (prompt('Ingresa el texto de la tarjeta:') || 'Texto')
                        : null;

                    const newElement = {
                        id: crypto.randomUUID(),
                        type: mode === 'ADD_RECTANGLE' ? 'RECTANGLE' : 'TEXT',
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        width: mode === 'ADD_RECTANGLE' ? 140 : 120,
                        height: mode === 'ADD_RECTANGLE' ? 80 : 40,
                        text: textValue
                    };

                    BoardState.addElement(newElement);
                    BoardState.setInteractionMode('SELECT');
                    this.render();
                } else {

                    BoardState.setSelectedElementId(null);
                    connectorSourceId = null;
                    this.render();
                }
                return;
            }


            const elementId = target.getAttribute('id');
            if (elementId && target.classList.contains('board-element')) {
                if (mode === 'SELECT') {

                    BoardState.setSelectedElementId(elementId);
                    isDragging = true;
                    draggedElementId = elementId;

                    // Calcular offset para un drag suave
                    const el = BoardState.getBoard().elements.find(e => e.id === elementId);
                    if (el) {
                        dragOffset.x = e.clientX - el.x;
                        dragOffset.y = e.clientY - el.y;
                    }
                    this.render();

                } else if (mode === 'ADD_CONNECTOR') {
                    if (!connectorSourceId) {
                        connectorSourceId = elementId;
                        BoardState.setSelectedElementId(elementId);
                        this.render();
                    } else if (connectorSourceId !== elementId) {
                        const newConnector = {
                            id: crypto.randomUUID(),
                            type: 'CONNECTOR',
                            sourceId: connectorSourceId,
                            targetId: elementId
                        };
                        BoardState.addElement(newConnector);
                        connectorSourceId = null;
                        BoardState.setInteractionMode('SELECT');
                        this.render();
                    }
                }
            }
        });

        svgContainer.addEventListener('pointermove', (e) => {
            if (!isDragging || !draggedElementId) return;

            const mode = BoardState.getInteractionMode();
            if (mode === 'SELECT') {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                BoardState.updateElementPosition(draggedElementId, newX, newY);
                this.render();
            }
        });

        svgContainer.addEventListener('pointerup', () => {
            isDragging = false;
            draggedElementId = null;
        });


        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    const selectedId = BoardState.getSelectedElementId();
                    if (selectedId) {
                        BoardState.removeElement(selectedId);
                        this.render();
                    }
                }
            }
        });
    }
};