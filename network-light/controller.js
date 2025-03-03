// ICE-Server-Konfiguration für PeerJS
const iceServers = [
    {
        urls: 'stun:stun.relay.metered.ca:80',
    },
    {
        urls: 'turn:global.relay.metered.ca:80',
        username: 'edd2a0f22e4c5a5f1ccc546a',
        credential: 'bW5ZvhYwl1tPH6o0',
    },
    {
        urls: 'turn:global.relay.metered.ca:80?transport=tcp',
        username: 'edd2a0f22e4c5a5f1ccc546a',
        credential: 'bW5ZvhYwl1tPH6o0',
    },
    {
        urls: 'turn:global.relay.metered.ca:443',
        username: 'edd2a0f22e4c5a5f1ccc546a',
        credential: 'bW5ZvhYwl1tPH6o0',
    },
    {
        urls: 'turns:global.relay.metered.ca:443?transport=tcp',
        username: 'edd2a0f22e4c5a5f1ccc546a',
        credential: 'bW5ZvhYwl1tPH6o0',
    },
];

const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1); 
const version = '1.0.0';
const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

var touchControl = null;
var gamepad = new FWNetworkGamepad();
var prevGamepadState = null; // Vorheriger Zustand des Gamepads
const maxMessagesPerSecond = 60; // Maximal 60 Nachrichten pro Sekunde
var messageCount = 0; // Zähler für gesendete Nachrichten in der aktuellen Sekunde
var currentSecond = Math.floor(Date.now() / 1000); // Aktuelle Sekunde

function setUrlParams(id) {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    if (id) params.set('id', id);
    url.search = params.toString();
    window.history.replaceState({}, '', url);
}

async function init() {
    const app = new FWApplication();
    await app.init({
        title: 'F-Mote',  
        version: version,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xf4b400,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: window
    });

    initDialog(app);
    app.setLoading(0.0, 'Loading');
    touchControl = new FWTouchControl(app);
    app.containerGame.addChild(touchControl);

    app.serverId = getQueryParam('id') || '1234';
    app.color = new PIXI.Color(getQueryParam('color') || 'ff0000').toNumber();
    app.connectedToServer = false;

    const network = FWNetwork.getInstance();
    network.connectToRoom(app.serverId, { config: { iceServers: iceServers } });

    network.peer.on('open', () => {
        console.log(`Connected to server: ${app.serverId}`);
        app.connectedToServer = true;
    });

    network.peer.on('error', (err) => {
        console.error('Connection error:', err);
        app.connectedToServer = false;
    });

    app.finishLoading();

    app.ticker.add((ticker) => {
        app.isPortrait = app.screen.width < app.screen.height;
        app.ticker = ticker;

        if (app.isPortrait) {
            app.containerGame.angle = -270 - ticker.lastTime * 0.0;
            app.containerGame.x = app.screen.width;
            app.containerGame.screenWidth = app.screen.height;
            app.containerGame.screenHeight = app.screen.width;    
        } else {
            app.containerGame.angle = 0;
            app.containerGame.x = 0;
            app.containerGame.scale.set(1, 1);
            app.containerGame.screenWidth = app.screen.width;
            app.containerGame.screenHeight = app.screen.height;
        }

        main(app);
    });
}

window.addEventListener("load", (event) => {
    init();
});

function serializeGamepad(gamepad) {
    return JSON.stringify({
        axes: gamepad.axes,
        buttons: gamepad.buttons.map(b => b.pressed)
    });
}

function main(app) {
    touchControl.update(app);
    touchControl.updateGamepad(gamepad);

    const currentState = serializeGamepad(gamepad);
    const now = Date.now();
    const second = Math.floor(now / 1000);

    // Neue Sekunde? Zähler zurücksetzen
    if (second > currentSecond) {
        currentSecond = second;
        messageCount = 0;
    }

    // Senden, wenn Zustand geändert und Limit nicht erreicht
    if (prevGamepadState !== currentState && messageCount < maxMessagesPerSecond) {
        if (app.connectedToServer) {
            const network = FWNetwork.getInstance();
            network.sendGamepads(gamepad);
            messageCount++; // Zähler erhöhen
            prevGamepadState = currentState; // Zustand speichern
        }
    }
}