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


class FWApplication extends PIXI.Application {
    constructor(options) {
        super(options)

        this.containerGame = new PIXI.Container()
        this.containerLoading = new PIXI.Container()
    }

    async init(options) {
        await super.init(options)   
        document.body.appendChild(this.canvas);
        this.stage.addChild(this.containerGame, this.containerLoading)

        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Xolonium',
            fontStyle: 'Bold',
            fontSize: 64,
            fill: '#fff',
            wordWrap: false,
            wordWrapWidth: 440,
        });
    

        this.containerLoading.bar = new PIXI.Graphics() 
        this.containerLoading.title = new PIXI.Text({text: 'F-Mote Example' + version, style: textStyle})
        this.containerLoading.text = new PIXI.Text({text: '', style: textStyle})
        this.containerLoading.title.anchor.set(0.5,0.0)
        this.containerLoading.text.anchor.set(0.5,-2.0)
        this.containerLoading.addChild(this.containerLoading.bar, this.containerLoading.title, this.containerLoading.text)
        this.containerGame.visible = false
        this.containerLoading.visible = true
        this.ticker.add(this.onUpdateLoader, this)
    }

    onUpdateLoader(ticker) {
        let scaleToFullHD = this.screen.width/1920
        this.containerLoading.bar.position.set(this.screen.width*0.5, this.screen.height*0.8)
        this.containerLoading.text.position.set(this.screen.width*0.5, this.screen.height*0.6)
        this.containerLoading.title.position.set(this.screen.width*0.5, this.screen.height*0.1)
        this.containerLoading.title.scale.set(4*scaleToFullHD*0.5)
        
        this.containerLoading.text.position.set(this.screen.width*0.5, this.screen.height*0.15)
        this.containerLoading.text.scale.set(4*Math.min(0.5,scaleToFullHD)*0.25)
        this.containerLoading.bar.scale = 0.99+0.01*Math.sin(ticker.lastTime*0.01)
        this.containerLoading.bar.clear()
        this.containerLoading.bar.rect(-this.screen.width*0.25, -this.screen.height*0.05, this.screen.width*0.5, this.screen.height*0.1).stroke({color: 0xffffff, width: this.screen.height*0.01, alpha:1.0}).rect(-this.screen.width*0.25, -this.screen.height*0.05, this.screen.width*0.5*this.containerLoading.percentage, this.screen.height*0.1).fill();
    }


    setLoading(percentage, text = '') {
        this.containerLoading.percentage = percentage
        if (text !== undefined)
            this.containerLoading.text.text = text
        this.render()
    }

    finishLoading() {
        this.ticker.remove(this.onUpdateLoader, this)
        this.containerGame.visible = true
        this.containerLoading.visible = false
    }

}



// Funktion, um den Graphen mit Pixi.js zu zeichnen
async function init() {

    let color =  new PIXI.Color(getQueryParam('color') || '00aa00')
   

    const app = new FWApplication();
    await app.init({
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

    app.text = new PIXI.Text({text: app.url, style: {fontFamily: 'Arial', fontSize: 32, fill: 0xffffff, align: 'center'}})
    app.text.anchor.set(0.5)    
    let dataUrl = getQRCodeTexture(app.url, app.color).toDataURL()
    let texture = await PIXI.Assets.load(dataUrl)
    app.qrCodeSprite = new PIXI.Sprite(texture)
    app.qrCodeSprite.anchor.set(0.5)


    app.containerGame.addChild(app.qrCodeSprite)
    app.containerGame.addChild(app.text)

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

    app.text.width = app.containerGame.screenWidth*0.95
    app.text.scale.y = app.text.scale.x
   app.text.position.set(app.containerGame.screenWidth*0.5, app.containerGame.screenHeight*0.1)
   app.qrCodeSprite.position.set(app.containerGame.screenWidth*0.5, app.containerGame.screenHeight*0.5)
   app.qrCodeSprite.width = app.containerGame.screenWidth*0.5
    app.qrCodeSprite.height = app.containerGame.screenWidth*0.5
}


