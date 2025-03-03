
class FWNetwork {
  static #instance = null;

  constructor() {
      this.qrCode = null;
      this.networkGamepads = {}

      if (FWNetwork.#instance) {
          throw new Error("Use FWNetwork.getInstance() to get the singleton instance.");
      }
      // Initialisierung
      this.initialized = false;
  }

  static getInstance() {
      if (!FWNetwork.#instance) {
          FWNetwork.#instance = new FWNetwork();
      }
      return FWNetwork.#instance;
  }

  // Platzhalter-Methode für spätere peer.js-Integration
  initialize() {
      this.initialized = true;
      console.log("FWNetwork initialized");
  }

  getQRCodeTexture(url, backgroundColor) {

    if (!this.qrCode) {
      this.qrCode = new QRious({
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
      this.qrCode.value = url
    }

    return this.qrCode
 
  }

 getNetworkGamepads() {
    return navigator.getGamepads().filter(x => x && x.connected).map((g) => {
        let index = 'n' + g.index
        if (!this.networkGamepads[index]) {
            let pad = new FWNetworkGamepad()
            this.networkGamepads[index] = pad
            this.networkGamepads[index].index = index
        }
        this.networkGamepads[index].setFromRealGamepad(g)
        this.networkGamepads[index].index = index
        this.networkGamepads[index].axes[0] *= -1 
        this.networkGamepads[index].axes[1] *= -1 
        return this.networkGamepads[index]
    })
 }
}


 
