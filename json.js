/**
 * Safely parse JSON, attempting repair if standard parse fails.
 * Returns { obj, repaired, fixes } or throws if unfixable.
 */
function safeParseJSON(input) {
  try {
    return { obj: JSON.parse(input), repaired: false, fixes: [] };
  } catch (e) {
    const repaired = tryRepairJSON(input);
    if (repaired.success) {
      const obj = JSON.parse(repaired.json);
      // Update the input field with fixed JSON
      const inputEl = document.getElementById('json-input');
      if (inputEl) {
        inputEl.value = repaired.json;
        localStorage.setItem('json-input', repaired.json);
      }
      return { obj, repaired: true, fixes: repaired.fixes };
    }
    throw e;
  }
}

// Convert JSON to CSV and show in JSON output window
function convertJSONtoCSV() {
  const input = document.getElementById('json-input').value;
  const output = document.getElementById('json-output');
  try {
    const { obj } = safeParseJSON(input);
    let csv = jsonToCSV(obj);
    output.innerHTML = `<pre style="white-space:pre;overflow:auto;">${escapeHtml(csv)}</pre>`;
  } catch (e) {
    showJSONError(input, e, output);
  }
}

// Helper: Convert array of objects or single object to CSV string
function jsonToCSV(obj) {
  let arr = Array.isArray(obj) ? obj : [obj];
  if (!arr.length || typeof arr[0] !== 'object') return '';
  // Collect all unique keys
  const keys = Array.from(arr.reduce((set, row) => {
    Object.keys(row).forEach(k => set.add(k));
    return set;
  }, new Set()));
  // Header
  const header = keys.join(',');
  // Rows
  const rows = arr.map(row => keys.map(k => csvEscape(flattenValue(row[k]))).join(','));
  return [header, ...rows].join('\n');
}

// Helper: Flatten nested objects/arrays to JSON string, otherwise return as is
function flattenValue(val) {
  if (val == null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

function csvEscape(val) {
  if (val == null) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Generate JavaScript classes/interfaces from JSON
function generateJavaScriptClasses() {
  const input = document.getElementById('json-input').value;
  const output = document.getElementById('json-output');
  
  if (!input.trim()) {
    output.textContent = 'Please enter JSON data to generate classes.';
    return;
  }
  
  try {
    const { obj } = safeParseJSON(input);
    const classes = jsonToJavaScriptClasses(obj, 'MainClass');
    output.innerHTML = `<pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 6px; margin: 0; font-size: 14px; line-height: 1.4;">${escapeHtml(classes)}</pre>`;
  } catch (e) {
    showJSONError(input, e, output);
  }
}

// Helper function to generate JavaScript classes from JSON object
function jsonToJavaScriptClasses(obj, className = 'GeneratedClass', processedClasses = new Set()) {
  let result = '';
  const nestedClasses = [];
  
  // Handle arrays
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      return jsonToJavaScriptClasses(obj[0], className, processedClasses);
    } else {
      return `// Empty array - unable to determine structure\nclass ${className} {\n  // Add properties as needed\n}\n\n`;
    }
  }
  
  // Handle primitive values
  if (typeof obj !== 'object' || obj === null) {
    return `// Primitive value: ${typeof obj}\nclass ${className} {\n  constructor(value) {\n    this.value = value; // ${typeof obj}\n  }\n}\n\n`;
  }
  
  // Generate class for object
  const properties = [];
  const constructorParams = [];
  const constructorAssignments = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const type = getJavaScriptType(value);
    const propertyName = sanitizePropertyName(key);
    
    // Handle nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedClassName = capitalizeFirst(propertyName);
      if (!processedClasses.has(nestedClassName)) {
        processedClasses.add(nestedClassName);
        nestedClasses.push(jsonToJavaScriptClasses(value, nestedClassName, processedClasses));
      }
      properties.push(`  ${propertyName}; // ${nestedClassName}`);
      constructorParams.push(`${propertyName} = null`);
      constructorAssignments.push(`    this.${propertyName} = ${propertyName};`);
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        const itemClassName = capitalizeFirst(propertyName.replace(/s$/, ''));
        if (!processedClasses.has(itemClassName)) {
          processedClasses.add(itemClassName);
          nestedClasses.push(jsonToJavaScriptClasses(value[0], itemClassName, processedClasses));
        }
        properties.push(`  ${propertyName}; // Array<${itemClassName}>`);
        constructorParams.push(`${propertyName} = []`);
        constructorAssignments.push(`    this.${propertyName} = ${propertyName};`);
      } else {
        const arrayType = value.length > 0 ? getJavaScriptType(value[0]) : 'any';
        properties.push(`  ${propertyName}; // Array<${arrayType}>`);
        constructorParams.push(`${propertyName} = []`);
        constructorAssignments.push(`    this.${propertyName} = ${propertyName};`);
      }
    }
    // Handle primitive types
    else {
      properties.push(`  ${propertyName}; // ${type}`);
      constructorParams.push(`${propertyName} = ${getDefaultValue(type)}`);
      constructorAssignments.push(`    this.${propertyName} = ${propertyName};`);
    }
  }
  
  // Generate class definition
  result += `class ${className} {\n`;
  if (properties.length > 0) {
    result += properties.join('\n') + '\n\n';
  }
  
  result += `  constructor(${constructorParams.join(', ')}) {\n`;
  result += constructorAssignments.join('\n');
  result += '\n  }\n\n';
  
  // Add static factory method
  result += `  static fromJSON(json) {\n`;
  result += `    const obj = typeof json === 'string' ? JSON.parse(json) : json;\n`;
  result += `    return new ${className}(\n`;
  
  const factoryParams = [];
  for (const [key, value] of Object.entries(obj)) {
    const propertyName = sanitizePropertyName(key);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedClassName = capitalizeFirst(propertyName);
      factoryParams.push(`      obj.${key} ? ${nestedClassName}.fromJSON(obj.${key}) : null`);
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const itemClassName = capitalizeFirst(propertyName.replace(/s$/, ''));
      factoryParams.push(`      obj.${key} ? obj.${key}.map(item => ${itemClassName}.fromJSON(item)) : []`);
    } else {
      factoryParams.push(`      obj.${key}`);
    }
  }
  
  result += factoryParams.join(',\n');
  result += '\n    );\n  }\n';
  result += '}\n\n';
  
  // Add nested classes
  result = nestedClasses.join('') + result;
  
  return result;
}

// Helper functions
function getJavaScriptType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'Array';
  const type = typeof value;
  if (type === 'object') return 'Object';
  return type;
}

function getDefaultValue(type) {
  switch (type) {
    case 'string': return '""';
    case 'number': return '0';
    case 'boolean': return 'false';
    case 'null': return 'null';
    default: return 'null';
  }
}

function sanitizePropertyName(name) {
  // Replace invalid characters and ensure it starts with letter or underscore
  return name.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^[0-9]/, '_$&');
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
// Collapse all JSON nodes
function collapseAllJSON() {
  document.querySelectorAll('#json-output .collapse').forEach(el => {
    el.classList.add('collapsed');
    const arrow = el.querySelector('.json-arrow');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  });
}

// Expand all JSON nodes
function expandAllJSON() {
  document.querySelectorAll('#json-output .collapse').forEach(el => {
    el.classList.remove('collapsed');
    const arrow = el.querySelector('.json-arrow');
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  });
}
// Remove all spaces from a given input area
function removeJSONSpaces(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.value = JSON.stringify(JSON.parse(el.value));
  // Store updated value in localStorage
  try {
    localStorage.setItem(inputId, el.value);
  } catch (e) {}
}
// Convert JSON to XML and put result in XML input
window.convertJSONtoCSV = convertJSONtoCSV;
function convertJSONtoXML() {
  const jsonInput = document.getElementById('json-input').value.trim();
  let xml = '';
  try {
    const obj = JSON.parse(jsonInput);
    xml = jsonToXml(obj, 'root');
    document.getElementById('xml-input').value = formatXml(xml);
    // Optionally switch to XML panel
    showOnly('xml');
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
  }
}

// Helper: Convert JS object to XML string
function jsonToXml(obj, nodeName) {
  if (typeof obj !== 'object' || obj === null) {
    return `<${nodeName}>${escapeXml(String(obj))}</${nodeName}>`;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => jsonToXml(item, nodeName)).join('');
  }
  let xml = `<${nodeName}`;
  let children = '';
window.expandAllJSON = expandAllJSON;
function expandAllJSON() {
  document.querySelectorAll('#json-output .collapse').forEach(el => {
    el.classList.remove('collapsed');
    const arrow = el.querySelector('.json-arrow');
    if (arrow) arrow.style.transform = 'rotate(90deg)';
  });
}
window.expandAllJSON = expandAllJSON;
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      children += jsonToXml(obj[key], key);
    } else {
      children += `<${key}>${escapeXml(String(obj[key]))}</${key}>`;
    }
  }
window.collapseAllJSON = collapseAllJSON;
function collapseAllJSON() {
  document.querySelectorAll('#json-output .collapse').forEach(el => {
    el.classList.add('collapsed');
    const arrow = el.querySelector('.json-arrow');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  });
}
window.collapseAllJSON = collapseAllJSON;
  xml += `>${children}</${nodeName}>`;
  return xml;
}

function escapeXml(str) {
  return str.replace(/[<>&"']/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
window.removeSpaces = removeSpaces;
function removeSpaces(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.value = el.value.replace(/\s+/g, '');
  // Store updated value in localStorage
  try {
    localStorage.setItem(inputId, el.value);
  } catch (e) {}
}
window.removeSpaces = removeSpaces;
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#39;';
    }
  });
}

// Pretty print XML
function formatXml(xml) {
window.convertJSONtoXML = convertJSONtoXML;
function convertJSONtoXML() {
  const jsonInput = document.getElementById('json-input').value.trim();
  let xml = '';
  try {
    const obj = JSON.parse(jsonInput);
    xml = jsonToXml(obj, 'root');
    document.getElementById('xml-input').value = formatXml(xml);
    // Optionally switch to XML panel
    showOnly('xml');
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
  }
}
window.convertJSONtoXML = convertJSONtoXML;
  let formatted = '', indent = '';
  xml.split(/\r?\n/).join('').replace(/(>)(<)(\/*)/g, '$1\n$2$3').split('\n').forEach(function(node) {
    let match = node.match(/^(\s*)<\/?\w/);
    if (match) {
      if (node.match(/^<\//)) indent = indent.substring(2);
      formatted += indent + node + '\n';
      if (node.match(/^<[^!?/]/) && !node.match(/\/>$/)) indent += '  ';
    } else {
      formatted += indent + node + '\n';
    }
  });
  return formatted.trim();
}

function beautifyJSON() {
  const input = document.getElementById('json-input').value;
  const output = document.getElementById('json-output');
  
  if (!input.trim()) {
    output.textContent = 'Please enter JSON data.';
    return;
  }
  
  // First try standard parse
  try {
    const obj = JSON.parse(input);
    output.innerHTML = jsonToTree(obj, true, []);
    setTimeout(() => { makeCollapsibleJSON(output); }, 0);
    return;
  } catch (originalError) {
    // Try to repair the JSON
    const repaired = tryRepairJSON(input);
    if (repaired.success) {
      try {
        const obj = JSON.parse(repaired.json);
        // Show a notice that JSON was auto-fixed
        const fixNotice = `<div class="json-fix-notice"><i class="fas fa-wrench"></i> <strong>Auto-fixed:</strong> ${escapeHtml(repaired.fixes.join('; '))}</div>`;
        output.innerHTML = fixNotice + jsonToTree(obj, true, []);
        // Also update the input with the fixed JSON
        document.getElementById('json-input').value = repaired.json;
        localStorage.setItem('json-input', repaired.json);
        setTimeout(() => { makeCollapsibleJSON(output); }, 0);
        return;
      } catch (e) {
        // Repair produced invalid JSON, fall through to error display
      }
    }
    // Show detailed error with line/column highlighting
    showJSONError(input, originalError, output);
  }
}

/**
 * Attempt to repair common JSON issues.
 * Returns { success: boolean, json: string, fixes: string[] }
 */
function tryRepairJSON(input) {
  let json = input;
  const fixes = [];

  // 1. Replace smart/curly quotes with straight quotes
  if (/[\u201C\u201D\u201E\u201F\u2033\u2036]/.test(json)) {
    json = json.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
    fixes.push('Replaced smart quotes (\u201C\u201D) with straight quotes');
  }
  if (/[\u2018\u2019\u201A\u201B\u2032\u2035]/.test(json)) {
    json = json.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
    fixes.push("Replaced smart single quotes (\u2018\u2019) with straight quotes");
  }

  // 2. Replace single-quoted strings with double-quoted strings
  // Only if not already valid and contains single-quoted strings
  try { JSON.parse(json); return { success: true, json, fixes }; } catch(e) {}
  
  if (/:\s*'[^']*'/.test(json) || /\[\s*'/.test(json) || /,\s*'/.test(json)) {
    json = replaceSingleQuotes(json);
    fixes.push('Replaced single quotes with double quotes');
  }

  // 3. Remove trailing commas before } or ]
  const trailingCommaPattern = /,\s*([\]}])/g;
  if (trailingCommaPattern.test(json)) {
    json = json.replace(/,\s*([\]}])/g, '$1');
    fixes.push('Removed trailing commas');
  }

  // 4. Add quotes around unquoted keys: { key: "value" } -> { "key": "value" }
  try { JSON.parse(json); return { success: true, json, fixes }; } catch(e) {}
  
  const unquotedKeyPattern = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
  if (unquotedKeyPattern.test(json)) {
    json = json.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
    fixes.push('Added quotes around unquoted keys');
  }

  // 5. Fix JavaScript-style comments (// and /* */)
  if (/\/\/.*$/m.test(json) || /\/\*[\s\S]*?\*\//.test(json)) {
    json = json.replace(/\/\/.*$/gm, '');
    json = json.replace(/\/\*[\s\S]*?\*\//g, '');
    fixes.push('Removed comments');
  }

  // 6. Replace undefined/NaN with null
  if (/:\s*undefined\b/.test(json) || /:\s*NaN\b/.test(json)) {
    json = json.replace(/:\s*undefined\b/g, ': null');
    json = json.replace(/:\s*NaN\b/g, ': null');
    fixes.push('Replaced undefined/NaN with null');
  }

  // 7. Fix unescaped backslashes in strings (common with file paths)
  try { JSON.parse(json); return { success: true, json, fixes }; } catch(e) {}
  json = fixUnescapedBackslashes(json);
  if (fixes.length === 0 || json !== input) {
    // Only add if something changed
    const beforeFix = json;
    try { JSON.parse(json); fixes.push('Fixed unescaped backslashes'); return { success: true, json, fixes }; } catch(e) { json = beforeFix; }
  }

  // 8. Fix unescaped control characters in strings
  try { JSON.parse(json); return { success: true, json, fixes }; } catch(e) {}
  json = json.replace(/[\x00-\x1F\x7F]/g, (ch) => {
    if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
    return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
  });

  // 9. Try wrapping bare value in array or object
  try { JSON.parse(json); return { success: true, json, fixes }; } catch(e) {}

  // 10. Handle JSONL (multiple JSON objects, one per line)
  const lines = json.trim().split('\n').filter(l => l.trim());
  if (lines.length > 1) {
    const allObjects = lines.every(l => {
      try { JSON.parse(l.trim()); return true; } catch(e) { return false; }
    });
    if (allObjects) {
      json = '[' + lines.map(l => l.trim()).join(',') + ']';
      fixes.push('Wrapped JSONL (newline-delimited JSON) into array');
      try { JSON.parse(json); return { success: true, json, fixes }; } catch(e) {}
    }
  }

  // Final check
  try {
    JSON.parse(json);
    return { success: true, json, fixes };
  } catch (e) {
    return { success: false, json: input, fixes: [] };
  }
}

/**
 * Replace single-quoted strings with double-quoted strings.
 * Handles escaped single quotes inside strings.
 */
function replaceSingleQuotes(json) {
  let result = '';
  let inDouble = false;
  let inSingle = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    const prev = i > 0 ? json[i - 1] : '';
    if (ch === '"' && !inSingle && prev !== '\\') {
      inDouble = !inDouble;
      result += ch;
    } else if (ch === "'" && !inDouble && prev !== '\\') {
      if (!inSingle) {
        inSingle = true;
        result += '"';
      } else {
        inSingle = false;
        result += '"';
      }
    } else if (ch === '"' && inSingle) {
      result += '\\"';
    } else {
      result += ch;
    }
  }
  return result;
}

/**
 * Fix unescaped backslashes in JSON strings (e.g., Windows paths).
 */
function fixUnescapedBackslashes(json) {
  let result = '';
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (ch === '"' && (i === 0 || json[i - 1] !== '\\')) {
      inString = !inString;
      result += ch;
    } else if (inString && ch === '\\') {
      const next = json[i + 1];
      // Valid JSON escapes: " \ / b f n r t u
      if (next && '"\\/bfnrtu'.includes(next)) {
        result += ch;
      } else {
        result += '\\\\'; // Escape the backslash
      }
    } else {
      result += ch;
    }
  }
  return result;
}

/**
 * Show a detailed JSON error with line/column highlighting
 */
function showJSONError(input, error, output) {
  const msg = error.message;
  // Try to extract position from error message
  // Chrome: "... at position 123"
  // Firefox: "... at line 5 column 10"
  let errorLine = -1;
  let errorCol = -1;
  let errorPos = -1;

  const posMatch = msg.match(/position\s+(\d+)/i);
  const lineColMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);

  if (lineColMatch) {
    errorLine = parseInt(lineColMatch[1]) - 1;
    errorCol = parseInt(lineColMatch[2]) - 1;
  } else if (posMatch) {
    errorPos = parseInt(posMatch[1]);
    // Convert position to line/col
    let pos = 0;
    const lines = input.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pos + lines[i].length >= errorPos) {
        errorLine = i;
        errorCol = errorPos - pos;
        break;
      }
      pos += lines[i].length + 1; // +1 for newline
    }
  }

  const lines = input.split('\n');
  let html = '<div class="json-error-container">';
  html += `<div class="json-error-header"><i class="fas fa-exclamation-triangle"></i> <strong>JSON Parse Error</strong></div>`;
  html += `<div class="json-error-message">${escapeHtml(msg)}</div>`;
  
  if (errorLine >= 0) {
    html += '<div class="json-error-code">';
    // Show a few lines around the error
    const startLine = Math.max(0, errorLine - 2);
    const endLine = Math.min(lines.length - 1, errorLine + 2);
    for (let i = startLine; i <= endLine; i++) {
      const lineNum = (i + 1).toString().padStart(3, ' ');
      const lineContent = escapeHtml(lines[i]);
      if (i === errorLine) {
        html += `<div class="json-error-line json-error-line-active">`;
        html += `<span class="json-error-linenum">${lineNum}</span> ${lineContent}`;
        if (errorCol >= 0 && errorCol <= lines[i].length) {
          html += `\n<span class="json-error-linenum">   </span> ${' '.repeat(errorCol)}<span class="json-error-pointer">^--- error here</span>`;
        }
        html += `</div>`;
      } else {
        html += `<div class="json-error-line"><span class="json-error-linenum">${lineNum}</span> ${lineContent}</div>`;
      }
    }
    html += '</div>';
  }

  html += '<div class="json-error-tips"><strong>Common fixes:</strong><ul>';
  html += '<li>Check for missing or extra commas</li>';
  html += '<li>Ensure all keys are double-quoted: <code>"key"</code> not <code>key</code> or <code>\'key\'</code></li>';
  html += '<li>Use double quotes <code>"</code> not smart quotes <code>\u201C\u201D</code></li>';
  html += '<li>Remove trailing commas before <code>}</code> or <code>]</code></li>';
  html += '<li>Escape backslashes in strings: <code>\\\\</code></li>';
  html += '</ul></div>';
  html += '</div>';
  output.innerHTML = html;
}

function openFullJSONModal() {
  const input = document.getElementById('json-input').value;
  const modal = document.getElementById('jsonModal');
  const content = document.getElementById('json-modal-content');
  try {
    const { obj } = safeParseJSON(input);
    content.textContent = JSON.stringify(obj, null, 2);
  } catch (e) {
    content.textContent = 'Invalid JSON: ' + e.message;
  }
  modal.style.display = 'block';
}

function closeFullJSONModal() {
  document.getElementById('jsonModal').style.display = 'none';
}

window.addEventListener('keydown', (e) => {
  if (e.key === "Escape") closeFullJSONModal();
});
window.addEventListener('click', (e) => {
  if (e.target.id === 'jsonModal') closeFullJSONModal();
});


function jsonToTree(obj, isRoot = true, path = []) {
  if (typeof obj !== 'object' || obj === null) {
    let type = typeof obj;
    let cls = type === 'string' ? 'string' : 'number';
    return `<span class="${cls}">${JSON.stringify(obj)}</span>`;
  }
  let html = '<ul class="json-tree">';
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    let newPath = path.concat([key]);
    let pathAttr = `data-json-path='${newPath.map(k => k.replace(/'/g, "\\'")).join('.')}'`;
    let copyBtn = `<button class="json-copy-btn" title="Copy this node" style="margin-left:6px;font-size:12px;vertical-align:middle;">📋</button>`;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (isRoot) {
        html += `<li class="collapse expanded" ${pathAttr}><span class="json-arrow">&#9654;</span><span class="key">"${key}"</span>: ${copyBtn}${jsonToTree(obj[key], false, newPath)}</li>`;
      } else {
        html += `<li class="collapse collapsed" ${pathAttr}><span class="json-arrow">&#9654;</span><span class="key">"${key}"</span>: ${copyBtn}${jsonToTree(obj[key], false, newPath)}</li>`;
      }
    } else {
      let type = typeof obj[key];
      let cls = type === 'string' ? 'string' : 'number';
      html += `<li ${pathAttr}><span style="display:inline-block;width:1.2em;"></span><span class="key">"${key}"</span>: ${copyBtn}<span class="${cls}">${JSON.stringify(obj[key])}</span></li>`;
    }
  }
  html += '</ul>';
  return html;
}

// Add copy-to-clipboard listeners to JSON nodes
function addJSONCopyListeners() {
  document.querySelectorAll('.json-copy-btn').forEach(btn => {
    btn.onclick = function(e) {
      e.stopPropagation();
      // Find the closest LI and get its data-json-path
      const li = btn.closest('li');
      if (!li) return;
      const pathStr = li.getAttribute('data-json-path');
      if (!pathStr) return;
      const path = pathStr.split('.');
      // Get the JSON from the input
      let jsonInput = document.getElementById('json-input');
      if (!jsonInput) return;
      let obj;
      try {
        obj = JSON.parse(jsonInput.value);
      } catch (e) { return; }
      // Traverse the path to get the subtree
      let subtree = obj;
      for (let k of path) {
        if (subtree && Object.prototype.hasOwnProperty.call(subtree, k)) {
          subtree = subtree[k];
        } else {
          subtree = undefined;
          break;
        }
      }
      if (subtree !== undefined) {
        navigator.clipboard.writeText(JSON.stringify(subtree, null, 2));
        btn.textContent = '✅';
        setTimeout(() => { btn.textContent = '📋'; }, 1000);
      }
    };
  });
}

function makeCollapsibleJSON(container) {
  // Method 1: Direct event listeners on arrows AND entire collapsible nodes
  const arrows = container.querySelectorAll('.json-arrow');
  
  arrows.forEach((arrow, idx) => {
    arrow.style.cursor = 'pointer';
    arrow.onclick = function(e) {
      e.stopPropagation();
      const li = arrow.closest('.collapse');
      if (li) {
        toggleNode(li, arrow);
      }
    };
  });

  // Add click handlers to entire collapsible nodes
  const collapsibleNodes = container.querySelectorAll('.collapse');
  
  collapsibleNodes.forEach((node, idx) => {
    node.style.cursor = 'pointer';
    node.onclick = function(e) {
      // Don't trigger if clicking on copy button
      if (e.target.classList.contains('json-copy-btn')) {
        return;
      }
      e.stopPropagation();
      const arrow = node.querySelector('.json-arrow');
      if (arrow) {
        toggleNode(node, arrow);
      }
    };
  });

  // Helper function to toggle node state
  function toggleNode(li, arrow) {
    if (li.classList.contains('collapsed')) {
      li.classList.remove('collapsed');
      li.classList.add('expanded');
      arrow.style.transform = 'rotate(90deg)';
    } else {
      li.classList.add('collapsed');
      li.classList.remove('expanded');
      arrow.style.transform = 'rotate(0deg)';
    }
  }

  // Method 2: Direct event listeners on copy buttons  
  const copyBtns = container.querySelectorAll('.json-copy-btn');
  
  copyBtns.forEach((btn) => {
    btn.onclick = function(e) {
      e.stopPropagation();
      const li = btn.closest('li');
      const pathStr = li.getAttribute('data-json-path');
      if (!pathStr) return;
      
      const path = pathStr.split('.');
      let jsonInput = document.getElementById('json-input');
      if (!jsonInput) return;
      
      try {
        const obj = JSON.parse(jsonInput.value);
        let subtree = obj;
        for (let k of path) {
          if (subtree && Object.prototype.hasOwnProperty.call(subtree, k)) {
            subtree = subtree[k];
          } else {
            subtree = undefined;
            break;
          }
        }
        if (subtree !== undefined) {
          navigator.clipboard.writeText(JSON.stringify(subtree, null, 2));
          btn.textContent = '✅';
          setTimeout(() => { btn.textContent = '📋'; }, 1000);
        }
      } catch (e) {
        // Silent error handling
      }
    };
  });

  // Method 3: Event delegation as backup
  container.onclick = function(e) {
    // Handle arrow clicks
    if (e.target.classList.contains('json-arrow')) {
      const arrow = e.target;
      const li = arrow.closest('.collapse');
      if (li) {
        e.stopPropagation();
        toggleNodeDelegation(li, arrow);
      }
    }
    
    // Handle clicks on collapsible nodes (but not copy buttons)
    else if (e.target.closest('.collapse') && !e.target.classList.contains('json-copy-btn')) {
      const li = e.target.closest('.collapse');
      const arrow = li.querySelector('.json-arrow');
      if (arrow && li) {
        e.stopPropagation();
        toggleNodeDelegation(li, arrow);
      }
    }
    
    // Handle copy button clicks
    else if (e.target.classList.contains('json-copy-btn')) {
      const btn = e.target;
      e.stopPropagation();
      btn.textContent = '✅';
      setTimeout(() => btn.textContent = '📋', 1000);
    }
  };

  // Helper function for delegation toggle
  function toggleNodeDelegation(li, arrow) {
    if (li.classList.contains('collapsed')) {
      li.classList.remove('collapsed');
      li.classList.add('expanded');
      arrow.style.transform = 'rotate(90deg)';
    } else {
      li.classList.add('collapsed');
      li.classList.remove('expanded');
      arrow.style.transform = 'rotate(0deg)';
    }
  }

  const tree = container.querySelector('.json-tree');
  if (tree) {
    tree._delegationAttached = true;
  }
}
// Attach to window for global access
window.jsonToTree = jsonToTree;
window.makeCollapsibleJSON = makeCollapsibleJSON;
window.expandAllJSON = expandAllJSON;
window.collapseAllJSON = collapseAllJSON;
window.beautifyJSON = beautifyJSON;
window.openFullJSONModal = openFullJSONModal;
window.closeFullJSONModal = closeFullJSONModal;
window.generateJavaScriptClasses = generateJavaScriptClasses;

