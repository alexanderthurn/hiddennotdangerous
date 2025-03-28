const CONNECTION_STATUS_OFF = 0
const CONNECTION_STATUS_INITIALIZNG = 1
const CONNECTION_STATUS_WORKING = 2
const CONNECTION_STATUS_ERROR = 3

const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1); 
const version = '1.1.0';
const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

var touchControl = null;
var gamepad = new FWNetworkGamepad();
var prevGamepadState = null; // Vorheriger Zustand des Gamepads
var prevGamepadStateMustSent = null
const maxMessagesPerSecond = 20; // Maximal 20 Nachrichten pro Sekunde
const minDelay = 50; // Mindestabstand zwischen zwei Nachrichten in Millisekunden (z. B. 50ms)
var messageCount = 0; // Zähler für gesendete Nachrichten in der aktuellen Sekunde
var currentSecond = Math.floor(Date.now() / 1000); // Aktuelle Sekunde
var lastSentTime = 0; // Zeitpunkt des letzten Sendens

function setUrlParam(name, value) {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    if (value) params.set(name, value);
    url.search = params.toString();
    window.history.replaceState({}, '', url);
}

function getPixelPerCentimeter() {
    const pxPerCm = document.getElementById('1cm').offsetWidth
    return pxPerCm
}

function centimeterToPixel(cm) {
    return cm * getPixelPerCentimeter()
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

    app.serverPrefix = 'hidden'
    app.serverId = getQueryParam('id') || '';
    app.color = new PIXI.Color(getQueryParam('color') || 'ff0000');
    app.layout = getQueryParam('layout') || 'simple';
    app.mode = getQueryParam('mode') || 'default';
    app.connectionStatus = CONNECTION_STATUS_OFF;

    const network = FWNetwork.getInstance();
   
    app.connectionStatus = CONNECTION_STATUS_INITIALIZNG;

    if (app.serverId && app.serverId !== '') {
        network.connectToRoom(app.serverPrefix + app.serverId);
        network.peer.on('error', (err) => {
            console.error('Connection error:', err);
        });
    } else if (app.mode !== 'dev') {
        app.settingsDialog.show();
    }
   

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

function main(app) {
    let networkStatus= FWNetwork.getInstance().getStatus()

    switch (networkStatus) {
        case 'connected':
            app.connectionStatus = CONNECTION_STATUS_WORKING
            break;
        case 'disconnected':
            app.connectionStatus = CONNECTION_STATUS_OFF
            break;
        case 'connecting':
            app.connectionStatus = CONNECTION_STATUS_INITIALIZNG
            break;
        case 'error': 
            app.connectionStatus = CONNECTION_STATUS_ERROR
            break;
        case 'open':
            app.connectionStatus = CONNECTION_STATUS_INITIALIZNG
            break;  
        case 'hosting':
            app.connectionStatus = CONNECTION_STATUS_WORKING
            break;       
    }


    touchControl.update(app);
    touchControl.updateGamepad(gamepad);

    const currentState = FWNetwork.getInstance().getGamepadData(gamepad);
    const currentStateMustSent =  FWNetwork.getInstance().getJSONGamepadsButtonsOnlyState(gamepad);
    const now = Date.now();
    const second = Math.floor(now / 1000);

    // Neue Sekunde? Zähler zurücksetzen
    if (second > currentSecond) {
        currentSecond = second;
        messageCount = 0;
    }

    // Senden, wenn Zustand geändert, Limit nicht erreicht und Mindestdelay eingehalten
    if ((currentStateMustSent !== currentStateMustSent) || 
        (!FWFixedSizeByteArray.areUint8ArraysEqual(prevGamepadState,currentState) && 
        messageCount < maxMessagesPerSecond && 
        now - lastSentTime >= minDelay)
        ) {
        if (app.connectionStatus === CONNECTION_STATUS_WORKING) {
            const network = FWNetwork.getInstance();
            network.sendGamepadData(currentState);
            messageCount++; // Zähler erhöhen
            lastSentTime = now; // Zeitpunkt des Sendens aktualisieren
            prevGamepadState = currentState; // Zustand speichern
            prevGamepadStateMustSent = currentStateMustSent
        }
    }
}