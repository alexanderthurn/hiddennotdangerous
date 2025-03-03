var fwQrCode = null
var fwNetworkGamepads = {}

var fwGetQRCodeTexture = function(url, backgroundColor) {

    if (!fwQrCode) {
        fwQrCode = new QRious({
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
    fwQrCode.value = url
   }
 
   return fwQrCode
 
 }

 var fwGetNetworkGamepads = function() {
    return navigator.getGamepads().filter(x => x && x.connected).map((g) => {
        let index = 'n' + g.index
        if (!fwNetworkGamepads[index]) {
            let pad = new NetworkGamepad()
            fwNetworkGamepads[index] = pad
            fwNetworkGamepads[index].index = index
        }
        fwNetworkGamepads[index].setFromRealGamepad(g)
        fwNetworkGamepads[index].index = index
        fwNetworkGamepads[index].axes[0] *= -1 
        fwNetworkGamepads[index].axes[1] *= -1 
        return fwNetworkGamepads[index]
    })
 }

 
