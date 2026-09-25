package edu.eci.arsw.collabboard.infrastructure.web.ws;

import edu.eci.arsw.collabboard.application.dto.event.BoardEvent;
import edu.eci.arsw.collabboard.application.service.BoardEventApplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class BoardWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(BoardWebSocketController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final BoardEventApplicationService eventService;

    public BoardWebSocketController(SimpMessagingTemplate messagingTemplate,
                                     BoardEventApplicationService eventService) {
        this.messagingTemplate = messagingTemplate;
        this.eventService = eventService;
    }

    @MessageMapping("/boards/{boardId}/events")
    public void handleBoardEvent(@DestinationVariable String boardId, BoardEvent event) {
        try {
            BoardEvent accepted = eventService.apply(boardId, event);
            messagingTemplate.convertAndSend("/topic/boards/" + boardId, accepted);
        } catch (RuntimeException ex) {
            // Evento rechazado (board inexistente, payload inválido, etc.): no se retransmite.
            log.warn("Evento rechazado para board {}: {}", boardId, ex.getMessage());
        }
    }
}