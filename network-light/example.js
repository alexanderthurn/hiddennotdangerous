var qrCode = null
const version = '1.0.0'
const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key); // Gibt den Wert des Parameters oder null zurück
}

var getQRCodeTexture = function(url, backgroundColor) {

   if (!qrCode) {
    qrCode = new QRious({
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
    qrCode.value = url
  }

  return qrCode

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
 
    app.setLoading(0.0, 'Loading')
   
    app.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    app.canvas.addEventListener('touchstart', (e) => {
       e.preventDefault();
    });

    app.textUrl = new PIXI.Text({text: app.url, style: {fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center'}})
    app.textServerId = new PIXI.Text({text: app.serverId, style: {fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center'}})
    
    app.textUrl.anchor.set(0.5,1.0)
    app.textServerId.anchor.set(0.5,0.0)    
    let dataUrl = getQRCodeTexture(app.url, app.color).toDataURL()
    let texture = await PIXI.Assets.load(dataUrl)
    app.qrCodeSprite = new PIXI.Sprite(texture)
    app.qrCodeSprite.anchor.set(0.5)


    app.containerGame.addChild(app.qrCodeSprite)
    app.containerGame.addChild(app.textUrl, app.textServerId)

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

    app.textServerId.position.set(app.containerGame.screenWidth*0.5, app.containerGame.screenHeight*0.0)
    app.qrCodeSprite.position.set(app.containerGame.screenWidth*0.5, app.containerGame.screenHeight*0.5)
    
   let qrWidth = Math.min( app.containerGame.screenHeight, app.containerGame.screenWidth)*0.95
   app.qrCodeSprite.width = qrWidth
    app.qrCodeSprite.height = qrWidth




    navigator.getGamepads().forEach((x,index) => {
        if (x && x.connected) {
            console.log(x)
        }
    })
}


