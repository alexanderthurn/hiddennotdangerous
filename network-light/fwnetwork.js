class FWNetwork {
    static #instance = null;

    constructor() {
        if (FWNetwork.#instance) {
            throw new Error("Use FWNetwork.getInstance() to get the singleton instance.");
        }
        this.qrCode = null;
        this.peer = null;
        this.connection = null;
        this.roomId = null;
        this.isHost = false;
        this.initialized = false;
        this.networkGamepads = [];
        this.clientGamepadIndices = new Map();
        this.status = 'disconnected';
    }

    static getInstance() {
        if (!FWNetwork.#instance) {
            FWNetwork.#instance = new FWNetwork();
        }
        return FWNetwork.#instance;
    }

    // Initialisiert die PeerJS-Verbindung mit optionalen Konfigurationen
    initialize(peerId = null, options = {}) {
        if (this.initialized) {
            console.log("FWNetwork already initialized");
            return;
        }

        const defaultIceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];

        const defaultOptions = {
            debug: 3,
            config: {
                iceServers: defaultIceServers
            }
        };

        const peerOptions = {
            ...defaultOptions,
            ...options,
            config: {
                ...defaultOptions.config,
                ...(options.config || {}),
                iceServers: options.config?.iceServers || defaultIceServers
            }
        };

        // Wenn peerId angegeben ist (für Host), nutze es; sonst lass PeerJS eine ID generieren (für Client)
        this.peer = peerId ? new Peer(peerId, peerOptions) : new Peer(peerOptions);

        this.peer.on('open', (id) => {
            this.initialized = true;
            this.roomId = id;
            this.status = this.isHost ? 'hosting' : 'connecting';
            console.log(`PeerJS initialized with ID: ${id}`);
            if (this.isHost) {
                console.log(`Hosting room: ${id}`);
            }
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            this.status = 'error';
        });

        this.peer.on('disconnected', () => {
            console.log('Disconnected from PeerJS server');
            this.initialized = false;
            this.status = 'disconnected';
        });
    }

    // Erstellt oder aktualisiert einen QR-Code für die Netzwerkverbindung
    getQRCodeTexture(url, backgroundColor) {
        if (!url) {
            console.error('URL for QR code is required');
            return null;
        }
        if (!this.qrCode) {
            this.qrCode = new QRious({
                value: url,
                background: backgroundColor.toHex(),
                backgroundAlpha: 1.0,
                foreground: 'brown',
                foregroundAlpha: 0.8,
                level: 'H',
                padding: 100,
                size: 1024,
            });
        } else {
            this.qrCode.value = url;
        }
        return this.qrCode;
    }

    // Hostet einen Raum mit der angegebenen roomName als feste Peer-ID
    hostRoom(roomName, baseUrl, backgroundColor, options = {}) {
        if (!this.peer) {
            this.initialize(roomName, options); // Übergib roomName als Peer-ID
        }

        this.isHost = true;
        this.roomId = roomName;

        this.peer.on('connection', (conn) => {
            console.log(`Client connected: ${conn.peer}`);
            this.#setupHostConnection(conn);
            this.status = `hosting`;
        });

        this.peer.on('open', (id) => {
            const url = `${baseUrl}?id=${id}`;
            this.getQRCodeTexture(url, backgroundColor);
            this.status = 'open';
        });
    }

    // Verbindet sich zu einem bestehenden Raum
    connectToRoom(roomId, options = {}) {
        if (!this.peer) {
            this.initialize(null, options); // Keine feste ID für Client
        }

        this.isHost = false;
        this.roomId = roomId;

        this.peer.on('open', (myId) => {
            console.log(`Connecting to room: ${roomId} as ${myId}`);
            this.connection = this.peer.connect(roomId);

            this.status = 'open';

            this.connection.on('open', () => {
                console.log(`Connected to host: ${roomId}`);
                this.status = 'connected';
            });

            this.#setupConnectionHandlers(this.connection);
        });
    }

    // Client: Sendet Gamepads manuell mit touchGamepad als Parameter
    sendGamepads(touchGamepad) {
        if (!this.connection || !this.connection.open) {
            console.log('No active connection to send gamepads');
            return;
        }
        if (!(touchGamepad instanceof FWNetworkGamepad)) {
            console.error('touchGamepad must be a NetworkGamepad instance');
            return;
        }

        const realGamepads = navigator.getGamepads();
        const gamepads = [touchGamepad];
        for (let i = 0; i < 4 && i < realGamepads.length; i++) {
            if (realGamepads[i]) {
                const netGamepad = new FWNetworkGamepad();
                netGamepad.setFromRealGamepad(realGamepads[i]);
                gamepads.push(netGamepad);
            }
        }

        const gamepadData = gamepads.map((gp, index) => ({
            index: index,
            bytes: gp.toByteArray()
        }));

        this.sendData(gamepadData);
    }

    // Host: Verarbeitet eingehende Gamepad-Daten
    #setupHostConnection(conn) {
        const clientId = conn.peer;
        const indices = [];
        for (let i = 0; i < 5; i++) {
            indices.push(this.networkGamepads.length);
            this.networkGamepads.push(new FWNetworkGamepad());
        }
        this.clientGamepadIndices.set(clientId, indices);

        conn.on('data', (data) => {
            if (Array.isArray(data)) {
                data.forEach(({ index, bytes }) => {
                    if (index >= 0 && index < 5) {
                        const gpIndex = this.clientGamepadIndices.get(clientId)[index];
                        this.networkGamepads[gpIndex].fromByteArray(bytes);
                    }
                });
            }
        });

        conn.on('close', () => {
            console.log(`Client disconnected: ${clientId}`);
            const indices = this.clientGamepadIndices.get(clientId);
            indices.forEach((idx) => {
                this.networkGamepads[idx] = undefined;
            });
            this.clientGamepadIndices.delete(clientId);
            this.status = `hosting`;
        });

        conn.on('error', (err) => {
            console.error(`Connection error with ${clientId}:`, err);
        });
    }

    // Universelle Verbindungs-Handler (für Client)
    #setupConnectionHandlers(conn) {
        conn.on('data', (data) => {
            console.log('Received data:', data);
        });

        conn.on('close', () => {
            console.log('Connection closed');
            this.connection = null;
            this.status = 'disconnected';
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            this.status = 'error';
        });
    }

    // Sendet Daten über die aktive Verbindung
    sendData(data) {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        } else {
            console.log('No active connection to send data');
        }
    }

    // Host: Gibt alle Gamepads zurück (lokal + Netzwerk), Client: nur lokal
    getAllGamepads() {
        if (!this.isHost) {
            console.log('Full gamepad list only available on host; returning local gamepads');
            return this.getLocalGamepads();
        }
        const localGamepads = Array.from(navigator.getGamepads());
        const allGamepads = [...localGamepads, ...this.networkGamepads];
        return allGamepads;
    }

    // Gibt nur die Netzwerk-Gamepads zurück (nur relevant für Host)
    getNetworkGamepads() {
        return this.networkGamepads;
    }

    // Gibt nur die lokalen Gamepads zurück
    getLocalGamepads() {
        return Array.from(navigator.getGamepads());
    }

    // Gibt die Anzahl der verbundenen Clients zurück
    getConnectedClients() {
        return this.clientGamepadIndices.size;
    }

    // Gibt den aktuellen Status der Verbindung zurück
    getStatus() {
        return this.status;
    }
}