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
        this.stats = {
            bytesReceived: 0,
            bytesSent: 0,
            messagesReceived: 0,
            messagesSent: 0
        }
        this.reconnectAttempts = Number.parseInt(sessionStorage.getItem('reconnectAttempts') || '0');
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.reconnectTimeout = null;
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
            this.reconnectAttempts = 0;
            sessionStorage.setItem('reconnectAttempts',this.reconnectAttempts)
            
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
            if (err.type === 'unavailable-id') {
                sessionStorage.removeItem('clientId')
                if (!this.initialized && !options.initializedBefore) {
                    options.initializedBefore = true
                    this.initialize(peerId, options)
                }
            } else {
                this.attemptReconnect(options);
            }
        });

        this.peer.on('disconnected', () => {
            console.log('Disconnected from PeerJS server');
            this.initialized = false;
            this.status = 'disconnected';
            this.attemptReconnect(options);
        });
    }

    attemptReconnect(options) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Maxi retry connections reached');
            return;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout); // Vorherigen Timeout löschen
        }

        this.reconnectAttempts++;
        let delay =  Math.pow(2, this.reconnectAttempts)* this.reconnectDelay
        this.status = 'connecting'
        console.log(`Trying to connect again (${this.reconnectAttempts}/${this.maxReconnectAttempts}) with delay ${delay/1000}s...`);

        this.reconnectTimeout = setTimeout(() => {
           // this.peer.destroy(); // Alte Peer-Instanz aufräumen
        //    this.peer = null;
           // this.initialized = false;

            if (this.isHost) {
                this.hostRoom(this.roomId, options.baseUrl, options.backgroundColor, options);
            } else {
                //this.connectToRoom(this.roomId, options);
                //this.#connectAsClient(this.roomId, options)
                sessionStorage.setItem('reconnectAttempts',this.reconnectAttempts)
                window.location.reload()
            }

            
            
        },delay);
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

    #connectAsClient(roomId, options) {
        this.status = 'open';
        this.connection = this.peer.connect(roomId);
        this.connection.on('open', () => {
            console.log(`Connected to host: ${roomId}`); 
            this.reconnectAttempts = 0;
            sessionStorage.setItem('reconnectAttempts',this.reconnectAttempts)
            this.status = 'connected';
        });

        this.connection.on('data', (data) => {
            this.stats.messagesReceived++
            let uint8array = new Uint8Array(data)
            this.stats.bytesReceived+=uint8array.length

            console.log('Received data:', data);
        });

        this.connection.on('close', () => {
            console.log('Connection closed');
            this.connection = null;
            this.status = 'disconnected';
            this.attemptReconnect(options)
        });

        this.connection.on('error', (err) => {
            console.error('Connection error:', err);
            this.status = 'error';
            this.attemptReconnect(options)
        });
    }
    // Verbindet sich zu einem bestehenden Raum
    connectToRoom(roomId, options = {}) {
        if (!this.peer) {
            this.initialize(sessionStorage.getItem('clientId'), options); // Keine feste ID für Client
        }

        this.isHost = false;
        this.roomId = roomId;

        this.peer.on('open', (myId) => {
            sessionStorage.setItem('clientId', myId)
            console.log(`Connecting to room: ${roomId} as ${myId}`);
       
            this.#connectAsClient(roomId, options)
            
        });
    }

    
    getJSONGamepadsButtonsOnlyState(touchGamepad) {
        
        const realGamepads = navigator.getGamepads();
        const gamepads = [touchGamepad, undefined, undefined, undefined, undefined];
        for (let i = 0; i < 4 && i < realGamepads.length; i++) {
            if (realGamepads[i] && realGamepads[i].connected) {
                const netGamepad = new FWNetworkGamepad();
                netGamepad.setFromRealGamepad(realGamepads[i]);
                gamepads[1+i] = netGamepad;
            }
        }

            return JSON.stringify(gamepads.map(gamepad => gamepad?.buttons.map(b => b.pressed)
        ));
    }

    getGamepadData(touchGamepad) {
        const realGamepads = navigator.getGamepads();
        const gamepads = [touchGamepad, undefined, undefined, undefined, undefined];
        for (let i = 0; i < 4 && i < realGamepads.length; i++) {
            if (realGamepads[i] && realGamepads[i].connected ) {
                const netGamepad = new FWNetworkGamepad();
                netGamepad.setFromRealGamepad(realGamepads[i]);
                gamepads[1+i] = netGamepad;
            }
        }

        const gamepadData = FWFixedSizeByteArray.merge(
            gamepads.map((gp) => gp && gp.toByteArray()));


        return gamepadData
    }

    sendGamepadData(gamepadData) {
        if (!this.connection || !this.connection.open) {
            console.log('No active connection to send gamepads');
            return;
        }

        this.sendData(gamepadData);
    }

    // Host: Verarbeitet eingehende Gamepad-Daten
    #setupHostConnection(conn) {
        const clientId = conn.peer;
        if (this.clientGamepadIndices.get(clientId)) {
            console.log('reconnecting client found, reusing indices')
            const indices = this.clientGamepadIndices.get(clientId)
            indices.forEach((idx) => {
                this.networkGamepads[idx] = new FWNetworkGamepad();
            });
        } else {
            const indices = [];
            for (let i = 0; i < 5; i++) {
                indices.push(this.networkGamepads.length);
                this.networkGamepads.push(new FWNetworkGamepad());
            }
            this.clientGamepadIndices.set(clientId, indices);
        }


        conn.on('data', (data) => {
            
            let uint8array = new Uint8Array(data)
            this.stats.messagesReceived++
            this.stats.bytesReceived+=uint8array.length

            let arr = FWFixedSizeByteArray.extract(uint8array)
            for (let i=0;i<5;i++) {
                const gpIndex = this.clientGamepadIndices.get(clientId)[i];
                if (arr[i]) {
                    this.networkGamepads[gpIndex].fromByteArray(arr[i].buffer);
                } else {
                    this.networkGamepads[gpIndex].connected = false
                }
               
            }
            
        });

        conn.on('close', () => {
            console.log(`Client disconnected: ${clientId}`);
            const indices = this.clientGamepadIndices.get(clientId);
            indices.forEach((idx) => {
                this.networkGamepads[idx] = undefined;
            });
            this.status = `hosting`;
        });

        conn.on('error', (err) => {
            console.error(`Connection error with ${clientId}:`, err);
        });
    }

    
    // Sendet Daten über die aktive Verbindung
    sendData(data) {

        if (this.connection && this.connection.open) {
            this.stats.messagesSent++
            let uint8array = new Uint8Array(data)
            this.stats.bytesSent+=uint8array.length

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

    // Statistiken
    getStats() {
        return this.stats;
    }
}