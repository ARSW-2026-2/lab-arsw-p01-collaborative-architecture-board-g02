package edu.eci.arsw.collabboard.application.service;

import edu.eci.arsw.collabboard.application.port.out.BoardRepository;
import edu.eci.arsw.collabboard.domain.model.Board;
import edu.eci.arsw.collabboard.domain.model.BoardElement;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Service
public class BoardApplicationService {

    private final BoardRepository repository;

    public BoardApplicationService(BoardRepository repository) {
        this.repository = repository;
    }

    public Board createBoard(String name) {
        // TODO LAB-04: generate the id, enforce the use-case rules and persist through the port.
        if (name == null ||  name.isEmpty()) {
            throw new IllegalArgumentException("Board name cannot be null or empty");
        }
        String id = UUID.randomUUID().toString();
        Board board = new Board(id, name, new ArrayList<>());
        return repository.save(board);
    }

    public Board getBoard(String boardId) {
        // TODO LAB-04: use a concrete application exception when the board does not exist.
        if (boardId == null || boardId.isEmpty()) {
            throw new IllegalArgumentException("Board ID cannot be null or empty");
        }
        return repository.findById(boardId).orElseThrow(() -> new IllegalArgumentException("Board not found"));
    }

    public Board replaceBoard(String boardId, String name, List<BoardElement> elements) {
        // TODO LAB-04: keep the existing identity and replace only a board that already exists.
        if (boardId == null || boardId.isEmpty()) {
            throw new IllegalArgumentException("Board ID cannot be null or empty");
        }
        if (!repository.existsById(boardId)) {
            throw new IllegalArgumentException("Board not found");
        }
        Board boardToSave = new  Board(boardId, name, elements);
        return repository.save(boardToSave);
    }
}
