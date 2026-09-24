package edu.eci.arsw.collabboard.infrastructure.web.ws;

import edu.eci.arsw.collabboard.application.dto.event.BoardEvent;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class BoardWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    // TODO: Inyectar tu BoardEventApplicationService aquí

    public BoardWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/boards/{boardId}/events")
    public void handleBoardEvent(@DestinationVariable String boardId, BoardEvent event) {
        messagingTemplate.convertAndSend("/topic/boards/" + boardId, event);
    }
}
