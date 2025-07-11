const video = document.getElementById('video');
//const frame = document.getElementById('frame');
const captureBtn = document.getElementById('capture');
const resultImg = document.getElementById('result');
const canvas = document.getElementById('canvas');
const downloadLink = document.getElementById('download-link');
const modeButtons = document.querySelectorAll('.mode-btn');
const originalWidth = video.videoWidth;
const originalHeight = video.videoHight;
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
  const { width, height } = sizeCm[currentMode];
  const pxWidth = cmToPx(width);
  const pxHeight = cmToPx(height);

  video.style.width = `${pxWidth}px`;
  video.style.height = `${pxHeight}px`;
  video.setAttribute('width', pxWidth);
  video.setAttribute('height', pxHeight);
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
  if (!video.videoWidth || !video.videoHeight) {
    alert("Video not ready.");
    return;
  }

  // Output size in px
  const outputWidth = cmToPx(sizeCm[currentMode].width);
  const outputHeight = cmToPx(sizeCm[currentMode].height);

  // Center crop from video
  const sw = outputWidth;
  const sh = outputHeight;
  const sx = (video.videoWidth - sw) / 2;
  const sy = (video.videoHeight - sh) / 2;

  console.log("Fallback Crop:", sx, sy, sw, sh);

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, outputWidth, outputHeight);
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);

  const dataURL = canvas.toDataURL("image/png");

  if (dataURL.length < 1000) {
    alert("Still no capture — video too small?");
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
