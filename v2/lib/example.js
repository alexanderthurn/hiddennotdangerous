const version = '1.0.0';

// Funktion, um die Anwendung mit Pixi.js zu initialisieren
async function init() {
    const color = new PIXI.Color(FWNetwork.getQueryParam('color') || '00aa00');
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
    // FWNetwork als Host initialisieren mit iceServers
    const network = FWNetwork.getInstance();
    network.hostRoom();

    app.roomNumber = 0;
    app.url = ''

    // UI-Elemente erstellen
    app.textUrl = new PIXI.Text({
        text: '',
        style: { fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center' }
    });
    app.textNetwork = new PIXI.Text({
        text: '',
        style: { fontFamily: 'Arial', fontSize: 16, fill: 0xffffff, align: 'center' }
    });
    
    app.textNetwork.anchor.set(1.0, 0.0);
    app.textUrl.anchor.set(0.5, 1.0);
  
    app.containerQrCode = new PIXI.Container();
    app.qrCodeSprite = new PIXI.Sprite();
    app.qrCodeSprite.anchor.set(0.5);
    app.containerQrCode.addChild(app.qrCodeSprite);

    app.touchControl = new FWTouchControl(app, {isPassive: true, layout: 'simple', color: color});
    app.containerGame.addChild(app.touchControl);
    // Container für Figuren
    app.figures = {};
    app.containerFigures = new PIXI.Container();

    // Szene zusammensetzen
    app.containerGame.addChild(app.containerQrCode, app.containerFigures);
    app.containerGame.addChild(app.textUrl, app.textNetwork);

    app.finishLoading();

    // Ticker für Animation
    app.ticker.add((ticker) => {
        app.isPortrait = app.screen.width < app.screen.height;
        app.tickerInstance = ticker;
        main(app);
    });


    setInterval(() => {
        FWNetwork.getInstance().getTurnUsage();
    }, 2000)
}

window.addEventListener("load", (event) => {
    init();
});

// Hauptlogik für jedes Frame
function main(app) {

    // UI-Positionierung und Status
    const nw = FWNetwork.getInstance()
    const gamepads = nw.getAllGamepads();
    const nwStats = nw.getStats()
    app.textNetwork.text = `Status: ${nw.getStatus()} Relay: ${nwStats.reported.foundRelay}
    G: ${nw.getLocalGamepads().filter(x => x && x.connected).length}, R: ${nw.getNetworkGamepads().filter(x => x && x.connected).length}, F: ${Object.keys(app.figures).length} M: ${nwStats.messagesReceived} 
    BR:  ${nwStats.reported.bytesReceived} / ${nwStats.bytesReceived} BS: ${nwStats.reported.bytesSent} / ${nwStats.bytesReceived}
    RT:  ${(1000*nwStats.reported.currentRoundTripTime).toFixed(4)} / ${(1000*nwStats.reported.totalRoundTripTime).toFixed(4)}
    `;
    app.textNetwork.position.set(app.screen.width, app.screen.height * 0.0);

    app.textUrl.text = nw.qrCodeBaseUrl + "\n" + nw.roomNumber
    app.qrCodeSprite.texture = nw.qrCodeTexture


    app.qrCodeSprite.position.set(app.screen.width * 0.75, app.screen.height * 0.5);
    const qrWidth = Math.min(app.screen.height, app.screen.width) * 0.5;
    app.qrCodeSprite.width = qrWidth;
    app.qrCodeSprite.height = qrWidth;

    app.textUrl.width =  app.qrCodeSprite.width*0.8;
    app.textUrl.scale.y = app.textUrl.scale.x;
    app.textUrl.position.set(app.screen.width * 0.5, app.screen.height * 1.0);

    app.touchControl.update(app, {x: app.screen.width * 0.1 + qrWidth*0.1, y: app.screen.height * 0.25+ qrWidth*0.1, wantedWidth: qrWidth*0.8, wantedHeight: qrWidth*0.8});
   

    // Figuren aktualisieren
    Object.keys(app.figures).forEach((key) => {
        const figure = app.figures[key];
        figure.visible = true;
        figure.body.scale.set(app.screen.width * 0.05);
        figure.x += app.tickerInstance.deltaTime * figure.gamepad.axes[0] * 2;
        figure.y += app.tickerInstance.deltaTime * figure.gamepad.axes[1] * 2;
        figure.body.tint = figure.gamepad.buttons.some(b => b.pressed) ? 0x000000 : 0xffffff;

        figure.arm.scale.set(app.screen.width * 0.01);
        figure.arm.position.set(figure.gamepad.axes[2]*figure.body.scale.x, figure.gamepad.axes[3]*figure.body.scale.y)
        figure.arm.tint = figure.gamepad.buttons.some(b => b.pressed) ? 0x444444 : 0xffffff;
        figure.gamepadFoundInCurrentLoop = false;
    });

    // Gamepads verarbeiten und Figuren erstellen/aktualisieren
    gamepads.forEach((gamepad, index) => {
        if (gamepad && gamepad.connected) {
            const key = `g${index}`;
            if (!app.figures[key]) {
                const figure = new PIXI.Container();
                figure.body = new PIXI.Graphics().circle(0, 0, 1).fill({ alpha: 1.0, color: 0xffffff });
                figure.arm = new PIXI.Graphics().circle(0, 0, 1).fill({ alpha: 1.0, color: 0xffffff });
                figure.playerName = new PIXI.Text( {
                    text: Math.floor(Math.random()*1000), 
                    style: { fontFamily: 'Arial', fontSize: 32, fill: 0x0f00f0, align: 'center' }
                    })
                figure.playerName.anchor.set(0.5, 0.5)
                figure.addChild(figure.body, figure.arm, figure.playerName);
                figure.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
                
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
          //  app.containerFigures.removeChild(figure);
          //  delete app.figures[key];
        }
    });

}