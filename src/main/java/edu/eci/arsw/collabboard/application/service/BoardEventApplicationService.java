package edu.eci.arsw.collabboard.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.eci.arsw.collabboard.application.dto.event.BoardEvent;
import edu.eci.arsw.collabboard.application.exception.BoardNotFoundException;
import edu.eci.arsw.collabboard.application.port.out.BoardRepository;
import edu.eci.arsw.collabboard.domain.model.Board;
import edu.eci.arsw.collabboard.domain.model.BoardElement;
import edu.eci.arsw.collabboard.domain.model.ElementType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Valida y aplica un BoardEvent sobre el Board correspondiente antes de que
 * el controlador STOMP lo retransmita. BoardEvent sigue siendo un contrato de
 * comunicación; aquí se traduce a operaciones sobre el modelo de dominio
 * (Board/BoardElement), que continúa siendo la única fuente de verdad del estado.
 */
@Service
public class BoardEventApplicationService {

    private final BoardRepository repository;
    private final ObjectMapper objectMapper;

    public BoardEventApplicationService(BoardRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public BoardEvent apply(String boardId, BoardEvent event) {
        if (event.boardId() == null || !boardId.equals(event.boardId())) {
            throw new IllegalArgumentException("El boardId del evento no coincide con el canal " + boardId);
        }
        if (event.payload() == null) {
            throw new IllegalArgumentException("El evento no trae payload");
        }

        Board board = repository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException(boardId));

        List<BoardElement> updated = switch (event.type()) {
            case ELEMENT_CREATED, CONNECTOR_CREATED -> applyCreate(board, event.payload());
            case ELEMENT_MOVED -> applyMove(board, event.payload());
            case ELEMENT_UPDATED -> applyUpdate(board, event.payload());
            case ELEMENT_DELETED -> applyDelete(board, event.payload());
        };

        repository.save(new Board(board.id(), board.name(), updated));
        return event;
    }

    private List<BoardElement> applyCreate(Board board, Map<String, Object> payload) {
        BoardElement element = objectMapper.convertValue(payload, BoardElement.class);

        List<BoardElement> elements = new ArrayList<>(board.elements());
        boolean exists = elements.stream().anyMatch(e -> e.id().equals(element.id()));
        if (!exists) {
            elements.add(element);
        }
        return elements;
    }

    private List<BoardElement> applyMove(Board board, Map<String, Object> payload) {
        String id = requiredId(payload);
        double x = requiredNumber(payload, "x");
        double y = requiredNumber(payload, "y");

        List<BoardElement> elements = new ArrayList<>();
        for (BoardElement e : board.elements()) {
            if (e.id().equals(id) && e.type() != ElementType.CONNECTOR) {
                elements.add(new BoardElement(e.id(), e.type(), x, y, e.width(), e.height(),
                        e.text(), e.sourceId(), e.targetId()));
            } else {
                elements.add(e);
            }
        }
        return elements;
    }

    private List<BoardElement> applyUpdate(Board board, Map<String, Object> payload) {
        String id = requiredId(payload);

        List<BoardElement> elements = new ArrayList<>();
        for (BoardElement e : board.elements()) {
            if (e.id().equals(id)) {
                double x = numberOrDefault(payload.get("x"), e.x());
                double y = numberOrDefault(payload.get("y"), e.y());
                double width = numberOrDefault(payload.get("width"), e.width());
                double height = numberOrDefault(payload.get("height"), e.height());
                String text = payload.containsKey("text") ? (String) payload.get("text") : e.text();
                elements.add(new BoardElement(e.id(), e.type(), x, y, width, height,
                        text, e.sourceId(), e.targetId()));
            } else {
                elements.add(e);
            }
        }
        return elements;
    }

    private List<BoardElement> applyDelete(Board board, Map<String, Object> payload) {
        String id = requiredId(payload);

        List<BoardElement> elements = new ArrayList<>();
        for (BoardElement e : board.elements()) {
            boolean isTarget = e.id().equals(id);
            boolean isDependentConnector = id.equals(e.sourceId()) || id.equals(e.targetId());
            if (!isTarget && !isDependentConnector) {
                elements.add(e);
            }
        }
        return elements;
    }

    private String requiredId(Map<String, Object> payload) {
        Object id = payload.get("id");
        if (!(id instanceof String s) || s.isBlank()) {
            throw new IllegalArgumentException("El payload requiere un 'id' válido");
        }
        return s;
    }

    private double requiredNumber(Map<String, Object> payload, String key) {
        if (!(payload.get(key) instanceof Number number)) {
            throw new IllegalArgumentException("El payload requiere un campo numérico '" + key + "'");
        }
        return number.doubleValue();
    }

    private double numberOrDefault(Object value, double fallback) {
        return value instanceof Number number ? number.doubleValue() : fallback;
    }
}