
const move = (x1, y1, angle, speed, dt) => ({x: x1 + Math.cos(angle)*speed*dt, y: y1 + Math.sin(angle)*speed*dt});
const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1); 

var touchControl = null


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
        this.containerLoading.title = new PIXI.Text({text: 'FW Remote', style: textStyle})
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

    const app = new FWApplication();
    await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xf4b400,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: window
    });

    app.setLoading(0.0, 'Loading')
    touchControl = new FWTouchControl(app)
    app.containerGame.addChild(touchControl)
    app.finishLoading()
   

    app.ticker.add((ticker) => {

        const isPortrait = app.screen.width < app.screen.height;
    
       // app.containerGame.y = app.screen.height*0.25;
        //app.containerGame.pivot.set(app.screen.width*0.5, app.screen.height*0.5);


        if (isPortrait) {
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

        main(app, ticker)
    })


}

window.addEventListener("load", (event) => {
    init();
})


function main(app, ticker) {
    touchControl.update(app, ticker)
}

class NetworkGamepad {
    constructor() {
        this.axes = [0, 0, 0, 0];
        this.buttons = new Array(17).fill({pressed: false, touched: false, value: 0.0});
        this.connected = true
        this.id = 'network'
        this.index = 0
        this.mapping = 'standard'
    }

    setAxis(index, value) {
        if (index >= 0 && index < this.axes.length) {
            this.axes[index] = Math.max(-1, Math.min(1, value));
        }
    }

    setButton(index, pressed) {
        if (index >= 0 && index < this.buttons.length) {
            if (pressed) {
                this.buttons[index].pressed = true
                this.buttons[index].touched = true
                this.buttons[index].value = 1.0
            } else {
                this.buttons[index].pressed = false
                this.buttons[index].touched = false
                this.buttons[index].value = 0.0
            }
        }
    }

    setFromRealGamepad(gamepad) {
        if (gamepad) {
            gamepad.axes.forEach((a,index) => index < 4 && this.setAxis(index, a));
            gamepad.buttons.forEach((b,index) => index < 17 && this.setButton(index, b.pressed));
            this.connected = gamepad.connected
            this.id = gamepad.id
            this.index = gamepad.index
            this.mapping = gamepad.mapping
        } else {
            this.connected = false
        }
    }

    getState() {
        return {
            axes: [...this.axes],
            buttons: [...this.buttons]
        };
    }

    toJSON() {
        return JSON.stringify(this.getState());
    }
}

class FWTouchControl extends PIXI.Container{
    constructor(app, options) {
        super(options)

        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Xolonium',
            fontStyle: 'Bold',
            fontSize: 64,
            fill: '#000'
        });
        
        this.pointer = {pointerType: 'unknown', x: 0, y: 0, xCenter: undefined, yCenter: undefined, pressed: new Set(), events: {}}
        this.buttonContainers = []
        this.axesContainers = []
        this.dpadContainer = null

        const radius = 128
        for (let i = 0; i < 2; i++) {
            let axisContainer = new PIXI.Container()
            let axisBackground = new PIXI.Graphics().circle(0, 0, radius).fill({alpha: 0.5, color: 0xFFFFFF})
            let axisStick = new PIXI.Graphics().circle(0, 0, radius/2).fill({alpha: 1.0, color: 0xFFFFFF})
            axisContainer.addChild(axisBackground, axisStick)
            axisContainer.startRadius = radius
            axisContainer.index = i
            axisContainer.xAxis = 0
            axisContainer.yAxis = 0
            switch(i) {
                case 0: axisContainer.rPos = [0.0, 1.0, 0.2]; break;
                case 1: axisContainer.rPos = [0.0, 1.0, 0.1, 2.0]; break;
            }
            this.axesContainers.push(axisContainer)
            this.addChild(axisContainer)
        }
        
        for (let i = 0; i < 17; i++) {
            let buttonContainer = new PIXI.Container()
            let buttonBackground = new PIXI.Graphics().circle(0, 0, radius).fill({alpha: 1.0, color: 0xFFFFFF})
            let buttonText = new PIXI.Text({text: i, style: textStyle})
            buttonText.anchor.set(0.5)
            buttonContainer.addChild(buttonBackground, buttonText)
            buttonContainer.startRadius = radius
            buttonContainer.index = i
            buttonContainer.rPos = [0,0]
            buttonContainer.pressed = false
            this.buttonContainers.push(buttonContainer)
            this.addChild(buttonContainer)
/*

                case 0: buttonText.text = 'A'; buttonContainer.rPos = [0.85, 1.0, 0.075, -1.0, 0.0]; break;
                case 1: buttonText.text = 'B'; buttonContainer.rPos = [1.0, 0.85, 0.075, 0.0, 0.0]; break;
                case 2: buttonText.text = 'X'; buttonContainer.rPos = [0.7, 0.85, 0.075, -2.0, 0.0]; break;
                case 3: buttonText.text = 'Y'; buttonContainer.rPos = [0.85, 0.7,0.075, -1.0, 0.0]; break;
                */

            switch(i) {
                case 0: buttonText.text = 'A'; buttonContainer.rPos = [1.0, 1.0, 0.075, -1.0, 0.0]; break;
                case 1: buttonText.text = 'B'; buttonContainer.rPos = [1.0, 0.85, 0.075, 0.0, 0.0]; break;
                case 2: buttonText.text = 'X'; buttonContainer.rPos = [1.0, 0.85, 0.075, -2.0, 0.0]; break;
                case 3: buttonText.text = 'Y'; buttonContainer.rPos = [1.0, 0.7,0.075, -1.0, 0.0]; break;
                case 4: buttonText.text = 'LB'; buttonContainer.rPos = [0.8, 0.0,0.05]; break;
                case 5: buttonText.text = 'RB'; buttonContainer.rPos = [1.0, 0.0,0.05]; break;
                case 6: buttonText.text = 'LT'; buttonContainer.rPos = [0.85, 0.1,0.05]; break;
                case 7: buttonText.text = 'RT'; buttonContainer.rPos = [0.95, 0.1,0.05]; break;
                case 8: buttonText.text = 'SELECT'; buttonContainer.rPos = [0.4, 0.5,0.075]; break;
                case 9: buttonText.text = 'START'; buttonContainer.rPos = [0.6, 0.5,0.075]; break;
                case 10: buttonText.text = 'A1'; buttonContainer.rPos = [0.5, 1.0,0.05, -0.5]; break;
                case 11: buttonText.text = 'A2'; buttonContainer.rPos = [0.5, 1.0,0.05, 0.5]; break;
                case 12: buttonText.text = 'v'; buttonContainer.rPos = [0.0, 0.2,0.075,1.0, 1.0]; break;
                case 13: buttonText.text = '^'; buttonContainer.rPos = [0.0, 0.2,0.075, 1.0, -1.0]; break;
                case 14: buttonText.text = '<'; buttonContainer.rPos = [0.0, 0.2,0.075]; break;
                case 15: buttonText.text = '>'; buttonContainer.rPos = [0.0, 0.2,0.075, 2.0, 0.0]; break;
                case 16: buttonText.text = 'HOME'; buttonContainer.rPos = [0.5, 0.3,0.075]; break;
            }
        }

      
        //this.addChild(new PIXI.Graphics().rect(0,0,100,100).fill({color: '#fff', alpha: 1.0}))


        window.addEventListener('pointerdown', event => {

            console.log('down', event)
           //if (event.clientX- btnTouchAction.radius > 0 ? (btnTouchAction.x + btnTouchController.x) >> 1 : app.screen.width*0.7) || event.clientY < app.screen.height * 0.5) {
           if (event.clientX < app.screen.width*0.5) {
                this.pointer.pressed.add(0);
                this.pointer.events[event.pointerId] = 0
            } else {
                this.pointer.pressed.add(1);
                this.pointer.events[event.pointerId] = event
            }
            
            this.pointer.xCenter = event.x
            this.pointer.yCenter = event.y
            this.pointer.x = event.x
            this.pointer.y = event.y

            event.preventDefault();
            event.stopPropagation();
        });
        
        
        window.addEventListener('pointerup', event => {
            console.log('up', event)
            this.pointer.pressed.delete(this.pointer.events[event.pointerId]);
            delete this.pointer.events[event.pointerId]
            
            event.preventDefault();
            event.stopPropagation();
        });
        
        window.addEventListener('pointermove', event => {
            this.pointer.x = event.x
            this.pointer.y = event.y
            this.pointer.xAxis = this.pointer.x  - this.pointer.xCenter
            this.pointer.yAxis = this.pointer.y  - this.pointer.yCenter
            event.preventDefault();
            event.stopPropagation();
        }, false);

    }


    update(app, ticker) {
        let minHeightWidth = Math.min(app.containerGame.screenWidth, app.containerGame.screenHeight)
        let maxHeightWidth = Math.max(app.containerGame.screenWidth, app.containerGame.screenHeight)
        //minHeightWidth = maxHeightWidth
        const distanceToBorder = 0.05*minHeightWidth

        this.axesContainers.forEach((container, index) => {
            container.radius = container.rPos[2]*minHeightWidth
            container.scale = container.radius/container.startRadius
            container.x = (distanceToBorder + container.radius) + container.rPos[0]*(app.containerGame.screenWidth - distanceToBorder*2 -container.radius*2) + (container.rPos.length > 3 ? container.rPos[3]*container.radius*2 : 0)
            container.y = (distanceToBorder + container.radius) + container.rPos[1]*(app.containerGame.screenHeight - distanceToBorder*2 -container.radius*2) + (container.rPos.length > 4 ? container.rPos[4]*container.radius*2 : 0)
       })

        this.buttonContainers.forEach((container, index) => {
            container.radius = container.rPos[2]*minHeightWidth
            container.scale = container.radius/container.startRadius
            container.x = (distanceToBorder + container.radius) + container.rPos[0]*(app.containerGame.screenWidth - distanceToBorder*2 -container.radius*2) + (container.rPos.length > 3 ? container.rPos[3]*container.radius*2 : 0)
            container.y = (distanceToBorder + container.radius) + container.rPos[1]*(app.containerGame.screenHeight - distanceToBorder*2 -container.radius*2) + (container.rPos.length > 4 ? container.rPos[4]*container.radius*2 : 0)
        })

        //if (!mp.pressed.has(0)) {

       // }
       /*
        const xy = move(0, 0, angle(0, 0, this.pointer.xAxis, this.pointer.yAxis), radius/2, 1)
        this.moveControlStick.x = xy.x || 0
        this.moveControlStick.y = xy.y || 0
        console.log(xy)
        this.attackControl.alpha = this.pointer.isAttackButtonPressed ? 1 : 0.75*/
    }

}



   /*
   axes: [0, 0, 0, 0]
   buttons: []
            Gamepads0: A
            Gamepads1: B
            Gamepads2: X
            Gamepads3: Y
            Gamepads4: LB (Left Bumper)
            Gamepads5: RB (Right Bumper)
            Gamepads6: LT (Left Trigger)
            Gamepads7: RT (Right Trigger)
            Gamepads8: Back
            Gamepads9: Start
            Gamepads10: Left Stick (Click)
            Gamepads11: Right Stick (Click)
            Gamepads12: D-Pad Up
            Gamepads13: D-Pad Down
            Gamepads14: D-Pad Left
            Gamepads15: D-Pad Right
            Gamepads16: Guide (Home Button, optional)
        */

            /* 


Type	Index	Location
Button	
0	Bottom button in right cluster
1	Right button in right cluster
2	Left button in right cluster
3	Top button in right cluster
4	Top left front button
5	Top right front button
6	Bottom left front button
7	Bottom right front button
8	Left button in center cluster
9	Right button in center cluster
10	Left stick pressed button
11	Right stick pressed button
12	Top button in left cluster
13	Bottom button in left cluster
14	Left button in left cluster
15	Right button in left cluster
16	Center button in center cluster
axes	
0	Horizontal axis for left stick (negative left/positive right)
1	Vertical axis for left stick (negative up/positive down)
2	Horizontal axis for right stick (negative left/positive right)
3	Vertical axis for right stick (negative up/positive down)


            */