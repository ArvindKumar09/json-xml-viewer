// Hash generation functions (MD5, SHA1, SHA256, SHA384, SHA512)

async function generateHash(algorithm) {
  const input = document.getElementById('hash-input').value;
  const outputElement = document.getElementById('hash-output');
  
  if (!input.trim()) {
    outputElement.innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-hashtag" style="font-size: 48px; margin-bottom: 10px;"></i><div>Enter text to generate hash</div></div>';
    return;
  }
  
  try {
    let hash = '';
    
    // Use crypto-js if available for better hash support
    if (typeof CryptoJS !== 'undefined') {
      switch (algorithm) {
        case 'md5':
          hash = CryptoJS.MD5(input).toString();
          break;
        case 'sha1':
          hash = CryptoJS.SHA1(input).toString();
          break;
        case 'sha256':
          hash = CryptoJS.SHA256(input).toString();
          break;
        case 'sha384':
          hash = CryptoJS.SHA384(input).toString();
          break;
        case 'sha512':
          hash = CryptoJS.SHA512(input).toString();
          break;
        default:
          hash = CryptoJS.SHA256(input).toString();
      }
      outputElement.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px;"><strong>${algorithm.toUpperCase()}:</strong><br><br>${hash}</div>`;
    } 
    // Fallback to Web Crypto API
    else if (window.crypto && window.crypto.subtle && algorithm !== 'md5') {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      
      let cryptoAlgorithm;
      switch (algorithm) {
        case 'sha1':
          cryptoAlgorithm = 'SHA-1';
          break;
        case 'sha256':
          cryptoAlgorithm = 'SHA-256';
          break;
        case 'sha384':
          cryptoAlgorithm = 'SHA-384';
          break;
        case 'sha512':
          cryptoAlgorithm = 'SHA-512';
          break;
        default:
          cryptoAlgorithm = 'SHA-256';
      }
      
      const hashBuffer = await crypto.subtle.digest(cryptoAlgorithm, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      outputElement.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px;"><strong>${algorithm.toUpperCase()}:</strong><br><br>${hashHex}</div>`;
    } 
    // Simple fallback for unsupported cases
    else {
      if (algorithm === 'md5') {
        outputElement.innerHTML = '<div style="color: #ff6b6b; padding: 10px;">MD5 requires crypto-js library. <br><br>Please load the page with an internet connection for full crypto support.</div>';
      } else {
        outputElement.innerHTML = '<div style="color: #ff6b6b; padding: 10px;">Hash algorithm not supported in this browser</div>';
      }
    }
  } catch (error) {
    outputElement.innerHTML = `<div style="color: #ff6b6b; padding: 10px;">Error generating hash: ${error.message}</div>`;
  }
}
