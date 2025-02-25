var qrCode = null

var showQRCode = function(app) {
  let c = new PIXI.Color(app.color)

  var url = window.location.protocol + '//' + window.location.host + window.location.pathname + '?id=' + app.serverId + '&color=' + c.toHex().replace('/^#/', '')
  if (!qrCode) {
    qrCode = new QRious({
      element: document.getElementById('qr'),
      value: url,
      background: 'green',
      backgroundAlpha: 0.8,
      foreground: 'brown',
      foregroundAlpha: 0.8,
      level: 'H',
      padding: 25,
      size: app.screen.width*0.25, 
    });
  } else {
    qrCode.value = url
  }

}

var startQRCode = function(callbackCode) {
		  			
    var video = document.createElement("video");
    var canvasElement = document.getElementById("canvasCamera");
    var canvas = canvasElement.getContext("2d");
    var loadingMessage = document.getElementById("loadingMessage");

    function drawLine(begin, end, color) {
      canvas.beginPath();
      canvas.moveTo(begin.x, begin.y);
      canvas.lineTo(end.x, end.y);
      canvas.lineWidth = 4;
      canvas.strokeStyle = color;
      canvas.stroke();
    }

    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
     
      requestAnimationFrame(tick);
    });

    let isClosed = false

    function tick() {
      
        

      loadingMessage.innerText = "⌛ Loading video..."
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        loadingMessage.hidden = true;
        canvasElement.hidden = false;
        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        
        var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {

          drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
          drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
          drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
          drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
         
          let id = null
          if (code.data.indexOf('id=') > -1) {
              id = code.data.split('id=')[1]
              if (id.indexOf('&') > -1) {
                  id = id.split('&')[0]
              }
          } else {
              id = code.data
              if (callbackCode(id)) {
                return
              }
          }
          
          
          if (callbackCode(id)) {
            return
          }

        }
      }

      if (!isClosed) requestAnimationFrame(tick);
    }


    return {
        onClose: function() {
            isClosed = true
        }
    }
}
