const API_BASE_URL = '/api/boards';

/**
 * Centralized function for handling fetch responses 
 * and throwing controlled errors.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Error HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      //If the response is not JSON, we can ignore this error and use the default message.
    }
    throw new Error(`[${response.status}] ${errorMessage}`);
  }

  //If the response is 204 No Content, we return the parsed JSON data.
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const BoardApiClient = {
  async getBoard(boardId) {
        const response = await fetch(`${API_BASE_URL}/${boardId}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        return handleResponse(response);
    },

  async createBoard(name = "Nuevo Tablero") {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        return handleResponse(response);
    },

    async updateBoard(boardId, name) {
        const response = await fetch(`${API_BASE_URL}/${boardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        });
        return handleResponse(response);
    }
};