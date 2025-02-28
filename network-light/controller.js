

const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1); 
const version = '1.0.0'
const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key); // Gibt den Wert des Parameters oder null zurück
}

var touchControl = null

function setUrlParams(id) {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);

    if (id) {
        params.set('id', id);
    }

    url.search = params.toString();
    window.history.replaceState({}, '', url);
}


// Funktion, um den Graphen mit Pixi.js zu zeichnen
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


    // sets app.settingsDialog
    initDialog(app)

    app.setLoading(0.0, 'Loading')
    touchControl = new FWTouchControl(app)
    app.containerGame.addChild(touchControl)

    app.serverId = getQueryParam('id') || '1234'
    app.color =  new PIXI.Color(getQueryParam('color') || 'ff0000').toNumber()
    app.connectedToServer = false
    app.finishLoading()
   

    app.ticker.add((ticker) => {

        app.isPortrait = app.screen.width < app.screen.height;
        app.ticker = ticker

       // app.containerGame.y = app.screen.height*0.25;
        //app.containerGame.pivot.set(app.screen.width*0.5, app.screen.height*0.5);


        if (app.isPortrait) {
            app.containerGame.angle = -270 - ticker.lastTime*0.0;
            app.containerGame.x = app.screen.width
            //app.containerGame.scale.set( app.screen.width / app.screen.height, app.screen.width / app.screen.height);
            app.containerGame.screenWidth = app.screen.height;
            app.containerGame.screenHeight = app.screen.width;    
        } else {
            app.containerGame.angle = 0;
            app.containerGame.x = 0
            app.containerGame.scale.set(1, 1);
            app.containerGame.screenWidth = app.screen.width;
            app.containerGame.screenHeight = app.screen.height;
        }

        main(app)
    })


}

window.addEventListener("load", (event) => {
    init();
})


function main(app) {
    touchControl.update(app)
}


