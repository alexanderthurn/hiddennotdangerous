class FWTouchControl extends PIXI.Container {
    constructor(app, options) {
        super(options);
        let self = this;
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
        
        this.pointer = {pointerType: 'unknown', x: 0, y: 0, xCenter: undefined, yCenter: undefined, pressed: new Set(), events: {}};
        this.buttonContainers = [];
        this.axesContainers = [];
        this.connectionContainers = [];
        this.dpadCenterContainer = new PIXI.Container();
        this.border = new PIXI.Graphics();
        this.addChild(this.border);

        this.title = new PIXI.Text({text: 'F-Mote ' + version, style: textStyleTitle});
        this.title.anchor.set(0.5, 1);
        this.title.alpha = 0.5;
        this.addChild(this.title);
          
        const radius = 128;
       
        for (let i = 0; i < 18; i++) {
            let buttonContainer = new PIXI.Container();
            buttonContainer.buttonBackground = new PIXI.Graphics();
            
            if ((i === 12 || i === 13 || i === 14 || i === 15)) {
                buttonContainer.buttonBackground.rect(-radius, -radius, radius*2, radius*2);
                let rot = 0;
                if (i === 12) rot = 0;
                else if (i === 13) rot = 180;
                else if (i === 14) rot = 90;
                else if (i === 15) rot = 270;
                
                buttonContainer.buttonBackground.regularPoly(Math.sin(PIXI.DEG_TO_RAD * rot)*radius*1.5, -Math.cos(PIXI.DEG_TO_RAD * rot)*radius*1.5, radius, 3, PIXI.DEG_TO_RAD * rot).fill({alpha: 1.0, color: 0xFFFFFF}).stroke({alpha: 0.5, color: 0x000000, width: radius/10});
            } else {
                buttonContainer.buttonBackground.circle(0, 0, radius).fill({alpha: 1.0, color: 0xFFFFFF}).stroke({alpha: 0.5, color: 0x000000, width: radius/10});
            }
            buttonContainer.buttonText = new PIXI.Text({text: i, style: (i === 8 || i === 9 || i === 16 || i === 17) ? textStyleSmall : textStyle});
            buttonContainer.buttonText.anchor.set(0.5);
            buttonContainer.addChild(buttonContainer.buttonBackground, buttonContainer.buttonText);
            buttonContainer.startRadius = radius;
            buttonContainer.index = i;
            buttonContainer.rPos = [0,0];
            buttonContainer.pressed = false;
            buttonContainer.interactive = true;

            buttonContainer.addEventListener('pointerdown', {
                handleEvent: function(event) {
                    buttonContainer.pressed = true;
                    buttonContainer.pointerdown = event;
                }
            }); 

            if (i === 17) {
                buttonContainer.addEventListener('pointerdown', {
                    handleEvent: function(event) {
                        app.settingsDialog.show();
                    }
                }); 
            }

            buttonContainer.addEventListener('pointerup', {
                handleEvent: function(event) {
                    buttonContainer.pressed = false;
                    buttonContainer.pointerdown = null;
                }
            }); 

            buttonContainer.addEventListener('pointerleave', {
                handleEvent: function(event) {
                    buttonContainer.pressed = false;
                }
            }); 

            if ((i === 12 || i === 13 || i === 14 || i === 15)) {
                buttonContainer.addEventListener('pointerenter', {
                    handleEvent: function(event) {
                        if (self.buttonContainers[12].pointerdown || 
                            self.buttonContainers[13].pointerdown ||
                            self.buttonContainers[14].pointerdown ||
                            self.buttonContainers[15].pointerdown) {
                            buttonContainer.pressed = true;
                        }
                    }
                }); 
            }
            this.buttonContainers.push(buttonContainer);
            this.addChild(buttonContainer);

            switch(i) {
                case 0: buttonContainer.buttonText.text = 'A'; buttonContainer.key = 'k';  break;
                case 1: buttonContainer.buttonText.text = 'B'; buttonContainer.key = 'l'; break;
                case 2: buttonContainer.buttonText.text = 'X'; buttonContainer.key = 'j'; break;
                case 3: buttonContainer.buttonText.text = 'Y'; buttonContainer.key = 'i'; break;
                case 4: buttonContainer.buttonText.text = 'LB'; buttonContainer.key = 'z'; break;
                case 5: buttonContainer.buttonText.text = 'RB'; buttonContainer.key = 'p'; break;
                case 6: buttonContainer.buttonText.text = 'LT'; buttonContainer.key = 'o'; break;
                case 7: buttonContainer.buttonText.text = 'RT'; buttonContainer.key = 'u'; break;
                case 8: buttonContainer.buttonText.text = 'SELECT'; buttonContainer.key = 'ArrowLeft';  break;
                case 9: buttonContainer.buttonText.text = 'START'; buttonContainer.key = 'ArrowRight';  break;
                case 10: buttonContainer.buttonText.text = 'A1'; buttonContainer.key = 'q'; break;
                case 11: buttonContainer.buttonText.text = 'A2'; buttonContainer.key = 'e'; break;
                case 12: buttonContainer.buttonText.text = 'v'; buttonContainer.key = 's'; break;
                case 13: buttonContainer.buttonText.text = '^'; buttonContainer.key = 'w'; break;
                case 14: buttonContainer.buttonText.text = '<'; buttonContainer.key = 'a'; break;
                case 15: buttonContainer.buttonText.text = '>'; buttonContainer.key = 'd'; break;
                case 16: buttonContainer.buttonText.text = 'HOME'; buttonContainer.key = 'ArrowUp'; break;
                case 17: buttonContainer.buttonText.text = ''; buttonContainer.key = 'ArrowDown'; break;
            }

           
        }
        this.dpadCenterContainer.rPos = [0,0,0,0];
        this.dpadCenterContainer.startRadius = radius;
        this.dpadCenterContainer.stick = new PIXI.Graphics().rect(-radius, -radius, radius*2, radius*2).fill({alpha: 1.0, color: 0xFFFFFF});
        this.dpadCenterContainer.addChild(this.dpadCenterContainer.stick);
        this.addChild(this.dpadCenterContainer);

        for (let i = 0; i < 5; i++) {
            let connectionContainer = new PIXI.Container();
            connectionContainer.background = new PIXI.Graphics();
            connectionContainer.background.circle(0, 0, radius).fill({alpha: 1.0, color: 0xFFFFFF});
            connectionContainer.addChild(connectionContainer.background);
            connectionContainer.startRadius = radius;
            connectionContainer.radius = radius;
            connectionContainer.index = i;
            connectionContainer.rPos = [0,0];
            connectionContainer.status = CONNECTION_STATUS_OFF;
            switch(i) {
                case 0: connectionContainer.rPos = [0.5, 0.0, 0.01, -3, 0.0]; break;
                case 1: connectionContainer.rPos = [0.5, 0.0, 0.01, -1.5, 0.0]; break;
                case 2: connectionContainer.rPos = [0.5, 0.0, 0.01, 0, 0.0]; break;
                case 3: connectionContainer.rPos = [0.5, 0.0, 0.01, 1.5, 0.0]; break;
                case 4: connectionContainer.rPos = [0.5, 0.0, 0.01, 3, 0.0]; break;
            }
            this.connectionContainers.push(connectionContainer);
            this.addChild(connectionContainer);
        }

        for (let i = 1; i >= 0; i--) {
            let axisContainer = new PIXI.Container();
            let axisBackground = new PIXI.Graphics().circle(0, 0, radius).fill({alpha: 0.5, color: 0xFFFFFF}).stroke({alpha: 0.5, color: 0xffffff, width: radius/10});
            let axisStick = new PIXI.Graphics().circle(0, 0, radius/2).fill({alpha: 1.0, color: 0xFFFFFF}).stroke({alpha: 0.5, color: 0x000000, width: radius/10});
            let axisStickShadow = new PIXI.Graphics().circle(0, 0, radius/2).fill({alpha: 1.0, color: 0xFFFFFF});
            axisStickShadow.alpha = 0.1;
            axisStick.startRadius = axisStick.radius = radius/2;
            axisStickShadow.startRadius = axisStickShadow.radius = radius/2;
            axisContainer.addChild(axisBackground, axisStick, axisStickShadow);
            axisContainer.startRadius = radius;
            axisContainer.index = i;
            axisContainer.xAxis = axisContainer.xAxisShadow = 0;
            axisContainer.yAxis = axisContainer.yAxisShadow = 0;
            axisContainer.stick = axisStick;
            axisContainer.stickShadow = axisStickShadow;
            switch(i) {
                case 0: axisContainer.rPos = [0.05, 0.95, 0.2]; axisContainer.clickIndex = 10; break;
                case 1: axisContainer.rPos = [0.5, 0.95, 0.1, 0.0]; axisContainer.clickIndex = 11; break;
            }

            axisContainer.interactive = true;
            axisContainer.addEventListener('pointerdown', {
                handleEvent: function(event) {
                    if (axisContainer.lastTimeClicked && (Date.now() - axisContainer.lastTimeClicked < 500)) {
                        self.buttonContainers[axisContainer.clickIndex].pressed = true;
                    }
                    axisContainer.lastTimeClicked = Date.now();
                    axisContainer.pointerdown = event;
                }
            });

            axisContainer.addEventListener('pointerup', {
                handleEvent: function(event) {
                    axisContainer.xAxis = 0;
                    axisContainer.yAxis = 0;
                    axisContainer.xAxisShadow = 0;
                    axisContainer.yAxisShadow = 0;
                    self.buttonContainers[axisContainer.clickIndex].pressed = false;
                    axisContainer.pointerdown = null;
                }
            }); 

            axisContainer.addEventListener('pointerleave', {
                handleEvent: function(event) {
                    axisContainer.xAxis = 0;
                    axisContainer.yAxis = 0;
                    axisContainer.xAxisShadow = 0;
                    axisContainer.yAxisShadow = 0;
                    self.buttonContainers[axisContainer.clickIndex].pressed = false;
                    axisContainer.pointerdown = null;
                }
            }); 

            axisContainer.addEventListener('pointermove', {
                handleEvent: function(event) {
                    if (!axisContainer.pointerdown) {
                        return;
                    }
                    if (app.isPortrait) {
                        let localEvent = {x: event.y, y: app.containerGame.screenHeight - event.x};
                        axisContainer.xAxis = (localEvent.x - axisContainer.x) / axisContainer.radius;
                        axisContainer.yAxis = (localEvent.y - axisContainer.y) / axisContainer.radius;
                    } else {
                        axisContainer.xAxis = (event.x - axisContainer.x) / axisContainer.radius;
                        axisContainer.yAxis = (event.y - axisContainer.y) / axisContainer.radius;
                    }

                    axisContainer.xAxisShadow = axisContainer.xAxis;
                    axisContainer.yAxisShadow = axisContainer.yAxis;
                    
                    if (axisContainer.xAxis*axisContainer.xAxis + axisContainer.yAxis*axisContainer.yAxis > 1.0) {
                        let angleVal = Math.atan2(axisContainer.yAxis, axisContainer.xAxis);
                        axisContainer.xAxis = Math.cos(angleVal);
                        axisContainer.yAxis = Math.sin(angleVal);
                    }
                }
            }); 

            this.axesContainers.push(axisContainer);
            this.addChild(axisContainer);
        }

        window.addEventListener('keydown', {
            handleEvent: function(event) {
                if (app.settingsDialog.open) return;

                self.buttonContainers.forEach(buttonContainer => {
                    if (event.key === buttonContainer.key) {
                        buttonContainer.pressed = true;
                    }
                });
            }
        });

        window.addEventListener('keyup', {
            handleEvent: function(event) {
                if (app.settingsDialog.open) return;
                
                let foundMatching = false;
                self.buttonContainers.forEach(buttonContainer => {
                    if (event.key === buttonContainer.key) {
                        buttonContainer.pressed = false;
                        foundMatching = true;
                    }
                });

                if (foundMatching) {
                    self.buttonContainers.forEach(buttonContainer => {
                        buttonContainer.buttonText.text = buttonContainer.key;
                    });
                }
            }
        });
    }

    update(app) {
        let minHeightWidth = Math.min(app.containerGame.screenWidth, app.containerGame.screenHeight);
        let maxHeightWidth = Math.max(app.containerGame.screenWidth, app.containerGame.screenHeight);
        const distanceToBorderX = 0.05 * app.containerGame.screenWidth;
        const distanceToBorderY = 0.05 * app.containerGame.screenHeight;


        const R_POS_INVISIBLE = [- 10.0, -10.0, 0.0, 0.0];
       
        if (app.layout === 'simple') {
            this.dpadCenterContainer.rPos = R_POS_INVISIBLE;

            this.axesContainers.forEach((axisContainer, i) => {
                switch(i) {
                    case 0: axisContainer.rPos = [0.05, 0.75, 0.25]; break;
                    case 1: axisContainer.rPos = R_POS_INVISIBLE; break;
                }
            })
          

            this.buttonContainers.forEach((buttonContainer, i) => {
                switch(i) {
                    case 0: buttonContainer.rPos = [1.0, 1.0, 0.12, -0.5, 0.0]; break;
                    case 1: buttonContainer.rPos = [1.0, 0.7, 0.12, 0.1, -0.1]; break;
                    case 2: buttonContainer.rPos = [1.0, 0.7, 0.12, -1.15, -0.1]; break;
                    case 3: buttonContainer.rPos = [1.0, 0.4, 0.12, -0.5, -0.2]; break;
                    case 4:  buttonContainer.rPos = R_POS_INVISIBLE; break;
                    case 5:  buttonContainer.rPos = R_POS_INVISIBLE; break;
                    case 6:  buttonContainer.rPos = R_POS_INVISIBLE; break;
                    case 7:  buttonContainer.rPos = R_POS_INVISIBLE; break;
                    case 8: buttonContainer.rPos = [0.425, 0.35, 0.075]; break;
                    case 9: buttonContainer.rPos = [0.575, 0.35, 0.075]; break;
                    case 10:; buttonContainer.rPos = [-2.5, 1.0, 0.05, -0.5]; break;
                    case 11:; buttonContainer.rPos = [-2.5, 1.0, 0.05, 0.5]; break;
                    case 12: buttonContainer.rPos = R_POS_INVISIBLE; break;
                    case 13: buttonContainer.rPos = R_POS_INVISIBLE; break;
                    case 14: buttonContainer.rPos = R_POS_INVISIBLE; break;
                    case 15: buttonContainer.rPos = R_POS_INVISIBLE; break;
                    case 16: buttonContainer.rPos = [0.5, 0.15, 0.075]; break;
                    case 17: buttonContainer.rPos = [0.5, 0.55, 0.075]; break;
                }
            })
        } else {
            this.dpadCenterContainer.rPos =[0.035, 0.2, 0.05, 1.0, 0]

            this.axesContainers.forEach((axisContainer, i) => {
                switch(i) {
                    case 0: axisContainer.rPos = [0.05, 0.95, 0.2]; break;
                    case 1: axisContainer.rPos = [0.5, 0.95, 0.1, 0.0]; break;
                }
            })
            
            this.buttonContainers.forEach((buttonContainer, i) => {
                switch(i) {
                    case 0: buttonContainer.rPos = [1.0, 1.0, 0.09, -0.75, 0.0]; break;
                    case 1: buttonContainer.rPos = [1.0, 0.8, 0.09, 0.0, 0.0]; break;
                    case 2: buttonContainer.rPos = [1.0, 0.8, 0.09, -1.5, 0.0]; break;
                    case 3: buttonContainer.rPos = [1.0, 0.6, 0.09, -0.75, 0.0]; break;
                    case 4: buttonContainer.rPos = [0.925, 0.1, 0.07, -0.6]; break;
                    case 5: buttonContainer.rPos = [0.925, 0.1, 0.07, 0.6]; break;
                    case 6: buttonContainer.rPos = [0.925, 0.3, 0.07, 0.6]; break;
                    case 7: buttonContainer.rPos = [0.925, 0.3, 0.07, -0.6]; break;
                    case 8: buttonContainer.rPos = [0.4, 0.35, 0.075]; break;
                    case 9: buttonContainer.rPos = [0.6, 0.35, 0.075]; break;
                    case 10: buttonContainer.rPos = [-2.5, 1.0, 0.05, -0.5]; break;
                    case 11: buttonContainer.rPos = [-2.5, 1.0, 0.05, 0.5]; break;
                    case 12: buttonContainer.rPos = [0.035, 0.2, 0.05, 1.0, 1.0]; break;
                    case 13: buttonContainer.rPos = [0.035, 0.2, 0.05, 1.0, -1.0]; break;
                    case 14: buttonContainer.rPos = [0.035, 0.2, 0.05, 0.0, 0]; break;
                    case 15: buttonContainer.rPos = [0.035, 0.2, 0.05, 2.0, 0]; break;
                    case 16: buttonContainer.rPos = [0.5, 0.15, 0.075]; break;
                    case 17: buttonContainer.rPos = [0.5, 0.55, 0.075]; break;
                }
            })
        }


        this.axesContainers.forEach((container, index) => {
            container.radius = container.rPos[2] * minHeightWidth;
            container.scale = container.radius / container.startRadius;
            container.x = (distanceToBorderX + container.radius) + container.rPos[0] * (app.containerGame.screenWidth - distanceToBorderX * 2 - container.radius * 2) + (container.rPos.length > 3 ? container.rPos[3] * container.radius * 2 : 0);
            container.y = (distanceToBorderY + container.radius) + container.rPos[1] * (app.containerGame.screenHeight - distanceToBorderY * 2 - container.radius * 2) + (container.rPos.length > 4 ? container.rPos[4] * container.radius * 2 : 0);
            container.stickShadow.position.set(container.xAxisShadow * (container.startRadius), container.yAxisShadow * (container.startRadius));
            container.stick.position.set(container.xAxis * (container.startRadius), container.yAxis * (container.startRadius));
            container.stick.tint = (this.buttonContainers[container.clickIndex].pressed ? 0x000000 : 0xffffff);
            container.stick.alpha = (this.buttonContainers[container.clickIndex].pressed ? 0.5 : 1.0);
        });

        this.buttonContainers.forEach((container, index) => {
            container.radius = container.rPos[2] * minHeightWidth;
            container.scale = container.radius / container.startRadius;
            container.alpha = (container.pressed ? 0.5 : 1.0);
            container.tint = (container.pressed ? 0x000000 : 0xffffff);
            container.x = (distanceToBorderX + container.radius) + container.rPos[0] * (app.containerGame.screenWidth - distanceToBorderX * 2 - container.radius * 2) + (container.rPos.length > 3 ? container.rPos[3] * container.radius * 2 : 0);
            container.y = (distanceToBorderY + container.radius) + container.rPos[1] * (app.containerGame.screenHeight - distanceToBorderY * 2 - container.radius * 2) + (container.rPos.length > 4 ? container.rPos[4] * container.radius * 2 : 0);
        });

        this.buttonContainers[17].buttonText.text = app.serverId;

        this.dpadCenterContainer.radius = this.dpadCenterContainer.rPos[2] * minHeightWidth;
        this.dpadCenterContainer.scale = this.dpadCenterContainer.radius / this.dpadCenterContainer.startRadius;
        this.dpadCenterContainer.x = (distanceToBorderX + this.dpadCenterContainer.radius) + this.dpadCenterContainer.rPos[0] * (app.containerGame.screenWidth - distanceToBorderX * 2 - this.dpadCenterContainer.radius * 2) + (this.dpadCenterContainer.rPos.length > 3 ? this.dpadCenterContainer.rPos[3] * this.dpadCenterContainer.radius * 2 : 0);
        this.dpadCenterContainer.y = (distanceToBorderY + this.dpadCenterContainer.radius) + this.dpadCenterContainer.rPos[1] * (app.containerGame.screenHeight - distanceToBorderY * 2 - this.dpadCenterContainer.radius * 2) + (this.dpadCenterContainer.rPos.length > 4 ? this.dpadCenterContainer.rPos[4] * this.dpadCenterContainer.radius * 2 : 0);
        
        if (this.border.screenWidth !== app.containerGame.screenWidth || this.border.screenHeight !== app.containerGame.screenHeight) {    
            this.border.clear();
            this.border.roundRect(app.containerGame.screenWidth * 0.01, app.containerGame.screenHeight * 0.01, app.containerGame.screenWidth * 0.98, app.containerGame.screenHeight * 0.98, app.containerGame.screenWidth * 0.1).fill({alpha: 1.0, color: 0xFFFFFF}).stroke({alpha: 1, color: 0x000000, width: app.containerGame.screenHeight * 0.01});
            this.border.screenWidth = app.containerGame.screenWidth;
            this.border.screenHeight = app.containerGame.screenHeight;
        }
        
        this.border.tint = app.color.toNumber();

        this.title.position.set(app.containerGame.screenWidth * 0.65, app.containerGame.screenHeight * 0.95);
        this.title.scale.set(app.containerGame.screenWidth / 1500);
        this.connectionContainers[2].status = app.connectionStatus;

        let localGamepads = FWNetwork.getInstance().getLocalGamepads();
  
        [0, 1, 3, 4].forEach(i => {
            let j = i > 2 ? i-1 : i
            this.connectionContainers[i].status = localGamepads[j] && localGamepads[j].connected && this.connectionContainers[2].status || CONNECTION_STATUS_OFF
        })
        
        this.connectionContainers.forEach((container, index) => {
            container.radius = container.rPos[2] * minHeightWidth;
            container.scale = container.radius / container.startRadius;


            if (container.status === CONNECTION_STATUS_OFF) container.tint = 0x000000;
            else if (container.status === CONNECTION_STATUS_INITIALIZNG) container.tint = app.ticker.lastTime % 1000 < 500 ? 0xffff00 : 0x000000;
            else if (container.status === CONNECTION_STATUS_WORKING) container.tint = 0x00ff00;
            else if (container.status === CONNECTION_STATUS_ERROR) container.tint = 0xaa0000;
            else container.tint = 0x0f00ff;
            
            container.x = (distanceToBorderX + container.radius) + container.rPos[0] * (app.containerGame.screenWidth - distanceToBorderX * 2 - container.radius * 2) + (container.rPos.length > 3 ? container.rPos[3] * container.radius * 2 : 0);
            container.y = (distanceToBorderY + container.radius) + container.rPos[1] * (app.containerGame.screenHeight - distanceToBorderY * 2 - container.radius * 2) + (container.rPos.length > 4 ? container.rPos[4] * container.radius * 2 : 0);
        });
    }

    // Neue Methode: Befüllt ein übergebenes FWNetworkGamepad mit den aktuellen Eingaben
    updateGamepad(gamepad) {
        if (!(gamepad instanceof FWNetworkGamepad)) {
            console.error('updateGamepad: Argument must be an instance of NetworkGamepad');
            return;
        }

        // Achsen (axes) aktualisieren
        // axes[0] und axes[1]: Linker Stick (axisContainer[0])
        gamepad.setAxis(0, this.axesContainers[0].xAxis); // Horizontal (left stick)
        gamepad.setAxis(1, this.axesContainers[0].yAxis); // Vertical (left stick)
        // axes[2] und axes[3]: Rechter Stick (axisContainer[1])
        gamepad.setAxis(2, this.axesContainers[1].xAxis); // Horizontal (right stick)
        gamepad.setAxis(3, this.axesContainers[1].yAxis); // Vertical (right stick)

        // Buttons aktualisieren
        this.buttonContainers.forEach((buttonContainer, index) => {
            if (index < 17) { // Nur bis 16, da 17 für Settings ist und nicht im Standard-Gamepad enthalten
                gamepad.setButton(index, buttonContainer.pressed);
            }
        });

        // Verbunden-Status (optional, könnte später angepasst werden)
        gamepad.connected = true; // Annahme: Wenn updateGamepad aufgerufen wird, ist der Controller aktiv
        gamepad.timestamp = Date.now(); // Aktualisiere Zeitstempel
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