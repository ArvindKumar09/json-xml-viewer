// Base64 encoding and decoding functions

function encodeBase64() {
  const input = document.getElementById('base64-input').value;
  const output = document.getElementById('base64-output');
  
  if (!input.trim()) {
    alert('Please enter text to encode!');
    return;
  }
  
  try {
    const encoded = btoa(unescape(encodeURIComponent(input)));
    output.innerHTML = encoded;
    output.style.color = '#333';
  } catch (error) {
    output.innerHTML = 'Error encoding: ' + error.message;
    output.style.color = '#ff4444';
  }
}

function decodeBase64() {
  const input = document.getElementById('base64-input').value.trim();
  const output = document.getElementById('base64-output');
  
  if (!input) {
    alert('Please enter Base64 string to decode!');
    return;
  }
  
  try {
    const decoded = decodeURIComponent(escape(atob(input)));
    output.innerHTML = decoded;
    output.style.color = '#333';
  } catch (error) {
    output.innerHTML = 'Error decoding: Invalid Base64 string or corrupted data';
    output.style.color = '#ff4444';
  }
}
