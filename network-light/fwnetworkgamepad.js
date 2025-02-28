class NetworkGamepad {
    constructor() {
        this.axes = [0, 0, 0, 0];
        this.buttons = new Array(17).fill({pressed: false, touched: false, value: 0.0});
        this.connected = false
        this.id = 'FW Network Game Controller (STANDARD GAMEPAD)'
        this.index = 0
        this.mapping = 'standard'
        this.timestamp = 0 // last change
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
            this.timestamp = gamepad.timestamp
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
