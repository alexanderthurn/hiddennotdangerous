
const version = '1.0.0'
const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key); // Gibt den Wert des Parameters oder null zurück
}

// Funktion, um den Graphen mit Pixi.js zu zeichnen
async function init() {

    let color =  new PIXI.Color(getQueryParam('color') || '00aa00')
   

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

    app.serverId = getQueryParam('id') || '666'
    app.color =  color
    app.url = window.location.protocol + '//' + window.location.host.replace('localhost', '7.7.7.66') + window.location.pathname.replace('example.html', 'controller.html') + '?id=' + app.serverId + '&color=' + app.color.toHex().replace('/^#/', '')
 
    app.textUrl = new PIXI.Text({text: app.url, style: {fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center'}})
    app.textServerId = new PIXI.Text({text: app.serverId, style: {fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center'}})
    app.textNetwork = new PIXI.Text({text:'', style: {fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center'}})
    app.textNetwork.anchor.set(1.0,0.0)
    app.textUrl.anchor.set(0.5,1.0)
    app.textServerId.anchor.set(0.5,0.0)    
    let dataUrl = fwGetQRCodeTexture(app.url, app.color).toDataURL()
    let texture = await PIXI.Assets.load(dataUrl)
    app.qrCodeSprite = new PIXI.Sprite(texture)
    app.qrCodeSprite.anchor.set(0.5)

    app.figures = {}
    app.containerFigures = new PIXI.Container()


    app.containerGame.addChild(app.qrCodeSprite)
    app.containerGame.addChild(app.containerFigures)
    app.containerGame.addChild(app.textUrl, app.textServerId, app.textNetwork)

    app.finishLoading()
   

    app.ticker.add((ticker) => {

        app.isPortrait = app.screen.width < app.screen.height;
        app.ticker = ticker
        app.containerGame.screenWidth = app.screen.width;
        app.containerGame.screenHeight = app.screen.height;
    
        main(app)
    })


}

window.addEventListener("load", (event) => {
    init();
})


function main(app) {

    app.textUrl.width = app.containerGame.screenWidth*0.95
    app.textUrl.scale.y = app.textUrl.scale.x
    app.textUrl.position.set(app.containerGame.screenWidth*0.5, app.containerGame.screenHeight*1.0)


    let countLocalGamepads = navigator.getGamepads().filter(x => x && x.connected).length
    let countFigures = Object.keys(app.figures).length
    app.textNetwork.text = `L: ${countLocalGamepads}, R: 0, F: ${countFigures}`
    app.textNetwork.position.set(app.containerGame.screenWidth, app.containerGame.screenHeight*0.0)
    app.textServerId.position.set(app.containerGame.screenWidth*0.5, app.containerGame.screenHeight*0.0)
    app.qrCodeSprite.position.set(app.containerGame.screenWidth*0.5, app.containerGame.screenHeight*0.5)
    


    let qrWidth = Math.min( app.containerGame.screenHeight, app.containerGame.screenWidth)*0.95
    app.qrCodeSprite.width = qrWidth
    app.qrCodeSprite.height = qrWidth

    Object.keys(app.figures).forEach((key) => {
        let f = app.figures[key]
        f.visible = true
        f.body.scale.set(app.containerGame.screenWidth*0.05)
        f.x += app.ticker.deltaTime*f.gamepad.axes[0]*2
        f.y += app.ticker.deltaTime*f.gamepad.axes[1]*2
        f.body.tint = f.gamepad.buttons.some(b => b.pressed) ? 0x000000 : 0xffffff

        
    })


    fwGetNetworkAndLocalGamepads().forEach((x,index) => {
        if (x && x.connected) {
            if (!app.figures['l' + x.index]) {
                let f = new PIXI.Container() 
                f.body = new PIXI.Graphics().circle(0,0,1).fill({alpha: 1.0, color: 0xFFFFFF})
                f.addChild(f.body)
                f.position.set(app.containerGame.screenWidth*0.5, app.containerGame.screenHeight*0.5)  
           
                app.containerFigures.addChild(f)
                app.figures['l' + x.index] = f
            }

            app.figures['l' + x.index].gamepad = x
            

        } else {
            if (app.figures['l' + index]) {
                app.containerFigures.removeChild(app.figures['l' + index])
                delete app.figures['l' + index]
            }
        }
    })
}


