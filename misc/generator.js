var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");

var cloudImage = new Image()
cloudImage.src = '../gfx/vapor_cloud.png'
new Promise(resolve => {
    cloudImage.onload = () => {
        colorize(cloudImage, 139.0/256,69.0/256,19.0/256)
    }
})

const colorize = (image, r, g, b) => {
    const imageSize = image.width;
    const {width, height} = canvas;
    canvas.width = image.width;
    canvas.height = image.height;
  
    ctx.drawImage(image, 0, 0);
  
    const imageData = ctx.getImageData(0, 0, imageSize, imageSize);
  
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i + 0] *= r;
      imageData.data[i + 1] *= g;
      imageData.data[i + 2] *= b;
    }
  
    ctx.putImageData(imageData, 0, 0);
  }