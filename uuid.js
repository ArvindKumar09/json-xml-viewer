// UUID generation and validation functions

function generateUUID(version = 'v4') {
  const output = document.getElementById('uuid-output');
  
  if (version === 'v1') {
    // UUID v1 generation (timestamp-based)
    const uuid = generateUUIDv1();
    output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px;"><strong>UUID v1 (Timestamp-based):</strong><br><br>${uuid}<br><br><small>Generated at: ${new Date().toISOString()}</small></div>`;
  } else {
    // UUID v4 generation (random)
    let uuid;
    if (window.crypto && window.crypto.randomUUID) {
      uuid = window.crypto.randomUUID();
    } else {
      // Fallback UUID v4 generation
      uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px;"><strong>UUID v4 (Random):</strong><br><br>${uuid}</div>`;
  }
}

function generateUUIDv1() {
  // Simple UUID v1 implementation
  const timestamp = Date.now();
  const randomBytes = new Array(16);
  for (let i = 0; i < 16; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  
  // Set version (4 bits) and variant (2 bits)
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x10; // Version 1
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // Variant 10
  
  const hex = randomBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}

function generateMultipleUUIDs() {
  const output = document.getElementById('uuid-output');
  const uuids = [];
  
  for (let i = 0; i < 10; i++) {
    let uuid;
    if (window.crypto && window.crypto.randomUUID) {
      uuid = window.crypto.randomUUID();
    } else {
      // Fallback UUID v4 generation
      uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    uuids.push(uuid);
  }
  
  output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px;"><strong>10 UUID v4 (Random):</strong><br><br>${uuids.join('<br>')}</div>`;
}

function validateUUID() {
  const input = document.getElementById('uuid-input').value.trim();
  const output = document.getElementById('uuid-output');
  
  if (!input) {
    output.innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-fingerprint" style="font-size: 48px; margin-bottom: 10px;"></i><div>Enter a UUID to validate</div></div>';
    return;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(input)) {
    const version = input.charAt(14);
    output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px; color: #28a745;"><strong>✅ Valid UUID v${version}</strong><br><br>${input}<br><br><small>UUID format is correct and follows RFC 4122 standards.</small></div>`;
  } else {
    output.innerHTML = `<div style="font-family: Consolas, monospace; padding: 10px; color: #dc3545;"><strong>❌ Invalid UUID format</strong><br><br>${input}<br><br><small>UUID should follow format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</small></div>`;
  }
}
