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
        this.networkGamepads = [];
        this.clientGamepadIndices = new Map();
        this.status = 'disconnected';
        this.stats = {
            bytesReceived: 0,
            bytesSent: 0,
            messagesReceived: 0,
            messagesSent: 0
        }
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 2000;
        this.reconnectTimeout = null;
    }

    static getInstance() {
        if (!FWNetwork.#instance) {
            FWNetwork.#instance = new FWNetwork();
        }
        return FWNetwork.#instance;
    }

    init(options) {
        this.options = options
    }
    hostRoom(roomName) {
        this.isHost = true;
        this.roomId = roomName;
        
        if (this.peer) {
            if (this.peer.disconnected) {
                this.peer.reconnect()
                if (!this.peer.disconnected) {
                    this.status = 'hosting';
                    this.reconnectAttempts = 0;
                } else {
                    this.attemptReconnect();
                }
            } else {
                console.log('host reconnecting but is not disconnected')
            }
        } else {
            this.peer = new Peer(roomName, this.options);

            this.peer.on('open', (id) => {
                this.status = 'hosting';
                this.reconnectAttempts = 0;
                console.log(`PeerJS initialized with ID: ${id}`);
                console.log(`Hosting room: ${id}`);
            });
    
            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                this.status = 'error';
                console.log(this.getPeerErrorMessage(err))
                switch(err.type) {
                    case 'network':
                    case 'webrtc':
                    case 'socket-closed':
                    case 'socket-error':
                    case 'server-error':
                        this.attemptReconnect();
                }

            });
    
            this.peer.on('disconnected', () => {
                console.log('Disconnected from PeerJS server');
                this.status = 'disconnected';
                this.attemptReconnect();
            });
            
            this.peer.on('connection', (conn) => {
                console.log(`Client connected: ${conn.peer}`);
                this.#setupHostConnection(conn);
                this.status = `hosting`;
            });
    
            this.peer.on('open', (id) => {
                this.status = 'open';
            });
        }
        
    }

    #connectAsClient(roomId) {

        console.log(`Connecting to room: ${roomId} as ${this.peer.id}`);
        this.status = 'connecting';
        this.connection = this.peer.connect(roomId);
        this.connection.on('open', () => {
            console.log(`Connected to host: ${roomId}`); 
            this.reconnectAttempts = 0;
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
            this.attemptReconnect()
        });

        this.connection.on('error', (err) => {
            console.error('Connection error:', err);
            this.status = 'error';
            this.attemptReconnect()
        });
    }

    connectToRoom(roomId) {
        this.isHost = false;
        this.roomId = roomId;
        let peerId = sessionStorage.getItem('clientId') || null

        if (this.peer) {
            if (this.peer.disconnected) {
                console.log('client reconnecting and is NOT connected to the network')
                this.peer.reconnect()
            } 
            
            if (!this.peer.disconnected) {
                console.log('connected to the network and trying to connect to the room now')
                this.#connectAsClient(roomId)
            } else {
                console.log('reconnecting to the network did not work, trying it again ')
                this.attemptReconnect();
            }
            
        } else {
            this.peer = new Peer(peerId, this.options)

            this.peer.on('open', (id) => {
                sessionStorage.setItem('clientId', id)
                console.log(`PeerJS initialized with ID: ${id}`);
                this.#connectAsClient(roomId)
            });

            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                console.log(this.getPeerErrorMessage(err))
                this.status = 'error';
                if (err.type === 'unavailable-id') {
                    sessionStorage.removeItem('clientId')
                    this.peer.destroy()
                    this.peer = null 
                    this.attemptReconnect();
                } else {
                    this.attemptReconnect();
                }
            });

            this.peer.on('disconnected', () => {
                console.log('Disconnected from PeerJS server');
                this.status = 'disconnected';
                this.attemptReconnect();
            });

        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Maxi retry connections reached');
             this.status = 'error'
            return;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout); // Vorherigen Timeout löschen
        }

        let delay =  Math.pow(1.5, this.reconnectAttempts)* this.reconnectDelay
        this.reconnectAttempts++;
        this.status = 'connecting'
        console.log(`Trying to connect again (${this.reconnectAttempts}/${this.maxReconnectAttempts}) with delay ${delay/1000}s...`);

        this.reconnectTimeout = setTimeout(() => {
            if (this.isHost) {
                this.hostRoom(this.roomId);
            } else {
                this.connectToRoom(this.roomId);
            }

        },delay);
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

    getAllIceConnectionStates() {
        if (!this.peer || !this.peer.connections) {
            return "no active peer connections";
        }
    
        let states = {};
        for (const [peerId, connections] of Object.entries(this.peer.connections)) {
            if (connections.length > 0 && connections[0].peerConnection) {
                states[peerId] = connections[0].peerConnection.iceConnectionState;
            } else {
                states[peerId] = "no connection";
            }
        }
    
        return states;
    }

    async getTurnUsage() {
        if (!this.peer || !this.peer.connections) {
            return "no active peer connections";
        }
    
        let turnUsage = {};
    
        for (const [peerId, connections] of Object.entries(this.peer.connections)) {
            if (connections.length > 0 && connections[0].peerConnection) {
                const pc = connections[0].peerConnection;
                turnUsage[peerId] = await this.#checkTurnUsage(pc);
            } else {
                turnUsage[peerId] = "no connection";
            }
        }
    
        return turnUsage;
    }
    
    async #checkTurnUsage(peerConnection) {
        let foundRelay = false;
    
        const stats = await peerConnection.getStats();
        stats.forEach(report => {
            if (report.type === "candidate-pair" && report.nominated && report.state === "succeeded") {
                if (report.remoteCandidateType === "relay") {
                    foundRelay = true;
                }
            }
        });
    
        return foundRelay ? "TURN" : "P2P";
    }

    getPeerErrorMessage(err) {
        let msg = ''
        switch(err.type) {
            case 'browser-incompatible':
                msg = 'The client\'s browser does not support some or all WebRTC features that you are trying to use.'
                break;
            case 'disconnected':
                msg = 'You\'ve already disconnected this peer from the server and can no longer make any new connections on it.'
                break;
            case 'invalid-id':
                msg = 'The ID passed into the Peer constructor contains illegal characters.'
                break;
            case 'invalid-key':
                msg = 'The API key passed into the Peer constructor contains illegal characters or is not in the system (cloud server only).'
                break;
            case 'network':
                msg = 'Lost or cannot establish a connection to the signalling server.'
                break;
            case 'peer-unavailable':
                msg = 'The peer you\'re trying to connect to does not exist.'
                break;
            case 'ssl-unavailable':
                msg = 'PeerJS is being used securely, but the cloud server does not support SSL. Use a custom PeerServer.'
                break;
            case 'server-error':
                msg = 'Unable to reach the server.'
                break;
            case 'socket-error':
                msg = 'An error from the underlying socket.'
                break;
            case 'socket-closed':
                msg = 'The underlying socket closed unexpectedly.'
                break;
            case 'unavailable-id':
                msg = 'The ID passed into the Peer constructor is already taken.'
                break;
            case 'webrtc':
                msg = 'Native WebRTC errors.'
                break;
            default: 
                msg = 'unknown error'
                break;
        }

        return msg
    }
}