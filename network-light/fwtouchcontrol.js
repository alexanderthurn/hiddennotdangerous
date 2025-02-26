class FWTouchControl extends PIXI.Container{
    constructor(app, options) {
        super(options)
        let self = this
        const textStyle = new PIXI.TextStyle({
            fontFamily: 'Xolonium',
            fontStyle: 'Bold',
            fontSize: 64,
            fill: '#000'
        });

        const textStyleSmall = new PIXI.TextStyle({
            fontFamily: 'Xolonium',
            fontStyle: 'Bold',
            fontSize: 48,
            fill: '#000'
        });

        const textStyleTitle = new PIXI.TextStyle({
            fontFamily: 'Xolonium',
            fontStyle: 'Bold',
            fontSize: 32,
            fill: '#fff'
        });
        
        this.pointer = {pointerType: 'unknown', x: 0, y: 0, xCenter: undefined, yCenter: undefined, pressed: new Set(), events: {}}
        this.buttonContainers = []
        this.axesContainers = []
        this.connectionContainers = []
        this.dpadCenterContainer = new PIXI.Container()
        this.border = new PIXI.Graphics()
        this.addChild(this.border)

        this.title = new PIXI.Text({text: 'F-Mote ' + version, textStyleTitle})
        this.title.anchor.set(0.5,1)
        this.title.alpha = 0.5
        this.addChild(this.title)
          

        const radius = 128
       
        
        for (let i = 0; i < 18; i++) {
            let buttonContainer = new PIXI.Container()
            buttonContainer.buttonBackground = new PIXI.Graphics();
            
            if ((i === 12 || i === 13 || i === 14 || i === 15)) {
                buttonContainer.buttonBackground.rect(-radius, -radius, radius*2, radius*2)
                let rot = 0
                if (i === 12) rot = 0
                else if (i === 13) rot = 180
                else if (i === 14) rot = 90
                else if (i === 15) rot = 270
                
                buttonContainer.buttonBackground.regularPoly(Math.sin(PIXI.DEG_TO_RAD * rot)*radius*1.5,-Math.cos(PIXI.DEG_TO_RAD * rot)*radius*1.5, radius, 3,  PIXI.DEG_TO_RAD * rot).fill({alpha: 1.0, color: 0xFFFFFF}).stroke({alpha: 0.5, color: 0x000000, width: radius/10})

            } else {
                buttonContainer.buttonBackground.circle(0, 0, radius).fill({alpha: 1.0, color: 0xFFFFFF}).stroke({alpha: 0.5, color: 0x000000, width: radius/10})
            }
            buttonContainer.buttonText = new PIXI.Text({text: i, style: (i === 8 || i === 9 || i === 16 || i === 17) ? textStyleSmall : textStyle})
            buttonContainer.buttonText.anchor.set(0.5)
            buttonContainer.addChild(buttonContainer.buttonBackground, buttonContainer.buttonText)
            buttonContainer.startRadius = radius
            buttonContainer.index = i
            buttonContainer.rPos = [0,0]
            buttonContainer.pressed = false
            buttonContainer.interactive = true

            buttonContainer.addEventListener('pointerdown', {
                handleEvent: function(event) {
                    buttonContainer.pressed = true
                    buttonContainer.pointerdown = event
                }
            }) 

            if (i === 17) {
                
                buttonContainer.addEventListener('pointerdown', {
                    handleEvent: function(event) {
                        app.settingsDialog.showModal()
                    }
                }) 
            }

            buttonContainer.addEventListener('pointerup', {
                handleEvent: function(event) {
                    buttonContainer.pressed = false
                    buttonContainer.pointerdown = null
                }
            }) 

            buttonContainer.addEventListener('pointerleave', {
                handleEvent: function(event) {
                    buttonContainer.pressed = false
                }
            }) 

            if ((i === 12 || i === 13 || i === 14 || i === 15)) {
                buttonContainer.addEventListener('pointerenter', {
                    handleEvent: function(event) {
                        if (self.buttonContainers[12].pointerdown || 
                            self.buttonContainers[13].pointerdown ||
                            self.buttonContainers[14].pointerdown ||
                            self.buttonContainers[15].pointerdown) {
                            buttonContainer.pressed = true

                        }
                    }
                }) 
            }
            this.buttonContainers.push(buttonContainer)
            this.addChild(buttonContainer)

            switch(i) {
                case 0: buttonContainer.buttonText.text = 'A'; buttonContainer.key = 'k'; buttonContainer.rPos = [1.0, 1.0, 0.09, -0.75, 0.0]; break;
                case 1: buttonContainer.buttonText.text = 'B'; buttonContainer.key = 'l'; buttonContainer.rPos = [1.0, 0.8, 0.09, 0.0, 0.0]; break;
                case 2: buttonContainer.buttonText.text = 'X'; buttonContainer.key = 'j'; buttonContainer.rPos = [1.0, 0.8, 0.09, -1.5, 0.0]; break;
                case 3: buttonContainer.buttonText.text = 'Y'; buttonContainer.key = 'i'; buttonContainer.rPos = [1.0, 0.6,0.09, -0.75, 0.0]; break;
                case 4: buttonContainer.buttonText.text = 'LB'; buttonContainer.key = 'z'; buttonContainer.rPos = [0.925, 0.1,0.07, -0.6]; break;
                case 5: buttonContainer.buttonText.text = 'RB'; buttonContainer.key = 'p'; buttonContainer.rPos = [0.925, 0.1,0.07, 0.6]; break;
                case 6: buttonContainer.buttonText.text = 'LT'; buttonContainer.key = 'o'; buttonContainer.rPos = [0.925, 0.3,0.07, 0.6]; break;
                case 7: buttonContainer.buttonText.text = 'RT'; buttonContainer.key = 'u'; buttonContainer.rPos = [0.925, 0.3,0.07, -0.6]; break;
                case 8: buttonContainer.buttonText.text = 'SELECT'; buttonContainer.key = 'ArrowLeft'; buttonContainer.rPos = [0.4, 0.35,0.075]; break;
                case 9: buttonContainer.buttonText.text = 'START'; buttonContainer.key = 'ArrowRight'; buttonContainer.rPos = [0.6, 0.35,0.075]; break;
                case 10: buttonContainer.buttonText.text = 'A1'; buttonContainer.key = 'q'; buttonContainer.rPos = [-2.5, 1.0,0.05, -0.5]; break;
                case 11: buttonContainer.buttonText.text = 'A2'; buttonContainer.key = 'e'; buttonContainer.rPos = [-2.5, 1.0,0.05, 0.5]; break;
                case 12: buttonContainer.buttonText.text = 'v'; buttonContainer.key = 's'; buttonContainer.rPos = [0.035, 0.2,0.05,1.0, 1.0]; break;
                case 13: buttonContainer.buttonText.text = '^'; buttonContainer.key = 'w'; buttonContainer.rPos = [0.035, 0.2,0.05, 1.0, -1.0]; break;
                case 14: buttonContainer.buttonText.text = '<'; buttonContainer.key = 'a'; buttonContainer.rPos = [0.035, 0.2,0.05, 0.0, 0]; break;
                case 15: buttonContainer.buttonText.text = '>'; buttonContainer.key = 'd'; buttonContainer.rPos = [0.035, 0.2,0.05, 2.0, 0]; break;
                case 16: buttonContainer.buttonText.text = 'HOME'; buttonContainer.key = 'ArrowUp'; buttonContainer.rPos = [0.5, 0.15,0.075]; break;
                case 17: buttonContainer.buttonText.text = ''; buttonContainer.key = 'ArrowDown'; buttonContainer.rPos = [0.5, 0.55,0.075]; break;
            }
        }
        this.dpadCenterContainer.rPos = [0.035, 0.2,0.05, 1.0, 0];
        this.dpadCenterContainer.startRadius = radius
        this.dpadCenterContainer.stick = new PIXI.Graphics().rect(-radius, -radius, radius*2, radius*2).fill({alpha: 1.0, color: 0xFFFFFF})
        this.dpadCenterContainer.addChild(this.dpadCenterContainer.stick)
        this.addChild(this.dpadCenterContainer)


        for (let i = 0; i < 5; i++) {
            let connectionContainer = new PIXI.Container()
            connectionContainer.background = new PIXI.Graphics()
            connectionContainer.background.circle(0, 0, radius).fill({alpha: 1.0, color: 0xFFFFFF})
            connectionContainer.addChild(connectionContainer.background)
            connectionContainer.startRadius = radius
            connectionContainer.radius = radius
            connectionContainer.index = i
            connectionContainer.rPos = [0,0]
            connectionContainer.status = 0
            if (i < 3) {
                connectionContainer.status = 1
            } 
            if (i == 2) {
                connectionContainer.status = 2
            } 
            switch(i) {
                case 0: connectionContainer.rPos = [0.5, 0.0, 0.01, -3, 0.0]; break;
                case 1: connectionContainer.rPos = [0.5, 0.0, 0.01, -1.5, 0.0]; break;
                case 2: connectionContainer.rPos = [0.5, 0.0, 0.01, 0, 0.0]; break;
                case 3: connectionContainer.rPos = [0.5, 0.0, 0.01, 1.5, 0.0]; break;
                case 4: connectionContainer.rPos = [0.5, 0.0, 0.01, 3, 0.0]; break;
            }
            this.connectionContainers.push(connectionContainer)
            this.addChild(connectionContainer)
        }


        for (let i = 1; i >= 0; i--) {
            let axisContainer = new PIXI.Container()
            let axisBackground = new PIXI.Graphics().circle(0, 0, radius).fill({alpha: 0.5, color: 0xFFFFFF}).stroke({alpha: 0.5, color: 0xffffff, width: radius/10})
            let axisStick = new PIXI.Graphics().circle(0, 0, radius/2).fill({alpha: 1.0, color: 0xFFFFFF}).stroke({alpha: 0.5, color: 0x000000, width: radius/10})
            let axisStickShadow = new PIXI.Graphics().circle(0, 0, radius/2).fill({alpha: 1.0, color: 0xFFFFFF})
            axisStickShadow.alpha = 0.1
            axisStick.startRadius = axisStick.radius = radius/2
            axisStickShadow.startRadius = axisStickShadow.radius = radius/2
            axisContainer.addChild(axisBackground, axisStick, axisStickShadow)
            axisContainer.startRadius = radius
            axisContainer.index = i
            axisContainer.xAxis = axisContainer.xAxisShadow = 0
            axisContainer.yAxis = axisContainer.yAxisShadow = 0
            axisContainer.stick = axisStick
            axisContainer.stickShadow = axisStickShadow
            switch(i) {
                case 0: axisContainer.rPos = [0.05, 0.95, 0.2]; break;
                case 1: axisContainer.rPos = [0.5, 0.95, 0.1, 0.0]; break;
            }

            axisContainer.interactive = true
            axisContainer.addEventListener('pointerdown', {
                handleEvent: function(event) {
                    if (axisContainer.lastTimeClicked && ( Date.now() - axisContainer.lastTimeClicked < 500)) {
                        self.buttonContainers[10+i].pressed= true
                    }
                    axisContainer.lastTimeClicked = Date.now()
                    axisContainer.pointerdown = event
                }
            })

            axisContainer.addEventListener('pointerup', {
                handleEvent: function(event) {
                    axisContainer.xAxis = 0
                    axisContainer.yAxis = 0
                    axisContainer.xAxisShadow = 0
                    axisContainer.yAxisShadow = 0
                    self.buttonContainers[10+i].pressed= false
                    axisContainer.pointerdown = null
                }
            }) 

            axisContainer.addEventListener('pointerleave', {
                handleEvent: function(event) {
                    axisContainer.xAxis = 0
                    axisContainer.yAxis = 0
                    axisContainer.xAxisShadow = 0
                    axisContainer.yAxisShadow = 0
                    self.buttonContainers[10+i].pressed= false
                    axisContainer.pointerdown = null
                }
            }) 

            axisContainer.addEventListener('pointermove', {
                handleEvent: function(event) {
                    if (!axisContainer.pointerdown) {
                        return
                    }
                    if (app.isPortrait) {
                        //let gPos = axisContainer.getGlobalPosition()
                        let localEvent = {x: event.y, y: app.containerGame.screenHeight - event.x}
                        axisContainer.xAxis = (localEvent.x  - axisContainer.x) / axisContainer.radius
                        axisContainer.yAxis = (localEvent.y  - axisContainer.y) / axisContainer.radius
                    } else {
                        axisContainer.xAxis = (event.x  - axisContainer.x) / axisContainer.radius
                        axisContainer.yAxis = (event.y  - axisContainer.y) / axisContainer.radius
                    }

                    axisContainer.xAxisShadow = axisContainer.xAxis
                    axisContainer.yAxisShadow = axisContainer.yAxis
                    
                    if (axisContainer.xAxis*axisContainer.xAxis + axisContainer.yAxis*axisContainer.yAxis > 1.0) {
                        axisContainer.xAxis = Math.cos(angle(0,0,axisContainer.xAxis, axisContainer.yAxis))
                        axisContainer.yAxis = Math.sin(angle(0,0,axisContainer.xAxis, axisContainer.yAxis))
                    }
                
                }
            }) 


            this.axesContainers.push(axisContainer)
            this.addChild(axisContainer)
        }


        window.addEventListener('keydown', {
            handleEvent: function(event) {
                if (app.settingsDialog.open) return

                self.buttonContainers.forEach(buttonContainer => {
                    if (event.key === buttonContainer.key) {
                        buttonContainer.pressed = true
                    }
                })
               
            }
        })

        window.addEventListener('keyup', {
            handleEvent: function(event) {
                if (app.settingsDialog.open) return
                
                let foundMatching = false
                self.buttonContainers.forEach(buttonContainer => {
                    if (event.key === buttonContainer.key) {
                        buttonContainer.pressed = false
                        foundMatching = true
                    }
                })

                if (foundMatching) {
                    self.buttonContainers.forEach(buttonContainer => {
                        buttonContainer.buttonText.text = buttonContainer.key
                    })
                }
                
               
            }
        })
        
           
        
    }


    update(app) {

        let minHeightWidth = Math.min(app.containerGame.screenWidth, app.containerGame.screenHeight)
        let maxHeightWidth = Math.max(app.containerGame.screenWidth, app.containerGame.screenHeight)
        //minHeightWidth = maxHeightWidth
        const distanceToBorderX = 0.05*app.containerGame.screenWidth
        const distanceToBorderY = 0.05*app.containerGame.screenHeight

        this.axesContainers.forEach((container, index) => {
            container.radius = container.rPos[2]*minHeightWidth
            container.scale = container.radius/container.startRadius
            container.x = (distanceToBorderX + container.radius) + container.rPos[0]*(app.containerGame.screenWidth - distanceToBorderX*2 -container.radius*2) + (container.rPos.length > 3 ? container.rPos[3]*container.radius*2 : 0)
            container.y = (distanceToBorderY + container.radius) + container.rPos[1]*(app.containerGame.screenHeight - distanceToBorderY*2 -container.radius*2) + (container.rPos.length > 4 ? container.rPos[4]*container.radius*2 : 0)
            container.stickShadow.position.set(container.xAxisShadow * (container.startRadius), container.yAxisShadow * (container.startRadius))
            container.stick.position.set(container.xAxis * (container.startRadius), container.yAxis * (container.startRadius))
            container.stick.tint = (this.buttonContainers[10+index].pressed ? 0x000000 : 0xffffff) 
            container.stick.alpha = (this.buttonContainers[10+index].pressed ? 0.5 : 1.0)
        })

        this.buttonContainers.forEach((container, index) => {
            container.radius = container.rPos[2]*minHeightWidth
            container.scale = container.radius/container.startRadius
            container.alpha = (container.pressed ? 0.5 : 1.0)
            container.tint = (container.pressed ? 0x000000 : 0xffffff) 
            container.x = (distanceToBorderX + container.radius) + container.rPos[0]*(app.containerGame.screenWidth - distanceToBorderX*2 -container.radius*2) + (container.rPos.length > 3 ? container.rPos[3]*container.radius*2 : 0)
            container.y = (distanceToBorderY + container.radius) + container.rPos[1]*(app.containerGame.screenHeight - distanceToBorderY*2 -container.radius*2) + (container.rPos.length > 4 ? container.rPos[4]*container.radius*2 : 0)
        })

        this.buttonContainers[17].buttonText.text = app.serverId

        this.dpadCenterContainer.radius = this.dpadCenterContainer.rPos[2]*minHeightWidth
        this.dpadCenterContainer.scale = this.dpadCenterContainer.radius/this.dpadCenterContainer.startRadius
        this.dpadCenterContainer.x = (distanceToBorderX + this.dpadCenterContainer.radius) + this.dpadCenterContainer.rPos[0]*(app.containerGame.screenWidth - distanceToBorderX*2 -this.dpadCenterContainer.radius*2) + (this.dpadCenterContainer.rPos.length > 3 ? this.dpadCenterContainer.rPos[3]*this.dpadCenterContainer.radius*2 : 0)
        this.dpadCenterContainer.y = (distanceToBorderY + this.dpadCenterContainer.radius) + this.dpadCenterContainer.rPos[1]*(app.containerGame.screenHeight - distanceToBorderY*2 -this.dpadCenterContainer.radius*2) + (this.dpadCenterContainer.rPos.length > 4 ? this.dpadCenterContainer.rPos[4]*this.dpadCenterContainer.radius*2 : 0)
        
        if (this.border.screenWidth !== app.containerGame.screenWidth ||  this.border.screenHeight !== app.containerGame.screenHeight) {    
           this.border.clear()
            this.border.roundRect(app.containerGame.screenWidth*0.01,app.containerGame.screenHeight*0.01, app.containerGame.screenWidth*0.98, app.containerGame.screenHeight*0.98, app.containerGame.screenWidth*0.1).fill({alpha: 1.0, color: 0xFFFFFF}).stroke({alpha: 1, color: 0x000000, width: app.containerGame.screenHeight*0.01})
            this.border.screenWidth = app.containerGame.screenWidth
            this.border.screenHeight = app.containerGame.screenHeight 
        }
        
        this.border.tint = app.color

       // this.border.scale.set(app.containerGame.screenWidth/102, app.containerGame.screenHeight/102)
        //this.border.position.set(0.5*app.containerGame.screenWidth, 0.5*app.containerGame.screenHeight)
        this.title.position.set(app.containerGame.screenWidth*0.65,app.containerGame.screenHeight*0.95)
        this.title.scale.set(app.containerGame.screenWidth/1500)


        if (app.connectedToServer) {
            this.connectionContainers[2].status = 2 
        }
        this.connectionContainers.forEach((container, index) => {
            container.radius = container.rPos[2]*minHeightWidth
            container.scale = container.radius/container.startRadius
            if (container.status === 1) container.tint = 0xffffff
            else if (container.status === 2) container.tint = 0x00ff00
            else container.tint = 0x5555ff
            container.x = (distanceToBorderX + container.radius) + container.rPos[0]*(app.containerGame.screenWidth - distanceToBorderX*2 -container.radius*2) + (container.rPos.length > 3 ? container.rPos[3]*container.radius*2 : 0)
            container.y = (distanceToBorderY + container.radius) + container.rPos[1]*(app.containerGame.screenHeight - distanceToBorderY*2 -container.radius*2) + (container.rPos.length > 4 ? container.rPos[4]*container.radius*2 : 0)
        })

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