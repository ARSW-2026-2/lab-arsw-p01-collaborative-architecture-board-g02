package edu.eci.arsw.collabboard.infrastructure.web.rest;

import edu.eci.arsw.collabboard.application.exception.BoardNotFoundException;
import edu.eci.arsw.collabboard.application.service.BoardApplicationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BoardRestController.class)
class BoardRestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BoardApplicationService boardService;
    
    @Test
    void getBoard_WhenBoardDoesNotExist_ShouldReturn404AndUniformApiError() throws Exception {
        String missingId = "non-existent-id";
        when(boardService.getBoard(missingId)).thenThrow(new BoardNotFoundException("Board not found"));

        mockMvc.perform(get("/api/boards/" + missingId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("BOARD_NOT_FOUND"))
                .andExpect(jsonPath("$.status").value(404));
    }
}