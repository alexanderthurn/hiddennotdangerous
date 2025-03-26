

var initDialog = (app) => {
  app.settingsDialog = document.getElementById('settingsDialog')

  let input = app.settingsDialog.querySelector('#inputServerId')
  let btnAccept = app.settingsDialog.querySelector('#btnAccept')
  let btnClose = app.settingsDialog.querySelector('#btnClose')
  var canvasElement = document.getElementById("canvasCamera");
  var loadingMessage = document.getElementById("loadingMessage"); 
  let divButtonsLayout = document.getElementById('layouts')
  let divButtonsColor = document.getElementById('colors')


  divButtonsColor.querySelectorAll("button").forEach((button) => {
      button.addEventListener('click', function() {
          let color = button.dataset.color
          app.color = new PIXI.Color(color)
          app.settingsDialog.style.backgroundColor = app.color.toHex();
          setUrlParam('color',color)
          updateSettingsDialog(app)
      })
  })

  divButtonsLayout.querySelectorAll("button").forEach((button) => {
    button.addEventListener('click', function() {
        let layout = button.dataset.layout
        app.layout = layout
        setUrlParam('layout',layout)
        updateSettingsDialog(app)
    })

})

  app.settingsDialog.addEventListener("close", () => {
          console.log("Dialog wurde geschlossen")
          if (app.qrCodeReader) {
              app.qrCodeReader.onClose()
          }
          if (app.serverId !== '' && getQueryParam('id') !== app.serverId) {
            setUrlParam('id',app.serverId)
            window.location.reload()
          }

      }
  );


  input.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        app.serverId = input.value
        app.settingsDialog.close()
      }
  });

  
  app.settingsDialog.show =() => {
      input.value = app.serverId

      canvasElement.hidden = true;
      loadingMessage.hidden = true
      canvasElement.height = 0;
      canvasElement.width = 0;
      btnScan.hidden = false
      updateSettingsDialog(app)
      //let dialogColor = new PIXI.Color([app.color.red*0.5, app.color.green*0.5, app.color.blue*0.5])
      //app.settingsDialog.style.backgroundColor = app.color.toHex();
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

var updateSettingsDialog = function(app) {
  let divButtonsLayout = document.getElementById('layouts')

  divButtonsLayout.querySelectorAll("button").forEach((button) => {
    if (app.layout === button.dataset.layout) {
      button.classList.add('selected')
    } else {
      button.classList.remove('selected')
    }
  })


  let divButtonsColor = document.getElementById('colors')


  divButtonsColor.querySelectorAll("button").forEach((button) => {
    if (app.color?.value === button.dataset.color) {
      button.classList.add('selected')
    } else {
      button.classList.remove('selected')
    }
  })

}

var startQRCode = function(app, callbackCode) {
  var canvasElement = document.getElementById("canvasCamera");
  var loadingMessage = document.getElementById("loadingMessage"); 
  var canvas = canvasElement.getContext("2d", { willReadFrequently: true });

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
    btnScan.hidden = true

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
              id = code.data.split('fw://')[1]
           
          } else {
            loadingMessage.hidden = false
            loadingMessage.innerText = 'QR-Code not recognized'
          }

          if (id && callbackCode(id)) {
            isClosed = true
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
