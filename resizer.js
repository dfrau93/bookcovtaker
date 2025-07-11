const video = document.getElementById('video');
const frame = document.getElementById('frame');
const captureBtn = document.getElementById('capture');
const resultImg = document.getElementById('result');
const canvas = document.getElementById('canvas');
const downloadLink = document.getElementById('download-link');
const modeButtons = document.querySelectorAll('.mode-btn');

const DPI = 300;

// Sizes in cm (width x height), per your request:
const sizeCm = {
  front: { width: 1.6, height: 2.1 },
  spine: { width: 0.3, height: 2.1 },
  back: { width: 1.6, height: 2.1 },
};

// Current mode
let currentMode = 'front';

// Convert cm to px based on DPI
function cmToPx(cm) {
  return Math.round((cm / 2.54) * DPI);
}

// Update frame size/position based on current mode and video container
function updateFrame() {
  const frameStyle = frame.style;
  const container = video.getBoundingClientRect();

  // Convert size in cm to px at 300dpi
  const targetWidth = cmToPx(sizeCm[currentMode].width);
  const targetHeight = cmToPx(sizeCm[currentMode].height);

  // Scale to match the displayed video size
  const scaleX = video.clientWidth / video.videoWidth;
  const scaleY = video.clientHeight / video.videoHeight;

  const displayWidth = targetWidth * scaleX;
  const displayHeight = targetHeight * scaleY;

  frameStyle.width = `${displayWidth}px`;
  frameStyle.height = `${displayHeight}px`;
  frameStyle.display = 'block';
}

// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
      setTimeout(updateFrame, 500); // Delay allows layout to settle
    };
  } catch (err) {
    alert('Error accessing camera: ' + err.message);
  }
}

function captureAndResize() {
  const videoRect = video.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();

  // Check if video has proper resolution
  if (!video.videoWidth || !video.videoHeight) {
    alert("Video dimensions not ready.");
    return;
  }

  // Calculate scale between displayed video and real resolution
  const scaleX = video.videoWidth / videoRect.width;
  const scaleY = video.videoHeight / videoRect.height;

  // Get coordinates of the frame in video resolution
  const sx = (frameRect.left - videoRect.left) * scaleX;
  const sy = (frameRect.top - videoRect.top) * scaleY;
  const sw = frameRect.width * scaleX;
  const sh = frameRect.height * scaleY;

  // Final output size
  const outputWidth = cmToPx(sizeCm[currentMode].width);
  const outputHeight = cmToPx(sizeCm[currentMode].height);

  console.log("video.videoWidth:", video.videoWidth);
  console.log("video.clientWidth:", video.clientWidth);
  console.log("scaleX:", scaleX, "scaleY:", scaleY);
  console.log("Crop from:", sx, sy, sw, sh);
  console.log("Output size:", outputWidth, outputHeight);

  // Sanity check dimensions
  if (sw <= 0 || sh <= 0 || outputWidth <= 0 || outputHeight <= 0) {
    alert("Invalid capture area or output size.");
    return;
  }

  // Setup canvas
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, outputWidth, outputHeight);

  // Crop and resize from video to canvas
  ctx.drawImage(
    video,
    sx, sy, sw, sh,
    0, 0, outputWidth, outputHeight
  );

  const dataURL = canvas.toDataURL("image/png");

  // Check if anything was drawn
  if (canvas.toDataURL().length < 1000) {
    alert("Nothing captured. Check scaling and crop area.");
    return;
  }

  resultImg.src = dataURL;
  downloadLink.href = dataURL;
  downloadLink.style.display = "inline-block";
}



// Handle mode button clicks
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentMode = btn.getAttribute('data-mode');
    modeButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    console.log("mode:", currentMode);
    console.log("outputWidth:", cmToPx(sizeCm[currentMode].width));
    console.log("outputHeight:", cmToPx(sizeCm[currentMode].height));
    setTimeout(updateFrame, 100); // allow DOM layout to adjust
  });
});

captureBtn.addEventListener('click', captureAndResize);

// Initialize
startCamera();
