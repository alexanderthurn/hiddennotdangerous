class FWApplication extends PIXI.Application {
    constructor() {
        super()

        this.containerGame = new PIXI.Container()
        this.containerLoading = new PIXI.Container()
    }

    async init(options) {

        options.title = options.title || 'FWApplication'
        options.version = options.version || '0.0.1'

        await super.init(options)   
        document.body.appendChild(this.canvas);
        this.stage.addChild(this.containerGame, this.containerLoading)

        options.textStyle = options.textStyle  || new PIXI.TextStyle({
            fontFamily: 'Xolonium',
            fontStyle: 'Bold',
            fontSize: 64,
            fill: '#fff',
            wordWrap: false,
            wordWrapWidth: 440,
        });
    

        this.containerLoading.bar = new PIXI.Graphics() 
        this.containerLoading.title = new PIXI.Text({text: options.title + ' ' + options.version, style: options.textStyle})
        this.containerLoading.text = new PIXI.Text({text: '', style: options.textStyle})
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