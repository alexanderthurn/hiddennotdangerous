const version = '1.0.0';

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

// Funktion, um URL-Parameter auszulesen
const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
};

// Funktion, um die Anwendung mit Pixi.js zu initialisieren
async function init() {
    const color = new PIXI.Color(getQueryParam('color') || '00aa00');
    const app = new FWApplication({});

    await app.init({
        title: 'F-Mote Example',
        version: version,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: color.toNumber(),
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: window
    });

    app.serverId = getQueryParam('id') || '666';
    app.color = color;
    const baseUrl = `${window.location.protocol}//${window.location.host.replace('localhost', '7.7.7.66')}${window.location.pathname.replace('example.html', 'controller.html')}`;
    app.url = `${baseUrl}?id=${app.serverId}&color=${app.color.toHex().replace(/^#/, '')}`;

    // FWNetwork als Host initialisieren mit iceServers
    const network = FWNetwork.getInstance();
    network.hostRoom(app.serverId, baseUrl, app.color, {
        config: { iceServers: iceServers }
    });

    // UI-Elemente erstellen
    app.textUrl = new PIXI.Text({
        text: app.url,
        style: { fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center' }
    });
    app.textServerId = new PIXI.Text({
        text: app.serverId,
        style: { fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center' }
    });
    app.textNetwork = new PIXI.Text({
        text: '',
        style: { fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center' }
    });
    app.textNetwork.anchor.set(1.0, 0.0);
    app.textUrl.anchor.set(0.5, 1.0);
    app.textServerId.anchor.set(0.5, 0.0);

    app.containerQrCode = new PIXI.Container();
    // QR-Code laden
    network.peer.on('open', async () => {
        const qrCode = network.getQRCodeTexture(app.url, app.color);
        const dataUrl = qrCode.toDataURL();
        const qrTexture = await PIXI.Assets.load(dataUrl);
        app.qrCodeSprite = new PIXI.Sprite(qrTexture);
        app.qrCodeSprite.anchor.set(0.5);
        app.containerQrCode.addChild(app.qrCodeSprite);
    });

    // Container für Figuren
    app.figures = {};
    app.containerFigures = new PIXI.Container();

    // Szene zusammensetzen
    app.containerGame.addChild(app.containerQrCode, app.containerFigures);
    app.containerGame.addChild(app.textUrl, app.textServerId, app.textNetwork);

    app.finishLoading();

    // Ticker für Animation
    app.ticker.add((ticker) => {
        app.isPortrait = app.screen.width < app.screen.height;
        app.tickerInstance = ticker;
        app.containerGame.screenWidth = app.screen.width;
        app.containerGame.screenHeight = app.screen.height;

        main(app);
    });
}

window.addEventListener("load", (event) => {
    init();
});

// Hauptlogik für jedes Frame
function main(app) {
    const network = FWNetwork.getInstance();
    const gamepads = network.getAllGamepads();

    // UI-Positionierung und Status
    app.textUrl.width = app.containerGame.screenWidth * 0.95;
    app.textUrl.scale.y = app.textUrl.scale.x;
    app.textUrl.position.set(app.containerGame.screenWidth * 0.5, app.containerGame.screenHeight * 1.0);

    app.textNetwork.text = `${network.getStatus()} | G: ${network.getLocalGamepads().filter(x => x && x.connected).length}, R: ${network.getNetworkGamepads().filter(x => x && x.connected).length}, F: ${Object.keys(app.figures).length}`;
    app.textNetwork.position.set(app.containerGame.screenWidth, app.containerGame.screenHeight * 0.0);
    app.textServerId.position.set(app.containerGame.screenWidth * 0.5, app.containerGame.screenHeight * 0.0);

    if (app.qrCodeSprite) {
        app.qrCodeSprite.position.set(app.containerGame.screenWidth * 0.5, app.containerGame.screenHeight * 0.5);
        const qrWidth = Math.min(app.containerGame.screenHeight, app.containerGame.screenWidth) * 0.95;
        app.qrCodeSprite.width = qrWidth;
        app.qrCodeSprite.height = qrWidth;
    }

    // Figuren aktualisieren
    Object.keys(app.figures).forEach((key) => {
        const figure = app.figures[key];
        figure.visible = true;
        figure.body.scale.set(app.containerGame.screenWidth * 0.05);
        figure.x += app.tickerInstance.deltaTime * figure.gamepad.axes[0] * 2;
        figure.y += app.tickerInstance.deltaTime * figure.gamepad.axes[1] * 2;
        figure.body.tint = figure.gamepad.buttons.some(b => b.pressed) ? 0x000000 : 0xffffff;
        figure.gamepadFoundInCurrentLoop = false;
    });

    // Gamepads verarbeiten und Figuren erstellen/aktualisieren
    gamepads.forEach((gamepad, index) => {
        if (gamepad && gamepad.connected) {
            const key = `g${index}`;
            if (!app.figures[key]) {
                const figure = new PIXI.Container();
                figure.body = new PIXI.Graphics().circle(0, 0, 1).fill({ alpha: 1.0, color: 0xffffff });
                figure.addChild(figure.body);
                figure.position.set(app.containerGame.screenWidth * 0.5, app.containerGame.screenHeight * 0.5);
                app.containerFigures.addChild(figure);
                app.figures[key] = figure;
            }
            app.figures[key].gamepadFoundInCurrentLoop = true;
            app.figures[key].gamepad = gamepad;
        }
    });

    // Nicht gefundene Figuren entfernen
    Object.keys(app.figures).forEach((key) => {
        const figure = app.figures[key];
        if (!figure.gamepadFoundInCurrentLoop) {
            app.containerFigures.removeChild(figure);
            delete app.figures[key];
        }
    });
}