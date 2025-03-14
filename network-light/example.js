const version = '1.0.0';
const baseUrlController = `pad.feuerware.com`;

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
    network.hostRoom('hidden');

    app.color = color;
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
        app.containerGame.screenWidth = app.screen.width;
        app.containerGame.screenHeight = app.screen.height;

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
    const network = FWNetwork.getInstance();
    const gamepads = network.getAllGamepads();

    // UI-Positionierung und Status
    const nw = FWNetwork.getInstance()
    const nwStats = nw.getStats()
    app.textNetwork.text = `Status: ${network.getStatus()} Relay: ${nwStats.reported.foundRelay}
    G: ${network.getLocalGamepads().filter(x => x && x.connected).length}, R: ${network.getNetworkGamepads().filter(x => x && x.connected).length}, F: ${Object.keys(app.figures).length} M: ${nwStats.messagesReceived} 
    BR:  ${nwStats.reported.bytesReceived} / ${nwStats.bytesReceived} BS: ${nwStats.reported.bytesSent} / ${nwStats.bytesReceived}
    RT:  ${(1000*nwStats.reported.currentRoundTripTime).toFixed(4)} / ${(1000*nwStats.reported.totalRoundTripTime).toFixed(4)}
    `;
    app.textNetwork.position.set(app.containerGame.screenWidth, app.containerGame.screenHeight * 0.0);

    if (app.roomNumber !== network.roomNumber) {
        app.roomNumber = network.roomNumber;
        app.url = `https://${baseUrlController}?id=${app.roomNumber}`;

        if (app.roomNumber === 0) {
            app.textUrl.text = 'status: ' + FWNetwork.getInstance().getStatus()
            app.qrCodeSprite.removeChildren()
        } else {
            app.textUrl.text = baseUrlController + "\n" + app.roomNumber
            const qrCode = network.getQRCodeTexture(app.url, app.color);
            const dataUrl = qrCode.toDataURL();
            PIXI.Assets.load(dataUrl).then((texture) => {
                app.qrCodeSprite = new PIXI.Sprite(texture);
                app.qrCodeSprite.anchor.set(0.5);
                app.qrCodeSprite.removeChildren()
                app.containerQrCode.addChild(app.qrCodeSprite);
            })
        }
      
       
    }

    if (app.qrCodeSprite) {
        app.qrCodeSprite.position.set(app.containerGame.screenWidth * 0.5, app.containerGame.screenHeight * 0.5);
        const qrWidth = Math.min(app.containerGame.screenHeight, app.containerGame.screenWidth) * 0.5;
        app.qrCodeSprite.width = qrWidth;
        app.qrCodeSprite.height = qrWidth;

        app.textUrl.width =  app.qrCodeSprite.width*0.8;
        app.textUrl.scale.y = app.textUrl.scale.x;
        app.textUrl.position.set(app.containerGame.screenWidth * 0.5, app.containerGame.screenHeight * 1.0);
    
    }

   

    // Figuren aktualisieren
    Object.keys(app.figures).forEach((key) => {
        const figure = app.figures[key];
        figure.visible = true;
        figure.body.scale.set(app.containerGame.screenWidth * 0.05);
        figure.x += app.tickerInstance.deltaTime * figure.gamepad.axes[0] * 2;
        figure.y += app.tickerInstance.deltaTime * figure.gamepad.axes[1] * 2;
        figure.body.tint = figure.gamepad.buttons.some(b => b.pressed) ? 0x000000 : 0xffffff;

        figure.arm.scale.set(app.containerGame.screenWidth * 0.01);
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
          //  app.containerFigures.removeChild(figure);
          //  delete app.figures[key];
        }
    });

}