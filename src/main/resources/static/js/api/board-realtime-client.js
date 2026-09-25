// Encapsula toda la conexión, suscripción, serialización y publicación STOMP.
// Ningún otro módulo debe conocer /app, /topic ni el cliente StompJs directamente.
export const BoardRealtimeClient = {
    stompClient: null,
    subscription: null,
    boardId: null,
    actorId: crypto.randomUUID(),

    connect(boardId, onEventReceived) {
        this.disconnect();
        this.boardId = boardId;

        this.stompClient = new StompJs.Client({
            brokerURL: `ws://${window.location.host}/ws`,
            reconnectDelay: 5000,
            onConnect: () => {
                this.subscription = this.stompClient.subscribe(`/topic/boards/${boardId}`, (message) => {
                    const event = JSON.parse(message.body);

                    // El emisor ya aplicó el cambio localmente (optimistic UI);
                    // solo se procesan eventos que vienen de otros participantes.
                    if (event.actorId !== this.actorId) {
                        onEventReceived(event);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame.headers['message'], frame.body);
            }
        });

        this.stompClient.activate();
    },

    disconnect() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = null;
        }
        this.boardId = null;
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