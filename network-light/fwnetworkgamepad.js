class FWNetworkGamepad {
    constructor() {
        this.axes = [0, 0, 0, 0];
        this.buttons = new Array()
        for (let i=0;i<17;i++) {
            this.buttons.push({pressed: false, touched: false, value: 0.0})
        }
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


    toByteArray() {
        // Größe: 4 (axes) + 3 (buttons+connected) = 7 bytes
        const buffer = new ArrayBuffer(7);
        const view = new DataView(buffer);

        let offset = 0;

        // Schreibe die 4 Achsen als 8-bit signed
        this.axes.forEach((axis) => {
            // Mappe -1..1 zu -127..127 (relativ zu 128 als Mitte)
            const byteValue = Math.floor((axis * 127) + 128); // -1 -> 1, 0 -> 128, 1 -> 255
            view.setUint8(offset, Math.max(0, Math.min(255, byteValue)));
            offset += 1;
        });

        // Schreibe Button-States und connected Flag (17 button bits + 1 connected bit)
        let byte0 = 0; // Bits 0-7 (Buttons 0-7)
        let byte1 = 0; // Bits 8-15 (Buttons 8-15)
        let byte2 = 0; // Bits 16-23 (Button 16 + connected + 6 unused)

        // Buttons
        this.buttons.forEach((button, index) => {
            const bitValue = button.pressed ? 1 : 0;
            if (index < 8) {
                byte0 |= bitValue << index;
            } else if (index < 16) {
                byte1 |= bitValue << (index - 8);
            } else if (index < 17) {
                byte2 |= bitValue << (index - 16);
            }
        });

        // Connected Flag an Bit 1 von byte2 (nach Button 16)
        byte2 |= (this.connected ? 1 : 0) << 1;

        view.setUint8(offset, byte0); offset += 1;
        view.setUint8(offset, byte1); offset += 1;
        view.setUint8(offset, byte2); offset += 1;

        return new Uint8Array(buffer);
    }

    fromByteArray(bytes) {
        const view = new DataView(bytes);

        let offset = 0;

        // Lese Achsen
        for (let i = 0; i < 4; i++) {
            const byteValue = view.getUint8(offset);
            this.axes[i] = (byteValue - 128) / 127; // Mappe zurück von 0..255 zu -1..1
            offset += 1;
        }

        // Lese Buttons und connected
        const byte0 = view.getUint8(offset); offset += 1;
        const byte1 = view.getUint8(offset); offset += 1;
        const byte2 = view.getUint8(offset); offset += 1;

        // Buttons
        for (let i = 0; i < 17; i++) {
            let pressed = false;
            if (i < 8) {
                pressed = (byte0 & (1 << i)) !== 0;
            } else if (i < 16) {
                pressed = (byte1 & (1 << (i - 8))) !== 0;
            } else {
                pressed = (byte2 & (1 << (i - 16))) !== 0;
            }
            this.setButton(i, pressed);
        }

        // Connected Flag (Bit 1 von byte2)
        this.connected = (byte2 & (1 << 1)) !== 0;

        // Setze timestamp auf aktuelle Zeit
        this.timestamp = Date.now();

    }
}


class FWFixedSizeByteArray {
    static merge(arrays) {
        if (arrays.length !== 5) throw new Error("Es müssen genau 5 Arrays sein!");

        let header = new Uint8Array(1); // 1 Byte für Statusflags (5 Bits genutzt)
        let parts = [];
        parts.push(header)
        for (let i = 0; i < 5; i++) {
            if (arrays[i] instanceof Uint8Array) {
                header[0] |= (1 << i); // Setze das i-te Bit
                parts.push(arrays[i]);
            }
        }
        parts[0] = header
        const totalLength = parts.reduce((sum, arr) => sum + arr.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const part of parts) {
            combined.set(part, offset);
            offset += part.length;
        }

        return combined;
    }

    static extract(mergedArray) {
        let header = mergedArray[0]; // Erstes Byte enthält Statusflags
        let result = new Array(5).fill(null);
        let offset = 1;

        for (let i = 0; i < 5; i++) {
            if ((header & (1 << i)) !== 0) { // Prüfe, ob das i-te Bit gesetzt ist
                result[i] = mergedArray.slice(offset, offset + 7);
                offset += 7;
            }
        }

        return result;
    }

    static mergeUint8Arrays(arrays) {
        let totalLength = arrays.reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
        let mergedArray = new Uint8Array(totalLength);
        
        let offset = 0;
        arrays.forEach(arr => {
            if (arr) {
                mergedArray.set(arr, offset);
                offset += arr.length;
            }
        });
    
        return mergedArray;
    }
}