// Utility functions for various tools

// ========== COLOR CONVERSION FUNCTIONS ==========
function convertColor(format) {
  const input = document.getElementById('color-input').value.trim();
  const output = document.getElementById('color-output');
  
  if (!input) {
    output.innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-palette" style="font-size: 48px; margin-bottom: 10px;"></i><div>Enter a color value to convert</div></div>';
    return;
  }
  
  try {
    const color = parseColor(input);
    let result = '';
    
    switch (format) {
      case 'hex':
        result = rgbToHex(color.r, color.g, color.b);
        break;
      case 'rgb':
        result = `rgb(${color.r}, ${color.g}, ${color.b})`;
        break;
      case 'hsl':
        const hsl = rgbToHsl(color.r, color.g, color.b);
        result = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        break;
    }
    
    const colorPreview = `<div style="width: 50px; height: 50px; background: ${rgbToHex(color.r, color.g, color.b)}; border: 2px solid #ccc; border-radius: 4px; margin: 10px 0;"></div>`;
    output.innerHTML = `<div style="padding: 10px;">${colorPreview}<strong>${format.toUpperCase()}:</strong><br><br><div style="font-family: Consolas, monospace; padding: 10px; background: #f5f5f5; border-radius: 4px; word-break: break-all;">${result}</div></div>`;
  } catch (error) {
    output.innerHTML = `<div style="color: #ff6b6b; padding: 10px;">Error: ${error.message}</div>`;
  }
}

function parseColor(color) {
  // Remove whitespace
  color = color.replace(/\s/g, '');
  
  // Hex color
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    } else if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
  }
  
  // RGB color
  const rgbMatch = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  
  throw new Error('Invalid color format. Please use hex (#RRGGBB or #RGB) or rgb(r,g,b) format.');
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function convertFromPicker() {
  const picker = document.getElementById('color-picker');
  document.getElementById('color-input').value = picker.value;
  convertColor('hex');
}

// ========== TIMESTAMP CONVERSION FUNCTIONS ==========
function convertTimestamp(direction) {
  const input = document.getElementById('timestamp-input').value.trim();
  const output = document.getElementById('timestamp-output');
  
  if (!input) {
    output.innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-clock" style="font-size: 48px; margin-bottom: 10px;"></i><div>Enter a timestamp to convert</div></div>';
    return;
  }
  
  try {
    if (direction === 'toUnix') {
      const date = new Date(input);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      const unix = Math.floor(date.getTime() / 1000);
      output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px;"><strong>Unix Timestamp:</strong><br><br>${unix}<br><br><small>Human readable: ${date.toISOString()}</small></div>`;
    } else {
      const unix = parseInt(input);
      if (isNaN(unix)) {
        throw new Error('Invalid unix timestamp');
      }
      const date = new Date(unix * 1000);
      const relative = getRelativeTime(unix);
      output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px;"><strong>Human Readable:</strong><br><br>${date.toISOString()}<br><br><small>Local: ${date.toLocaleString()}</small><br><small>Relative: ${relative}</small></div>`;
    }
  } catch (error) {
    output.innerHTML = `<div style="color: #ff6b6b; padding: 10px;">Error: ${error.message}</div>`;
  }
}

function getCurrentTimestamp() {
  const output = document.getElementById('timestamp-output');
  const now = new Date();
  const unix = Math.floor(now.getTime() / 1000);
  
  output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px;"><strong>Current Timestamp:</strong><br><br><strong>Unix:</strong> ${unix}<br><strong>ISO:</strong> ${now.toISOString()}<br><strong>Local:</strong> ${now.toLocaleString()}</div>`;
}

function getRelativeTime(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// ========== TEXT UTILITY FUNCTIONS ==========
// Note: Text utility functions (convertCase, getTextStats, reverseText, etc.) 
// are implemented in the main HTML file to work correctly with the DOM structure

function updateTextStats(input, output) {
  // This function can be used to show live statistics
  const inputStats = {
    chars: input.length,
    words: input.trim() ? input.trim().split(/\s+/).length : 0,
    lines: input.split('\n').length
  };
  
  const outputStats = {
    chars: output.length,
    words: output.trim() ? output.trim().split(/\s+/).length : 0,
    lines: output.split('\n').length
  };
  
  console.log('Text stats updated:', { input: inputStats, output: outputStats });
}
