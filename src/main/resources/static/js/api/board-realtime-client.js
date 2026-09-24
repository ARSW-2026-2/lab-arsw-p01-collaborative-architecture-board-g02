// static/js/api/board-realtime-client.js
export const BoardRealtimeClient = {
    stompClient: null,
    boardId: null,
    actorId: crypto.randomUUID(),
    connect(boardId, onEventReceived) {
        this.boardId = boardId;

        this.stompClient = new StompJs.Client({
            brokerURL: `ws://${window.location.host}/ws`,
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('Conectado a WebSockets para el board:', boardId);

                this.stompClient.subscribe(`/topic/boards/${boardId}`, (message) => {
                    const event = JSON.parse(message.body);

                    if (event.actorId !== this.actorId) {
                        onEventReceived(event);
                    }
                });
            }
        });

        this.stompClient.activate();
    },

    publish(type, payload) {
        if (!this.stompClient || !this.stompClient.connected) return;

        const eventEnvelope = {
            eventId: crypto.randomUUID(),
            boardId: this.boardId,
            type: type,
            actorId: this.actorId,
            occurredAt: new Date().toISOString(),
            payload: payload
        };

        this.stompClient.publish({
            destination: `/app/boards/${this.boardId}/events`,
            body: JSON.stringify(eventEnvelope)
        });
    }
};