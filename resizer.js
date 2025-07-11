const video = document.getElementById("video");
const frame = document.getElementById("frame");
const captureBtn = document.getElementById("capture-btn");
const downloadLink = document.getElementById("download-link");
const resultImg = document.getElementById("result");
const modeButtons = document.querySelectorAll(".mode-btn");

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

let currentMode = "front"; // default mode

// Sizes in cm (height x width)
const sizeCm = {
  front: { width: 2.1, height: 1.6 },  // 2.1cm wide x 1.6cm high (front/back)
  back: { width: 2.1, height: 1.6 },
  spine: { width: 2.1, height: 0.3 }
};

const DPI_CAPTURE = 300; // capture at high dpi for quality
const DPI_OUTPUT = 300;  // final output dpi (downscale to this)

// Scale factor to capture a bigger area than output
const SCALE_FACTOR = 1;

function cmToPx(cm, dpi) {
  return Math.round((cm / 2.54) * dpi);
}

// Set frame size based on current mode and scale factor
function updateFrame() {
  const baseWidthPx = cmToPx(sizeCm[currentMode].width, DPI_OUTPUT);
  const baseHeightPx = cmToPx(sizeCm[currentMode].height, DPI_OUTPUT);

  const scaledWidth = baseWidthPx * SCALE_FACTOR;
  const scaledHeight = baseHeightPx * SCALE_FACTOR;

  // Because video is width 100%, scale frame size to video element width and height
  // Calculate ratio between video native size and CSS size to scale frame accordingly

  const videoCSSWidth = video.clientWidth;
  const videoCSSHeight = video.clientHeight;

  // Calculate the frame size relative to the displayed video size
  // Video native width and height (videoWidth, videoHeight) could be different aspect ratio
  const videoAspectRatio = video.videoWidth / video.videoHeight;
  const cssAspectRatio = videoCSSWidth / videoCSSHeight;

  // We'll size the frame relative to video CSS size with scale factor
  // So frame width = video width * (captureWidthInVideoPixels / video.videoWidth)
  // Because we capture the center crop, the frame will be smaller or equal to video size

  // Compute relative capture rect size in % of video native resolution:
  const captureWidthVideoPx = cmToPx(sizeCm[currentMode].width, DPI_CAPTURE) * SCALE_FACTOR;
  const captureHeightVideoPx = cmToPx(sizeCm[currentMode].height, DPI_CAPTURE) * SCALE_FACTOR;

  const widthRatio = captureWidthVideoPx / video.videoWidth;
  const heightRatio = captureHeightVideoPx / video.videoHeight;

  // Frame size in CSS pixels
  const frameWidth = videoCSSWidth * widthRatio;
  const frameHeight = videoCSSHeight * heightRatio;

  frame.style.width = frameWidth + "px";
  frame.style.height = frameHeight + "px";
}

// Set active mode button UI
function updateModeUI() {
  modeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === currentMode);
  });
  captureBtn.disabled = !video.srcObject;
  updateFrame();
}

// Handle mode button click
modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode;
    updateModeUI();
  });
});

// Start camera stream
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
      updateFrame();
      captureBtn.disabled = false;
    });
  } catch (e) {
    alert("Could not start camera: " + e.message);
  }
}

// Capture function: capture bigger area, then downscale to output size
function captureImage() {
  const captureWidthPx = cmToPx(sizeCm[currentMode].width, DPI_CAPTURE) * SCALE_FACTOR;
  const captureHeightPx = cmToPx(sizeCm[currentMode].height, DPI_CAPTURE) * SCALE_FACTOR;

  const outputWidthPx = cmToPx(sizeCm[currentMode].width, DPI_OUTPUT);
  const outputHeightPx = cmToPx(sizeCm[currentMode].height, DPI_OUTPUT);

  canvas.width = outputWidthPx;
  canvas.height = outputHeightPx;

  // Calculate source rect on video (centered)
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  const srcX = Math.round((videoWidth - captureWidthPx) / 2);
  const srcY = Math.round((videoHeight - captureHeightPx) / 2);

  if (srcX < 0 || srcY < 0 || captureWidthPx > videoWidth || captureHeightPx > videoHeight) {
    alert("Capture size is larger than video resolution.");
    return;
  }

  ctx.drawImage(
    video,
    srcX, srcY, captureWidthPx, captureHeightPx,
    0, 0, outputWidthPx, outputHeightPx
  );

  const dataURL = canvas.toDataURL("image/png");
  resultImg.src = dataURL;
  downloadLink.href = dataURL;
  downloadLink.style.display = "inline-block";
  downloadLink.download = `${currentMode}_cover.png`;
}

captureBtn.addEventListener("click", captureImage);

startCamera();
updateModeUI();
