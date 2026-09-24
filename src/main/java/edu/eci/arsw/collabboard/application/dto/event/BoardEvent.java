package edu.eci.arsw.collabboard.application.dto.event;

import java.time.Instant;
import java.util.Map;

public record BoardEvent(
        String eventId,
        String boardId,
        BoardEventType type,
        String actorId,
        Instant occurredAt,
        Map<String, Object> payload
) {}
