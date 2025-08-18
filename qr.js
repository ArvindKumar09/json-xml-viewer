// QR Code generation functions

function generateQR() {
  const input = document.getElementById('qr-input').value.trim();
  const canvas = document.getElementById('qr-canvas');
  const placeholder = document.getElementById('qr-placeholder');
  const size = parseInt(document.getElementById('qr-size').value) || 256;
  
  if (!input) {
    placeholder.style.display = 'flex';
    canvas.style.display = 'none';
    return;
  }
  
  try {
    // Try to use QRCode library if available
    if (typeof QRCode !== 'undefined') {
      // Clear previous QR code
      const qrContainer = document.getElementById('qr-container');
      qrContainer.innerHTML = '<canvas id="qr-canvas" style="display: none;"></canvas><div id="qr-placeholder" style="display: flex; align-items: center; justify-content: center; height: 256px; border: 2px dashed #ccc; border-radius: 8px; color: #888;"><div style="text-align: center;"><i class="fas fa-qrcode" style="font-size: 48px; margin-bottom: 10px;"></i><div>Enter text to generate QR code</div></div></div>';
      
      // Generate new QR code
      QRCode.toCanvas(document.getElementById('qr-canvas'), input, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, function(error) {
        if (error) {
          console.error(error);
          alert('Error generating QR code: ' + error.message);
        } else {
          document.getElementById('qr-placeholder').style.display = 'none';
          document.getElementById('qr-canvas').style.display = 'block';
        }
      });
    } else {
      // Fallback: generate simple QR code without library
      generateSimpleQR(input, canvas, placeholder, size);
    }
  } catch (error) {
    alert('Error generating QR code: ' + error.message);
  }
}

function generateSimpleQR(text, canvas, placeholder, size) {
  // Simple QR code generation fallback
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  
  // Fill with white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  
  // Create a simple pattern (not a real QR code, just visual feedback)
  ctx.fillStyle = '#000000';
  const blockSize = size / 25;
  
  // Draw finder patterns (corners)
  // Top-left
  ctx.fillRect(0, 0, blockSize * 7, blockSize * 7);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(blockSize, blockSize, blockSize * 5, blockSize * 5);
  ctx.fillStyle = '#000000';
  ctx.fillRect(blockSize * 2, blockSize * 2, blockSize * 3, blockSize * 3);
  
  // Top-right
  ctx.fillRect(size - blockSize * 7, 0, blockSize * 7, blockSize * 7);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(size - blockSize * 6, blockSize, blockSize * 5, blockSize * 5);
  ctx.fillStyle = '#000000';
  ctx.fillRect(size - blockSize * 5, blockSize * 2, blockSize * 3, blockSize * 3);
  
  // Bottom-left
  ctx.fillRect(0, size - blockSize * 7, blockSize * 7, blockSize * 7);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(blockSize, size - blockSize * 6, blockSize * 5, blockSize * 5);
  ctx.fillStyle = '#000000';
  ctx.fillRect(blockSize * 2, size - blockSize * 5, blockSize * 3, blockSize * 3);
  
  // Add some random pattern based on text
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  Math.seed = Math.abs(hash);
  const seededRandom = function() {
    const x = Math.sin(Math.seed++) * 10000;
    return x - Math.floor(x);
  };
  
  // Draw data pattern
  for (let i = 8; i < 17; i++) {
    for (let j = 8; j < 17; j++) {
      if (seededRandom() > 0.5) {
        ctx.fillRect(i * blockSize, j * blockSize, blockSize, blockSize);
      }
    }
  }
  
  placeholder.style.display = 'none';
  canvas.style.display = 'block';
  
  // Show message about using real QR library
  setTimeout(() => {
    alert('Note: For production use, please ensure QRCode.js library is loaded for proper QR code generation. This is a visual placeholder.');
  }, 100);
}

function downloadQR() {
  const canvas = document.getElementById('qr-canvas');
  
  if (canvas.style.display === 'none') {
    alert('Please generate a QR code first!');
    return;
  }
  
  try {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    alert('Error downloading QR code: ' + error.message);
  }
}

function clearQR() {
  const canvas = document.getElementById('qr-canvas');
  const placeholder = document.getElementById('qr-placeholder');
  const input = document.getElementById('qr-input');
  
  input.value = '';
  canvas.style.display = 'none';
  placeholder.style.display = 'flex';
  
  // Clear canvas
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
