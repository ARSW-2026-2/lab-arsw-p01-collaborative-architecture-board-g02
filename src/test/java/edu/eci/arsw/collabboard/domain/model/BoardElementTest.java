package edu.eci.arsw.collabboard.domain.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class BoardElementTest {

    @Test
    public void shouldCreateValidConnectorWhenSourceAndTargetAreDifferent() {
        BoardElement connector = new BoardElement(
                "conn-1", ElementType.CONNECTOR, 0, 0, 0, 0, null, "element-A", "element-B"
        );

        assertNotNull(connector);
        assertEquals("element-A", connector.sourceId());
        assertEquals("element-B", connector.targetId());
    }

    @Test
    public void shouldThrowExceptionWhenConnectorIsMissingSourceOrTarget() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            new BoardElement("conn-2", ElementType.CONNECTOR, 0, 0, 0, 0, null, "", "element-B");
        });

        assertEquals("CONNECTOR requires valid sourceId and targetId", ex.getMessage());
    }

    @Test
    public void shouldThrowExceptionWhenConnectorLinksToItself() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            new BoardElement("conn-3", ElementType.CONNECTOR, 0, 0, 0, 0, null, "element-A", "element-A");
        });

        assertEquals("CONNECTOR cannot link an element to itself", ex.getMessage());
    }
}
