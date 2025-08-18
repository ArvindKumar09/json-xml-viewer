// JWT (JSON Web Token) decoding and verification functions

function decodeJWT() {
  const input = document.getElementById('jwt-input').value.trim();
  const output = document.getElementById('jwt-output');
  
  if (!input) {
    alert('Please enter a JWT token!');
    return;
  }
  
  try {
    const parts = input.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.');
    }
    
    // Decode header
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Decode payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Format timestamps
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return 'Not set';
      const date = new Date(timestamp * 1000);
      return `${date.toISOString()} (${date.toLocaleString()})`;
    };
    
    // Create formatted output
    const result = `🔑 JWT TOKEN DECODED

📋 HEADER:
${JSON.stringify(header, null, 2)}

📄 PAYLOAD:
${JSON.stringify(payload, null, 2)}

⏰ TIMESTAMPS:
• Issued At (iat): ${formatTimestamp(payload.iat)}
• Expires At (exp): ${formatTimestamp(payload.exp)}
• Not Before (nbf): ${formatTimestamp(payload.nbf)}

📊 TOKEN INFO:
• Algorithm: ${header.alg || 'Not specified'}
• Type: ${header.typ || 'Not specified'}
• Subject: ${payload.sub || 'Not specified'}
• Issuer: ${payload.iss || 'Not specified'}
• Audience: ${payload.aud || 'Not specified'}

⚠️ SIGNATURE:
${parts[2] ? 'Present (use "Verify JWT" to check validity)' : 'Missing'}

📝 RAW PARTS:
• Header: ${parts[0]}
• Payload: ${parts[1]}
• Signature: ${parts[2] || 'None'}`;

    output.innerHTML = result;
    output.style.color = '#333';
    
  } catch (error) {
    output.innerHTML = `❌ ERROR DECODING JWT:
${error.message}

💡 TIPS:
• Make sure the JWT is complete and properly formatted
• JWT should have 3 parts separated by dots (header.payload.signature)
• Check that the token hasn't been truncated when copying`;
    output.style.color = '#ff4444';
  }
}

function verifyJWT() {
  const input = document.getElementById('jwt-input').value.trim();
  const secret = document.getElementById('jwt-secret').value;
  const output = document.getElementById('jwt-output');
  
  if (!input) {
    alert('Please enter a JWT token!');
    return;
  }
  
  if (!secret) {
    alert('Please enter a secret key for verification!');
    return;
  }
  
  try {
    const parts = input.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.');
    }
    
    // First decode to get header and payload info
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    let expirationStatus = '';
    
    if (payload.exp) {
      if (payload.exp < now) {
        expirationStatus = '❌ EXPIRED';
      } else {
        const timeLeft = payload.exp - now;
        const hoursLeft = Math.floor(timeLeft / 3600);
        const minutesLeft = Math.floor((timeLeft % 3600) / 60);
        expirationStatus = `✅ Valid for ${hoursLeft}h ${minutesLeft}m`;
      }
    } else {
      expirationStatus = '⚠️ No expiration set';
    }
    
    // Check not before
    let notBeforeStatus = '';
    if (payload.nbf && payload.nbf > now) {
      notBeforeStatus = '⚠️ Not yet valid (nbf in future)';
    } else {
      notBeforeStatus = '✅ Valid from timestamp perspective';
    }
    
    // Note about signature verification
    const result = `🔍 JWT VERIFICATION ANALYSIS

⏰ EXPIRATION STATUS:
${expirationStatus}

🕐 NOT BEFORE STATUS:
${notBeforeStatus}

🔑 TOKEN DETAILS:
• Algorithm: ${header.alg}
• Type: ${header.typ}
• Subject: ${payload.sub || 'Not specified'}
• Issuer: ${payload.iss || 'Not specified'}
• Audience: ${payload.aud || 'Not specified'}

⚠️ SIGNATURE VERIFICATION:
This tool performs basic JWT structure and timestamp validation.
For production signature verification, use a proper JWT library 
that supports cryptographic validation with your secret key.

📋 HEADER:
${JSON.stringify(header, null, 2)}

📄 PAYLOAD:
${JSON.stringify(payload, null, 2)}

💡 SECURITY NOTE:
• Always verify JWT signatures server-side in production
• Never trust client-side JWT validation for security decisions
• This tool is for development and debugging purposes only`;

    output.innerHTML = result;
    output.style.color = '#333';
    
  } catch (error) {
    output.innerHTML = `❌ ERROR VERIFYING JWT:
${error.message}

💡 VERIFICATION TIPS:
• Ensure the JWT format is correct (3 parts separated by dots)
• Check that your secret key is correct
• Remember: signature verification requires cryptographic libraries
• This tool provides structure validation and expiration checking`;
    output.style.color = '#ff4444';
  }
}
