const video = document.getElementById("video");
const frame = document.getElementById("frame");
const captureBtn = document.getElementById("capture-btn");
//const downloadLink = document.getElementById("download-link");
const clearBtn = document.getElementById("clear-btn");
outputImg = document.getElementById("output-img");
const modeButtons = document.querySelectorAll(".mode-btn");

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

let currentMode = "1front"; // default mode

// Sizes in cm (width x height for display and final output)
const sizeCm = {
  "1front": { width: 1.6, height: 2.1 },
  "2spine": { width: 0.3, height: 2.1 },
  "3back": { width: 1.6, height: 2.1 }
};

const images = {
  "1front": {width: 0, height: 0,dataUrl: null},
  "2spine": {width: 0, height: 0,dataUrl: null},
  "3back": {width: 0, height: 0,dataUrl: null}
};

const DPI_OUTPUT = 96; // final output DPI
const FRAME_SCALE = 13.5;  // visual frame is 2x larger for user alignment

function cmToPx(cm) {
  var n = 3; // use 3 digits after decimal point (1mm resolution)
  var cpi = 2.54; // centimeters per inch
  var dpi = DPI_OUTPUT; // dots per inch
  var ppd = window.devicePixelRatio; // pixels per dot
  return Math.round((dpi * cm) / 2.54);
  //return Math.round((cm / 2.54) * (dpi*window.devicePixelRatio));
}

function generateCombinedImage() {
  const orderedKeys = ["1front", "2spine", "3back"];
  const parts = orderedKeys
    .map((key) => ({ ...images[key], key }))
    .filter((part) => part.dataUrl); // Only include parts that have been captured

  if (parts.length === 0) {
    console.warn("No images captured yet.");
    return;
  }

  const totalWidth = parts.reduce((sum, part) => sum + part.width, 0);
  const height = parts[0].height;

  const combinedCanvas = document.createElement("canvas");
  combinedCanvas.width = totalWidth;
  combinedCanvas.height = height;
  const combinedCtx = combinedCanvas.getContext("2d");

  let xOffset = 0;

  // Load each image and draw only after all are ready
  Promise.all(parts.map(part => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ img, width: part.width });
      img.src = part.dataUrl;
    });
  })).then((loadedImages) => {
    loadedImages.forEach(({ img, width }) => {
      combinedCtx.drawImage(img, xOffset, 0);
      xOffset += width;
    });

    const finalDataURL = combinedCanvas.toDataURL("image/png");
    outputImg.src = finalDataURL;
    //downloadLink.href = finalDataURL;
    //downloadLink.download = "book_cover_combined.png";
    //downloadLink.style.display = "inline-block";
  });
}



// Set frame size visually scaled for easier alignment
function updateFrame() {
  if (!video.videoWidth || !video.videoHeight) return;

  const videoCSSWidth = video.clientWidth;
  const videoCSSHeight = video.clientHeight;

  const { width, height } = sizeCm[currentMode];
  const frameWidthPx = cmToPx(width) * FRAME_SCALE;
  const frameHeightPx = cmToPx(height) * FRAME_SCALE;

  const widthRatio = frameWidthPx / video.videoWidth;
  const heightRatio = frameHeightPx / video.videoHeight;

  const frameCSSWidth = widthRatio * videoCSSWidth;
  const frameCSSHeight = heightRatio * videoCSSHeight;

  frame.style.width = `${frameCSSWidth}px`;
  frame.style.height = `${frameCSSHeight}px`;
}

// Capture exactly what is inside the frame, then scale it to output size

function captureImage() {
  if (!video.videoWidth || !video.videoHeight) {
    alert("Camera not ready.");
    return;
  }
  flashScreen();

  const captureW = cmToPx(sizeCm[currentMode].width) * FRAME_SCALE;
  const captureH = cmToPx(sizeCm[currentMode].height) * FRAME_SCALE;

  const cropX = 0;
  const cropY = 0;

  // High-res cropped image
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = captureW;
  cropCanvas.height = captureH;
  const cropCtx = cropCanvas.getContext("2d");

  cropCtx.drawImage(
    video,
    cropX, cropY, captureW, captureH,
    0, 0, captureW, captureH
  );

  const hiresDataURL = cropCanvas.toDataURL("image/png");
  //hiresImg.src = hiresDataURL;

  // Resize to final output size
  //const outputW = cmToPx(sizeCm[currentMode].width);
  //const outputH = cmToPx(sizeCm[currentMode].height);

  //const outputCanvas = document.createElement("canvas");
  //outputCanvas.width = outputW;
  //outputCanvas.height = outputH;

  //const outputCtx = outputCanvas.getContext("2d");
  //outputCtx.drawImage(cropCanvas, 0, 0, captureW, captureH, 0, 0, outputW, outputH);
  //const outputDataUrl = outputCanvas.toDataURL("image/png");
  //outputImg.src = outputCanvas.toDataURL("image/png");
  //outputImg.style.width = `${sizeCm[currentMode].width}cm`;
  //outputImg.style.height = `${sizeCm[currentMode].height}cm`;
  //downloadLink.href = outputImg.src;
  //downloadLink.download = `${currentMode}_cover.png`;
  //downloadLink.style.display = "inline-block";
  images[currentMode] = {
    width: captureW, //outputW,
    height: captureH, //outputH,
    dataUrl: hiresDataURL
  };
  generateCombinedImage();
}


// Switch modes (front/spine/back)
function updateModeUI() {
  modeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === currentMode);
  });
  captureBtn.disabled = !video.srcObject;
  updateFrame();
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode;
    updateModeUI();
  });
});

captureBtn.addEventListener("click", captureImage);

// Start camera and update frame when ready
async function startCamera() {
  outputImg.setAttribute("src", "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 }, // improve quality
        height: { ideal: 1080 }
      }
    });
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
    const waitForVideoReady = setInterval(() => {
      if (video.videoWidth && video.videoHeight) {
        clearInterval(waitForVideoReady);
        updateFrame();
        captureBtn.disabled = false;
      }
    }, 100);
  });
  } catch (e) {
    alert("Could not start camera: " + e.message);
  }
}
clearBtn.addEventListener("click", () => {
  // Reset stored images
  for (let key in images) {
    images[key] = {
      width: 0,
      height: 0,
      dataUrl: null
    };
  }

  // Clear the output preview and download
  // Clear the image properly
  const newImg = document.createElement("img");
  newImg.id = "output-img";
  newImg.className = "preview";
  newImg.src = '';

  const oldImg = document.getElementById("output-img");
  oldImg.replaceWith(newImg);
  outputImg = document.getElementById("output-img");
  //downloadLink.href = "";
  //downloadLink.style.display = "none";
});
function flashScreen() {
  const flash = document.getElementById("flash-overlay");
  flash.style.opacity = "1";
  setTimeout(() => {
    flash.style.opacity = "0";
  }, 100); // Duration of flash
}

startCamera();
updateModeUI();
