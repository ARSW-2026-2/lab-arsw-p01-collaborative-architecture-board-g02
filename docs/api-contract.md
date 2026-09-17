# REST Contract — Lab 04

Complete this file with the **actual contract implemented by your code**.

| Method | Resource | Request | Success response | Error cases |
|---|---|---|---|---|
| POST | `/api/boards` | TODO | TODO | TODO |
| GET | `/api/boards/{boardId}` | - | TODO | TODO |
| PUT | `/api/boards/{boardId}` | TODO | TODO | TODO |

## Error contract

```json
{
  "timestamp": "2026-...",
  "status": 404,
  "code": "BOARD_NOT_FOUND",
  "message": "...",
  "path": "/api/boards/..."
}
```

Explain any deviation from this starter contract.

### Evolución del Modelo: `BoardElement` (Lab 5)

Se incorpora el tipo `CONNECTOR` al enumerador `ElementType`. Los conectores utilizan los nuevos campos `sourceId` y `targetId` para establecer la relación entre dos elementos existentes. Las propiedades de coordenadas y dimensiones se ignoran en el renderizado de conectores.

**Ejemplo de Payload JSON (Actualizado):**
```json
{
  "name": "Architecture Board",
  "elements": [
    {
      "id": "node-1",
      "type": "RECTANGLE",
      "x": 100.0,
      "y": 150.0,
      "width": 120.0,
      "height": 60.0
    },
    {
      "id": "node-2",
      "type": "TEXT",
      "x": 400.0,
      "y": 150.0,
      "width": 120.0,
      "height": 60.0,
      "text": "Base de Datos"
    },
    {
      "id": "conn-1",
      "type": "CONNECTOR",
      "sourceId": "node-1",
      "targetId": "node-2"
    }
  ]
}
