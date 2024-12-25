// Select DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const uploadBtn = document.getElementById('upload-btn');
const imageInput = document.getElementById('image-input');
const statusText = document.getElementById('status');

// Check for MediaDevices API support
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Start the video stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
        })
        .catch((err) => {
            console.error('Error accessing the camera:', err);
            statusText.textContent = 'Error accessing the camera. Ensure permissions are enabled.';
        });
} else {
    console.error('navigator.mediaDevices is not available.');
    statusText.textContent = 'Your browser does not support camera access. Please use a modern browser with HTTPS.';
}

// Load the TensorFlow.js handpose model
let model;
handpose.load().then((loadedModel) => {
    model = loadedModel;
    console.log('Handpose model loaded');
}).catch((err) => {
    console.error('Error loading the handpose model:', err);
    statusText.textContent = 'Failed to load the handpose model. Please check your connection.';
});

// Video event listener to detect gestures
video.addEventListener('loadeddata', () => {
    if (!model) return;

    setInterval(async () => {
        if (!model) return;

        // Make predictions
        try {
            const predictions = await model.estimateHands(video);

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Draw landmarks and check for gestures
            if (predictions.length > 0) {
                const landmarks = predictions[0].landmarks;

                // Draw landmarks on canvas
                landmarks.forEach(([x, y]) => {
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = 'red';
                    ctx.fill();
                });

                // Example: Open hand detection
                const [thumbTip, indexTip] = [landmarks[4], landmarks[8]];
                const distance = Math.hypot(
                    thumbTip[0] - indexTip[0],
                    thumbTip[1] - indexTip[1]
                );

                if (distance > 50) {
                    statusText.textContent = 'Open hand detected!';
                } else {
                    statusText.textContent = '';
                }
            }
        } catch (err) {
            console.error('Error during handpose estimation:', err);
        }
    }, 100);
});

// Handle image upload
uploadBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    fetch('/upload', {
        method: 'POST',
        body: formData,
    })
        .then((response) => response.text())
        .then((data) => {
            statusText.textContent = `Image uploaded successfully: ${data}`;
        })
        .catch((error) => {
            console.error('Error uploading image:', error);
            statusText.textContent = 'Failed to upload the image. Please try again.';
        });
});
