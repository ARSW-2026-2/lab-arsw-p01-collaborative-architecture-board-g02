// Board State Management.
const state = {
  board: null,
    selectedElementId: null,
    interactionMode: 'SELECT', // Modes: 'SELECT', 'ADD_RECTANGLE', 'ADD_TEXT', 'ADD_CONNECTOR'
    remoteState: {
        status: 'IDLE', // States: 'IDLE', 'LOADING', 'SUCCESS', 'ERROR'
        message: ''
    }
};

export const BoardState = {
    //Getters:
    getBoard: () => state.board,
    getSelectedElementId: () => state.selectedElementId,
    getInteractionMode: () => state.interactionMode,
    getRemoteState: () => state.remoteState,

  //Setters:
    setBoard: (boardData) => { 
        state.board = boardData; 
    },
    
    setSelectedElementId: (id) => { 
        state.selectedElementId = id; 
    },
    
    setInteractionMode: (mode) => { 
        state.interactionMode = mode; 
        // Reset selected element when changing interaction mode.
        state.selectedElementId = null; 
    },
    
    setRemoteState: (status, message = '') => { 
        state.remoteState = { status, message }; 
    },

    //Pures Operations:
    addElement: (element) => {
        if (state.board) {
            state.board.elements.push(element);
        }
    },

    removeElement: (elementId) => {
        if (state.board) {
            state.board.elements = state.board.elements.filter(e => e.id !== elementId);
            if (state.selectedElementId === elementId) {
                state.selectedElementId = null;
            }
        }
    },

    updateElementPosition: (elementId, newX, newY) => {
        if (state.board) {
            const el = state.board.elements.find(e => e.id === elementId);
            if (el && el.type !== 'CONNECTOR') { //The connectors do not move on their own.
                el.x = newX;
                el.y = newY;
            }
        }
    }
};
