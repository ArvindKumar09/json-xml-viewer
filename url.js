// URL encoding and decoding functions

function urlEncode() {
  const input = document.getElementById('url-input').value;
  const output = document.getElementById('url-output');
  
  if (!input.trim()) {
    output.innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-link" style="font-size: 48px; margin-bottom: 10px;"></i><div>Enter text to encode</div></div>';
    return;
  }
  
  const encoded = encodeURIComponent(input);
  output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px; word-break: break-all;"><strong>URL Encoded:</strong><br><br>${encoded}</div>`;
}

function urlDecode() {
  const input = document.getElementById('url-input').value;
  const output = document.getElementById('url-output');
  
  if (!input.trim()) {
    output.innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-link" style="font-size: 48px; margin-bottom: 10px;"></i><div>Enter URL-encoded text to decode</div></div>';
    return;
  }
  
  try {
    const decoded = decodeURIComponent(input);
    output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px; word-break: break-all;"><strong>URL Decoded:</strong><br><br>${decoded}</div>`;
  } catch (e) {
    output.innerHTML = '<div style="color: #ff6b6b; padding: 10px;">Invalid URL-encoded string</div>';
  }
}

function switchUrlDirection() {
  const input = document.getElementById('url-input').value;
  const outputDiv = document.getElementById('url-output');
  const outputText = outputDiv.textContent || outputDiv.innerText || '';
  
  if (input.trim() && outputText.trim()) {
    document.getElementById('url-input').value = outputText;
    outputDiv.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px; word-break: break-all;">${input}</div>`;
  }
}
