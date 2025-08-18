// Password Generator Tool
// Secure password generation with customizable options and strength analysis

class PasswordGenerator {
  constructor() {
    this.charSets = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      ambiguous: '0O1lI|`'
    };
    
    this.commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
      'qwerty123', 'dragon', 'master', 'hello', 'login', 'welcome123'
    ];
  }

  // Generate a single password
  generate(options = {}) {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeAmbiguous = false,
      customChars = ''
    } = options;

    if (length < 4) {
      throw new Error('Password length must be at least 4 characters');
    }

    let charset = '';
    let requiredChars = [];

    // Build character set based on options
    if (includeUppercase) {
      charset += this.charSets.uppercase;
      requiredChars.push(this.getRandomChar(this.charSets.uppercase));
    }
    
    if (includeLowercase) {
      charset += this.charSets.lowercase;
      requiredChars.push(this.getRandomChar(this.charSets.lowercase));
    }
    
    if (includeNumbers) {
      charset += this.charSets.numbers;
      requiredChars.push(this.getRandomChar(this.charSets.numbers));
    }
    
    if (includeSymbols) {
      charset += this.charSets.symbols;
      requiredChars.push(this.getRandomChar(this.charSets.symbols));
    }

    // Add custom characters if provided
    if (customChars) {
      charset += customChars;
    }

    // Remove ambiguous characters if requested
    if (excludeAmbiguous) {
      for (const char of this.charSets.ambiguous) {
        charset = charset.replace(new RegExp(char, 'g'), '');
      }
    }

    if (charset.length === 0) {
      throw new Error('No characters available for password generation');
    }

    // Generate password ensuring at least one character from each selected set
    let password = '';
    
    // Add required characters first
    for (const char of requiredChars) {
      password += char;
    }

    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      password += this.getRandomChar(charset);
    }

    // Shuffle the password to avoid predictable patterns
    password = this.shuffleString(password);

    return password;
  }

  // Generate multiple passwords
  generateMultiple(count = 5, options = {}) {
    const passwords = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const password = this.generate(options);
        const strength = this.analyzeStrength(password);
        passwords.push({
          password: password,
          strength: strength
        });
      } catch (error) {
        passwords.push({
          password: null,
          error: error.message
        });
      }
    }

    return passwords;
  }

  // Analyze password strength
  analyzeStrength(password) {
    let score = 0;
    const analysis = {
      length: password.length,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSymbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
      hasRepeating: /(.)\1{2,}/.test(password),
      isCommon: this.isCommonPassword(password),
      entropy: this.calculateEntropy(password)
    };

    // Length scoring
    if (password.length >= 16) score += 25;
    else if (password.length >= 12) score += 20;
    else if (password.length >= 8) score += 10;
    else score -= 10;

    // Character variety scoring
    if (analysis.hasUppercase) score += 15;
    if (analysis.hasLowercase) score += 15;
    if (analysis.hasNumbers) score += 15;
    if (analysis.hasSymbols) score += 20;

    // Pattern penalties
    if (analysis.hasRepeating) score -= 15;
    if (analysis.isCommon) score -= 30;
    if (this.hasSequentialChars(password)) score -= 10;
    if (this.hasKeyboardPatterns(password)) score -= 15;

    // Entropy bonus
    if (analysis.entropy > 50) score += 10;
    else if (analysis.entropy > 40) score += 5;

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    let strength, color;
    if (score >= 80) {
      strength = 'Very Strong';
      color = '#2ecc71';
    } else if (score >= 60) {
      strength = 'Strong';
      color = '#27ae60';
    } else if (score >= 40) {
      strength = 'Medium';
      color = '#f39c12';
    } else if (score >= 20) {
      strength = 'Weak';
      color = '#e67e22';
    } else {
      strength = 'Very Weak';
      color = '#e74c3c';
    }

    return {
      score: score,
      strength: strength,
      color: color,
      analysis: analysis,
      recommendations: this.getRecommendations(analysis, score)
    };
  }

  // Calculate password entropy
  calculateEntropy(password) {
    const charset = this.getCharsetSize(password);
    return Math.log2(Math.pow(charset, password.length));
  }

  // Get charset size based on password content
  getCharsetSize(password) {
    let size = 0;
    
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/\d/.test(password)) size += 10;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) size += 32;
    
    return size;
  }

  // Check for common passwords
  isCommonPassword(password) {
    const lowerPassword = password.toLowerCase();
    return this.commonPasswords.some(common => {
      return lowerPassword.includes(common) || common.includes(lowerPassword);
    });
  }

  // Check for sequential characters
  hasSequentialChars(password) {
    const sequences = ['123', '321', 'abc', 'cba', 'qwe', 'asd', 'zxc'];
    const lowerPassword = password.toLowerCase();
    
    return sequences.some(seq => lowerPassword.includes(seq));
  }

  // Check for keyboard patterns
  hasKeyboardPatterns(password) {
    const patterns = [
      'qwerty', 'asdfgh', 'zxcvbn', '123456', '654321',
      'qaz', 'wsx', 'edc', 'rfv', 'tgb', 'yhn', 'ujm'
    ];
    const lowerPassword = password.toLowerCase();
    
    return patterns.some(pattern => lowerPassword.includes(pattern));
  }

  // Get strength recommendations
  getRecommendations(analysis, score) {
    const recommendations = [];

    if (analysis.length < 12) {
      recommendations.push('Increase length to at least 12 characters');
    }

    if (!analysis.hasUppercase) {
      recommendations.push('Add uppercase letters (A-Z)');
    }

    if (!analysis.hasLowercase) {
      recommendations.push('Add lowercase letters (a-z)');
    }

    if (!analysis.hasNumbers) {
      recommendations.push('Add numbers (0-9)');
    }

    if (!analysis.hasSymbols) {
      recommendations.push('Add special symbols (!@#$%^&*)');
    }

    if (analysis.hasRepeating) {
      recommendations.push('Avoid repeating characters');
    }

    if (analysis.isCommon) {
      recommendations.push('Avoid common passwords and dictionary words');
    }

    if (score < 60) {
      recommendations.push('Consider using a passphrase or longer password');
    }

    return recommendations;
  }

  // Generate passphrase (word-based password)
  generatePassphrase(options = {}) {
    const {
      wordCount = 4,
      separator = '-',
      includeNumbers = true,
      capitalize = true
    } = options;

    // Simple word list for passphrase generation
    const words = [
      'apple', 'bridge', 'castle', 'dragon', 'elephant', 'forest', 'guitar', 'harbor',
      'island', 'jungle', 'kitchen', 'laptop', 'mountain', 'ocean', 'planet', 'queen',
      'rabbit', 'sunset', 'tiger', 'umbrella', 'village', 'window', 'yellow', 'zebra',
      'anchor', 'balloon', 'camera', 'diamond', 'engine', 'falcon', 'garden', 'hammer',
      'igloo', 'jacket', 'knight', 'lemon', 'marble', 'needle', 'orange', 'pencil'
    ];

    let passphrase = [];

    for (let i = 0; i < wordCount; i++) {
      let word = words[Math.floor(Math.random() * words.length)];
      
      if (capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      if (includeNumbers && Math.random() < 0.3) {
        word += Math.floor(Math.random() * 100);
      }
      
      passphrase.push(word);
    }

    return passphrase.join(separator);
  }

  // Helper methods
  getRandomChar(charset) {
    return charset.charAt(Math.floor(Math.random() * charset.length));
  }

  shuffleString(str) {
    return str.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Generate memorable password
  generateMemorable(length = 16) {
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const vowels = 'aeiou';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    let password = '';
    let useConsonant = true;

    while (password.length < length) {
      if (password.length > 0 && password.length % 4 === 0) {
        // Add number or symbol every 4 characters
        if (Math.random() < 0.7) {
          password += this.getRandomChar(numbers);
        } else {
          password += this.getRandomChar(symbols);
        }
      } else {
        // Alternate between consonants and vowels
        if (useConsonant) {
          password += this.getRandomChar(consonants);
        } else {
          password += this.getRandomChar(vowels);
        }
        useConsonant = !useConsonant;
      }
    }

    // Capitalize some letters randomly
    password = password.split('').map(char => {
      if (/[a-z]/.test(char) && Math.random() < 0.3) {
        return char.toUpperCase();
      }
      return char;
    }).join('');

    return password.substring(0, length);
  }
}

// Global password generator instance
const passwordGenerator = new PasswordGenerator();

// Generate single password
function generatePassword() {
  try {
    const options = {
      length: parseInt(document.getElementById('password-length').value) || 16,
      includeUppercase: document.getElementById('password-uppercase').checked,
      includeLowercase: document.getElementById('password-lowercase').checked,
      includeNumbers: document.getElementById('password-numbers').checked,
      includeSymbols: document.getElementById('password-symbols').checked,
      excludeAmbiguous: document.getElementById('password-exclude-ambiguous').checked
    };

    const password = passwordGenerator.generate(options);
    const strength = passwordGenerator.analyzeStrength(password);

    displaySinglePassword(password, strength);
    showNotification('Password generated successfully', 'success');
  } catch (error) {
    document.getElementById('password-output').innerHTML = `
      <div class="error">
        <h4>❌ Generation Error</h4>
        <p>${error.message}</p>
      </div>
    `;
    showNotification('Password generation failed', 'error');
  }
}

// Generate multiple passwords
function generateMultiplePasswords() {
  try {
    const count = parseInt(document.getElementById('password-count').value) || 5;
    const options = {
      length: parseInt(document.getElementById('password-length').value) || 16,
      includeUppercase: document.getElementById('password-uppercase').checked,
      includeLowercase: document.getElementById('password-lowercase').checked,
      includeNumbers: document.getElementById('password-numbers').checked,
      includeSymbols: document.getElementById('password-symbols').checked,
      excludeAmbiguous: document.getElementById('password-exclude-ambiguous').checked
    };

    const passwords = passwordGenerator.generateMultiple(count, options);
    displayMultiplePasswords(passwords);
    showNotification(`${count} passwords generated successfully`, 'success');
  } catch (error) {
    showNotification('Password generation failed', 'error');
  }
}

// Display single password with analysis
function displaySinglePassword(password, strength) {
  const html = `
    <div class="password-result">
      <div class="generated-password">
        <h4>🔐 Generated Password</h4>
        <div class="password-display">
          <input type="text" value="${password}" readonly onclick="this.select()">
          <button onclick="copyToClipboard('${password}')" title="Copy password">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      </div>

      <div class="password-strength-analysis">
        <h5>💪 Strength Analysis</h5>
        <div class="strength-meter">
          <div class="strength-bar">
            <div class="strength-fill" style="width: ${strength.score}%; background-color: ${strength.color}"></div>
          </div>
          <div class="strength-info">
            <span class="strength-score">${strength.score}/100</span>
            <span class="strength-level" style="color: ${strength.color}">${strength.strength}</span>
          </div>
        </div>

        <div class="strength-details">
          <div class="detail-grid">
            <div class="detail-item ${strength.analysis.length >= 12 ? 'good' : 'bad'}">
              <i class="fas fa-ruler"></i>
              <span>Length: ${strength.analysis.length} chars</span>
            </div>
            <div class="detail-item ${strength.analysis.hasUppercase ? 'good' : 'bad'}">
              <i class="fas fa-font"></i>
              <span>Uppercase: ${strength.analysis.hasUppercase ? '✓' : '✗'}</span>
            </div>
            <div class="detail-item ${strength.analysis.hasLowercase ? 'good' : 'bad'}">
              <i class="fas fa-font"></i>
              <span>Lowercase: ${strength.analysis.hasLowercase ? '✓' : '✗'}</span>
            </div>
            <div class="detail-item ${strength.analysis.hasNumbers ? 'good' : 'bad'}">
              <i class="fas fa-hashtag"></i>
              <span>Numbers: ${strength.analysis.hasNumbers ? '✓' : '✗'}</span>
            </div>
            <div class="detail-item ${strength.analysis.hasSymbols ? 'good' : 'bad'}">
              <i class="fas fa-at"></i>
              <span>Symbols: ${strength.analysis.hasSymbols ? '✓' : '✗'}</span>
            </div>
            <div class="detail-item ${!strength.analysis.isCommon ? 'good' : 'bad'}">
              <i class="fas fa-shield-alt"></i>
              <span>Common: ${strength.analysis.isCommon ? '✗' : '✓'}</span>
            </div>
          </div>
        </div>

        <div class="entropy-info">
          <strong>Entropy:</strong> ${Math.round(strength.analysis.entropy)} bits
          <small>(Higher is better)</small>
        </div>

        ${strength.recommendations.length > 0 ? `
          <div class="recommendations">
            <h6>💡 Recommendations:</h6>
            <ul>
              ${strength.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('password-output').innerHTML = html;
  updateStrengthMeter(strength);
}

// Display multiple passwords
function displayMultiplePasswords(passwords) {
  let html = `
    <div class="multiple-passwords">
      <h4>🔐 Generated Passwords</h4>
      <div class="passwords-list">
  `;

  passwords.forEach((item, index) => {
    if (item.error) {
      html += `
        <div class="password-item error">
          <span class="password-number">#${index + 1}</span>
          <span class="password-error">Error: ${item.error}</span>
        </div>
      `;
    } else {
      const { password, strength } = item;
      html += `
        <div class="password-item">
          <span class="password-number">#${index + 1}</span>
          <div class="password-info">
            <div class="password-text">
              <input type="text" value="${password}" readonly onclick="this.select()">
              <button onclick="copyToClipboard('${password}')" title="Copy password">
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <div class="password-mini-strength">
              <div class="mini-strength-bar">
                <div class="mini-strength-fill" style="width: ${strength.score}%; background-color: ${strength.color}"></div>
              </div>
              <span class="mini-strength-text" style="color: ${strength.color}">${strength.strength}</span>
            </div>
          </div>
        </div>
      `;
    }
  });

  html += `
      </div>
      <div class="bulk-actions">
        <button onclick="copyAllPasswords()">
          <i class="fas fa-copy"></i> Copy All
        </button>
        <button onclick="exportPasswords()">
          <i class="fas fa-download"></i> Export
        </button>
      </div>
    </div>
  `;

  document.getElementById('password-output').innerHTML = html;
}

// Copy all passwords
function copyAllPasswords() {
  const passwordInputs = document.querySelectorAll('.password-item input[type="text"]');
  const passwords = Array.from(passwordInputs).map(input => input.value);
  const allPasswords = passwords.join('\n');
  
  copyToClipboard(allPasswords);
  showNotification(`${passwords.length} passwords copied to clipboard`, 'success');
}

// Export passwords to file
function exportPasswords() {
  const passwordInputs = document.querySelectorAll('.password-item input[type="text"]');
  const passwords = Array.from(passwordInputs).map((input, index) => `${index + 1}. ${input.value}`);
  
  const content = `Generated Passwords - ${new Date().toLocaleString()}\n\n${passwords.join('\n')}`;
  downloadFile(`passwords_${Date.now()}.txt`, content);
  
  showNotification('Passwords exported successfully', 'success');
}

// Update strength meter animation
function updateStrengthMeter(strength) {
  const strengthFill = document.querySelector('.strength-fill');
  if (strengthFill) {
    // Animate the strength bar
    strengthFill.style.width = '0%';
    setTimeout(() => {
      strengthFill.style.width = strength.score + '%';
    }, 100);
  }
}
