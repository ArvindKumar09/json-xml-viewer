// Regex testing functions

function testRegex() {
  const pattern = document.getElementById('regex-pattern').value;
  const flags = document.getElementById('regex-flags').value;
  const input = document.getElementById('regex-input').value;
  const output = document.getElementById('regex-output');
  
  if (!pattern) {
    output.innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-search" style="font-size: 48px; margin-bottom: 10px;"></i><div>Enter a regex pattern to test</div></div>';
    return;
  }
  
  try {
    const regex = new RegExp(pattern, flags);
    const matches = input.match(regex);
    const allMatches = [...input.matchAll(new RegExp(pattern, flags + 'g'))];
    
    let result = `🔍 REGEX TEST RESULTS\n\n`;
    result += `Pattern: /${pattern}/${flags}\n`;
    result += `Test String Length: ${input.length} characters\n\n`;
    
    if (matches) {
      result += `✅ MATCH FOUND!\n\n`;
      result += `First Match: "${matches[0]}"\n`;
      result += `Match Index: ${matches.index}\n`;
      
      if (matches.length > 1) {
        result += `Captured Groups:\n`;
        for (let i = 1; i < matches.length; i++) {
          result += `  Group ${i}: "${matches[i] || 'undefined'}"\n`;
        }
      }
      
      if (allMatches.length > 1) {
        result += `\n📝 ALL MATCHES (${allMatches.length}):\n`;
        allMatches.forEach((match, index) => {
          result += `  ${index + 1}. "${match[0]}" at position ${match.index}\n`;
        });
      }
    } else {
      result += `❌ NO MATCH FOUND\n\n`;
      result += `The pattern did not match any part of the input string.`;
    }
    
    output.innerHTML = `<pre style="white-space: pre-wrap; font-family: Consolas, monospace; padding: 10px;">${result}</pre>`;
  } catch (error) {
    output.innerHTML = `<div style="color: #ff6b6b; padding: 10px;">❌ REGEX ERROR:\n\n${error.message}\n\n💡 Common issues:\n• Unescaped special characters\n• Invalid flag combinations\n• Unclosed groups or brackets</div>`;
  }
}

function insertRegexPattern(pattern) {
  document.getElementById('regex-pattern').value = pattern;
}

// API formatting functions
function formatAPI() {
  const input = document.getElementById('api-input').value.trim();
  const output = document.getElementById('api-output');
  
  if (!input) {
    output.innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-code" style="font-size: 48px; margin-bottom: 10px;"></i><div>Paste API response data to format</div></div>';
    return;
  }
  
  try {
    // Try to parse as JSON first
    const data = JSON.parse(input);
    
    let result = `🚀 API RESPONSE FORMATTER\n\n`;
    result += `📊 DATA SUMMARY:\n`;
    result += `Type: ${Array.isArray(data) ? 'Array' : typeof data}\n`;
    
    if (Array.isArray(data)) {
      result += `Items: ${data.length}\n`;
      if (data.length > 0) {
        result += `First item keys: ${Object.keys(data[0] || {}).length}\n`;
      }
    } else if (typeof data === 'object' && data !== null) {
      result += `Keys: ${Object.keys(data).length}\n`;
    }
    
    result += `\n📋 FORMATTED JSON:\n`;
    result += JSON.stringify(data, null, 2);
    
    // Generate additional formats
    result += `\n\n🔧 ADDITIONAL FORMATS:\n`;
    
    if (Array.isArray(data) && data.length > 0) {
      result += `\n📝 CSV Format:\n${generateCSV(data)}\n`;
      result += `\n📄 HTML Table:\n${generateHTMLTable(data)}\n`;
    }
    
    result += `\n🌐 cURL Command:\n${generateCurlCommand(data)}`;
    
    output.innerHTML = `<pre style="white-space: pre-wrap; font-family: Consolas, monospace; padding: 10px; background: #f8f9fa; border-radius: 4px;">${result}</pre>`;
    
  } catch (error) {
    output.innerHTML = `<div style="color: #ff6b6b; padding: 10px;">❌ PARSING ERROR:\n\n${error.message}\n\n💡 Please ensure the input is valid JSON format.</div>`;
  }
}

function generateCurlCommand(data) {
  return `curl -X GET \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  "https://api.example.com/endpoint"
  
# Response would be:
# ${JSON.stringify(data, null, 2).split('\n').join('\n# ')}`;
}

function generateHTMLTable(data) {
  if (!Array.isArray(data) || data.length === 0) return 'No tabular data available';
  
  const keys = Object.keys(data[0] || {});
  let html = '<table border="1" style="border-collapse: collapse;">\n';
  html += '  <thead>\n    <tr>\n';
  
  keys.forEach(key => {
    html += `      <th>${key}</th>\n`;
  });
  
  html += '    </tr>\n  </thead>\n  <tbody>\n';
  
  data.slice(0, 5).forEach(item => {
    html += '    <tr>\n';
    keys.forEach(key => {
      html += `      <td>${item[key] || ''}</td>\n`;
    });
    html += '    </tr>\n';
  });
  
  html += '  </tbody>\n</table>';
  
  if (data.length > 5) {
    html += `\n<!-- Showing first 5 of ${data.length} rows -->`;
  }
  
  return html;
}

function generateCSV(data) {
  if (!Array.isArray(data) || data.length === 0) return 'No data available';
  
  const keys = Object.keys(data[0] || {});
  let csv = keys.join(',') + '\n';
  
  data.slice(0, 10).forEach(item => {
    const row = keys.map(key => {
      const value = item[key] || '';
      return typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    });
    csv += row.join(',') + '\n';
  });
  
  if (data.length > 10) {
    csv += `# Showing first 10 of ${data.length} rows`;
  }
  
  return csv;
}
