var qrCode = null

var showQRCode = function(app, elem) {
  let c = new PIXI.Color(app.color)

  var url = window.location.protocol + '//' + window.location.host + window.location.pathname + '?id=' + app.serverId + '&color=' + c.toHex().replace('/^#/', '')
  if (!qrCode) {
    qrCode = new QRious({
      element: elem,
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

  return qrCode

}

var initDialog = (app) => {
  app.settingsDialog = document.getElementById('settingsDialog')

  let input = app.settingsDialog.querySelector('#inputServerId')
  let btnAccept = app.settingsDialog.querySelector('#btnAccept')
  let btnClose = app.settingsDialog.querySelector('#btnClose')
  var canvasElement = document.getElementById("canvasCamera");
  var loadingMessage = document.getElementById("loadingMessage"); 
  var canvas = canvasElement.getContext("2d");

  app.settingsDialog.addEventListener("close", () => {
          console.log("Dialog wurde geschlossen")
          if (app.qrCodeReader) {
              app.qrCodeReader.onClose()
          }
          setUrlParams(app.serverId)
      }
  );


  
  app.settingsDialog.show =() => {
      input.value = app.serverId

      canvasElement.hidden = true;
      loadingMessage.hidden = true
      canvasElement.height = 0;
      canvasElement.width = 0;


      app.settingsDialog.showModal()
  }

  btnAccept.addEventListener('click', {   
      handleEvent: function(event) {
          app.serverId = input.value
          app.settingsDialog.close()
      }
  })

  btnClose.addEventListener('click', {   
      handleEvent: function(event) {
          app.settingsDialog.close()
      }
  })

  document.getElementById('btnScan').onclick = () => {
      app.qrCodeReader = startQRCode(app, (code) => {
          if (code) {
              app.serverId = code
              input.value = code
              app.settingsDialog.close()
              return true
          }
      })
  }
  
}

var startQRCode = function(app, callbackCode) {
  var canvasElement = document.getElementById("canvasCamera");
  var loadingMessage = document.getElementById("loadingMessage"); 
  var canvas = canvasElement.getContext("2d");

    if (app.qrCodeReader) {
      app.qrCodeReader.onClose()
    }

    var video = document.createElement("video");
   

    function drawLine(begin, end, color) {
      canvas.beginPath();
      canvas.moveTo(begin.x, begin.y);
      canvas.lineTo(end.x, end.y);
      canvas.lineWidth = 4;
      canvas.strokeStyle = color;
      canvas.stroke();
    }

    loadingMessage.innerText = "Loading video..."
    loadingMessage.hidden = false;
    
    var qrCodeReaderStream = null
    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
      loadingMessage.innerText = "Access granted";
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      qrCodeReaderStream = stream
      requestAnimationFrame(tick);
    }).catch(function(error) {
      console.error("Error accessing media devices.", error);
     
      loadingMessage.innerText = "Error accessing camera. Please ensure you are using HTTPS.";
    });

    let isClosed = false

    function tick() {
    
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
          } else if (code.data.indexOf('fw://') === 0) {
              id = code.data
              if (callbackCode(id)) {
                return
              }
          } else {
            loadingMessage.hidden = false
            loadingMessage.innerText = 'QR-Code not recognized'
          }
        
        }
      }

      if (!isClosed) requestAnimationFrame(tick);
    }


    return {
        onClose: function() {
            console.log('close reader', qrCodeReaderStream)
            isClosed = true
            qrCodeReaderStream && qrCodeReaderStream.getTracks().forEach(track => track.stop());
            app.qrCodeReader = null
            canvasElement.hidden = true;
            loadingMessage.hidden = true
            canvasElement.height = 0;
            canvasElement.width = 0;
        }
    }
}
