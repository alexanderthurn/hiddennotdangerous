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
    return navigator.getGamepads().forEach(g => {
        if (!fwNetworkGamepads['l' + x.index]) {
            let pad = new NetworkGamepad()
            fwNetworkGamepads['l' + x.index] = pad
        }
        fwNetworkGamepads['l' + x.index].setFromRealGamepad(g)
    })
 }

 var fwGetNetworkAndLocalGamepads = function() {
    return navigator.getGamepads().concat(fwGetNetworkGamepads)
 }
 
