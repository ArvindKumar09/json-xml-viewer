// JSONPath Tester Tool
// Test JSONPath expressions against JSON data with real-time results

class JSONPathTester {
  constructor() {
    this.jsonData = null;
    this.compiledPath = null;
  }

  // Test JSONPath expression against JSON data
  test(jsonText, jsonPathExpression) {
    try {
      // Parse JSON data
      this.jsonData = JSON.parse(jsonText);
      
      // Validate and test JSONPath
      const results = this.evaluateJSONPath(this.jsonData, jsonPathExpression);
      
      return {
        success: true,
        results: results,
        count: Array.isArray(results) ? results.length : (results !== undefined ? 1 : 0),
        expression: jsonPathExpression,
        paths: this.getMatchedPaths(this.jsonData, jsonPathExpression)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        expression: jsonPathExpression
      };
    }
  }

  // Evaluate JSONPath expression (simplified implementation)
  evaluateJSONPath(data, expression) {
    // Remove leading $ if present
    let path = expression.startsWith('$') ? expression.slice(1) : expression;
    
    // Handle root reference
    if (path === '' || path === '.') {
      return data;
    }

    // Split path into segments
    const segments = this.parsePathSegments(path);
    let current = data;
    let results = [current];

    for (const segment of segments) {
      results = this.applySegment(results, segment);
    }

    // Return single value if only one result, otherwise return array
    return results.length === 1 ? results[0] : results;
  }

  // Parse JSONPath into segments
  parsePathSegments(path) {
    const segments = [];
    let current = '';
    let inBrackets = false;
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < path.length; i++) {
      const char = path[i];
      const nextChar = path[i + 1];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        current += char;
      } else if (!inQuotes && char === '[') {
        if (current) {
          segments.push({ type: 'property', value: current });
          current = '';
        }
        inBrackets = true;
      } else if (!inQuotes && char === ']') {
        if (current) {
          segments.push(this.parseSegment(current));
          current = '';
        }
        inBrackets = false;
      } else if (!inQuotes && !inBrackets && char === '.') {
        if (current) {
          segments.push({ type: 'property', value: current });
          current = '';
        }
        // Handle recursive descent (..)
        if (nextChar === '.') {
          segments.push({ type: 'recursive', value: '..' });
          i++; // skip next dot
        }
      } else {
        current += char;
      }
    }

    if (current) {
      segments.push(inBrackets ? this.parseSegment(current) : { type: 'property', value: current });
    }

    return segments;
  }

  // Parse individual segment
  parseSegment(segment) {
    segment = segment.trim();

    // Wildcard
    if (segment === '*') {
      return { type: 'wildcard', value: '*' };
    }

    // Array slice [start:end]
    if (segment.includes(':')) {
      const parts = segment.split(':');
      return {
        type: 'slice',
        start: parts[0] ? parseInt(parts[0]) : 0,
        end: parts[1] ? parseInt(parts[1]) : undefined
      };
    }

    // Array index or filter
    if (/^\d+$/.test(segment)) {
      return { type: 'index', value: parseInt(segment) };
    }

    // Filter expression [?(@.property == value)]
    if (segment.startsWith('?(')) {
      return { type: 'filter', value: segment };
    }

    // Multiple indices [1,3,5]
    if (segment.includes(',')) {
      const indices = segment.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      return { type: 'multi-index', value: indices };
    }

    // Property name (quoted or unquoted)
    if ((segment.startsWith('"') && segment.endsWith('"')) || 
        (segment.startsWith("'") && segment.endsWith("'"))) {
      return { type: 'property', value: segment.slice(1, -1) };
    }

    return { type: 'property', value: segment };
  }

  // Apply segment to current results
  applySegment(results, segment) {
    const newResults = [];

    for (const item of results) {
      switch (segment.type) {
        case 'property':
          if (typeof item === 'object' && item !== null && segment.value in item) {
            newResults.push(item[segment.value]);
          }
          break;

        case 'index':
          if (Array.isArray(item) && segment.value >= 0 && segment.value < item.length) {
            newResults.push(item[segment.value]);
          } else if (Array.isArray(item) && segment.value < 0) {
            const index = item.length + segment.value;
            if (index >= 0) {
              newResults.push(item[index]);
            }
          }
          break;

        case 'wildcard':
          if (Array.isArray(item)) {
            newResults.push(...item);
          } else if (typeof item === 'object' && item !== null) {
            newResults.push(...Object.values(item));
          }
          break;

        case 'slice':
          if (Array.isArray(item)) {
            const start = segment.start || 0;
            const end = segment.end !== undefined ? segment.end : item.length;
            newResults.push(...item.slice(start, end));
          }
          break;

        case 'multi-index':
          if (Array.isArray(item)) {
            for (const index of segment.value) {
              if (index >= 0 && index < item.length) {
                newResults.push(item[index]);
              }
            }
          }
          break;

        case 'recursive':
          newResults.push(...this.recursiveSearch(item));
          break;

        case 'filter':
          if (Array.isArray(item)) {
            newResults.push(...this.applyFilter(item, segment.value));
          }
          break;
      }
    }

    return newResults;
  }

  // Recursive search for .. operator
  recursiveSearch(obj, visited = new Set()) {
    const results = [];
    
    if (visited.has(obj)) return results; // Prevent circular references
    visited.add(obj);

    if (Array.isArray(obj)) {
      results.push(...obj);
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          results.push(...this.recursiveSearch(item, visited));
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        results.push(value);
        if (typeof value === 'object' && value !== null) {
          results.push(...this.recursiveSearch(value, visited));
        }
      }
    }

    return results;
  }

  // Apply filter expression (simplified)
  applyFilter(array, filterExpression) {
    // This is a simplified implementation
    // In a full implementation, you'd parse and evaluate complex filter expressions
    const results = [];
    
    // Basic filter parsing - this would need to be much more sophisticated
    const match = filterExpression.match(/\?\(@\.(\w+)\s*([><=!]+)\s*['"]?([^'"]*)['"]?\)/);
    if (match) {
      const [, property, operator, value] = match;
      
      for (const item of array) {
        if (typeof item === 'object' && item !== null && property in item) {
          const itemValue = item[property];
          const compareValue = isNaN(value) ? value : Number(value);
          
          let matches = false;
          switch (operator) {
            case '==':
              matches = itemValue == compareValue;
              break;
            case '!=':
              matches = itemValue != compareValue;
              break;
            case '>':
              matches = Number(itemValue) > Number(compareValue);
              break;
            case '<':
              matches = Number(itemValue) < Number(compareValue);
              break;
            case '>=':
              matches = Number(itemValue) >= Number(compareValue);
              break;
            case '<=':
              matches = Number(itemValue) <= Number(compareValue);
              break;
          }
          
          if (matches) {
            results.push(item);
          }
        }
      }
    }
    
    return results;
  }

  // Get matched paths for visualization
  getMatchedPaths(data, expression) {
    const paths = [];
    
    try {
      this.findMatchingPaths(data, expression, '', paths);
    } catch (error) {
      console.error('Error finding paths:', error);
    }
    
    return paths;
  }

  // Find all paths that match the expression
  findMatchingPaths(obj, expression, currentPath, paths, visited = new Set()) {
    if (visited.has(obj)) return; // Prevent circular references
    if (typeof obj === 'object' && obj !== null) {
      visited.add(obj);
    }

    // This is a simplified path finder
    // A complete implementation would need to properly parse and evaluate the JSONPath
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
        paths.push({ path: newPath, value: item });
        if (typeof item === 'object' && item !== null) {
          this.findMatchingPaths(item, expression, newPath, paths, visited);
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        paths.push({ path: newPath, value: obj[key] });
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.findMatchingPaths(obj[key], expression, newPath, paths, visited);
        }
      });
    }
  }

  // Get expression suggestions based on JSON structure
  getSuggestions(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      const suggestions = [];
      
      // Analyze structure and generate common patterns
      this.analyzePaths(data, '', suggestions);
      
      return suggestions.slice(0, 10); // Return top 10 suggestions
    } catch (error) {
      return [];
    }
  }

  // Analyze JSON structure for suggestions
  analyzePaths(obj, currentPath, suggestions, visited = new Set()) {
    if (visited.has(obj)) return;
    if (typeof obj === 'object' && obj !== null) {
      visited.add(obj);
    }

    const basePath = currentPath ? `$${currentPath}` : '$';

    if (Array.isArray(obj)) {
      suggestions.push(`${basePath}[*]`); // All array elements
      suggestions.push(`${basePath}[0]`); // First element
      if (obj.length > 1) {
        suggestions.push(`${basePath}[0:2]`); // First two elements
        suggestions.push(`${basePath}[-1]`); // Last element
      }
      
      // Analyze array elements
      if (obj.length > 0 && typeof obj[0] === 'object') {
        Object.keys(obj[0]).forEach(key => {
          suggestions.push(`${basePath}[*].${key}`);
        });
      }
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : `.${key}`;
        suggestions.push(`$${newPath}`);
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.analyzePaths(obj[key], newPath, suggestions, visited);
        }
      });
    }
  }

  // Format result for display
  formatResult(result) {
    if (result === null) return 'null';
    if (result === undefined) return 'undefined';
    if (typeof result === 'string') return `"${result}"`;
    if (typeof result === 'object') return JSON.stringify(result, null, 2);
    return String(result);
  }

  // Validate JSONPath expression syntax
  validateExpression(expression) {
    const errors = [];
    
    if (!expression.trim()) {
      errors.push('JSONPath expression cannot be empty');
      return { isValid: false, errors };
    }

    if (!expression.startsWith('$') && !expression.startsWith('.')) {
      errors.push('JSONPath expression should start with $ or .');
    }

    // Check for balanced brackets
    let bracketCount = 0;
    for (const char of expression) {
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
      if (bracketCount < 0) {
        errors.push('Unmatched closing bracket ]');
        break;
      }
    }
    
    if (bracketCount > 0) {
      errors.push('Unmatched opening bracket [');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

// Global JSONPath tester instance
const jsonPathTester = new JSONPathTester();

// Test JSONPath expression
function testJSONPath() {
  const jsonText = document.getElementById('jsonpath-json').value.trim();
  const expression = document.getElementById('jsonpath-expression').value.trim();

  if (!jsonText) {
    showNotification('Please enter JSON data', 'warning');
    return;
  }

  if (!expression) {
    showNotification('Please enter JSONPath expression', 'warning');
    return;
  }

  // Validate expression
  const validation = jsonPathTester.validateExpression(expression);
  if (!validation.isValid) {
    document.getElementById('jsonpath-output').innerHTML = `
      <div class="error">
        <h4>❌ Invalid JSONPath Expression</h4>
        <ul>
          ${validation.errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
      </div>
    `;
    showNotification('Invalid JSONPath expression', 'error');
    return;
  }

  const result = jsonPathTester.test(jsonText, expression);

  if (result.success) {
    displayJSONPathResults(result);
    showNotification(`JSONPath executed: ${result.count} matches found`, 'success');
  } else {
    document.getElementById('jsonpath-output').innerHTML = `
      <div class="error">
        <h4>❌ JSONPath Error</h4>
        <p><strong>Expression:</strong> <code>${result.expression}</code></p>
        <p><strong>Error:</strong> ${result.error}</p>
      </div>
    `;
    showNotification('JSONPath execution failed', 'error');
  }
}

// Display JSONPath test results
function displayJSONPathResults(result) {
  const { results, count, expression, paths } = result;
  
  let html = `
    <div class="jsonpath-results">
      <div class="results-header">
        <h4>🎯 JSONPath Results</h4>
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">Expression:</span>
            <code class="stat-value">${expression}</code>
          </div>
          <div class="stat-item">
            <span class="stat-label">Matches:</span>
            <span class="stat-value">${count}</span>
          </div>
        </div>
      </div>
  `;

  if (count > 0) {
    html += `
      <div class="results-content">
        <h5>📋 Matched Values</h5>
        <div class="results-list">
    `;

    if (Array.isArray(results)) {
      results.forEach((item, index) => {
        const formattedResult = jsonPathTester.formatResult(item);
        const resultType = Array.isArray(item) ? 'array' : typeof item;
        
        html += `
          <div class="result-item">
            <div class="result-header">
              <span class="result-index">#${index + 1}</span>
              <span class="result-type">${resultType}</span>
            </div>
            <div class="result-content">
              <pre><code class="json">${formattedResult}</code></pre>
            </div>
            <div class="result-actions">
              <button onclick="copyToClipboard(\`${formattedResult.replace(/`/g, '\\`')}\`)">
                <i class="fas fa-copy"></i> Copy
              </button>
            </div>
          </div>
        `;
      });
    } else {
      const formattedResult = jsonPathTester.formatResult(results);
      const resultType = Array.isArray(results) ? 'array' : typeof results;
      
      html += `
        <div class="result-item single">
          <div class="result-header">
            <span class="result-type">${resultType}</span>
          </div>
          <div class="result-content">
            <pre><code class="json">${formattedResult}</code></pre>
          </div>
          <div class="result-actions">
            <button onclick="copyToClipboard(\`${formattedResult.replace(/`/g, '\\`')}\`)">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
        </div>
      `;
    }

    html += '</div>';

    // Add path visualization if available
    if (paths && paths.length > 0 && paths.length <= 20) {
      html += `
        <div class="path-visualization">
          <h5>🗂️ Matched Paths</h5>
          <div class="paths-list">
            ${paths.slice(0, 10).map(pathItem => `
              <div class="path-item">
                <span class="path">$.${pathItem.path}</span>
                <span class="path-value">${jsonPathTester.formatResult(pathItem.value).substring(0, 50)}${jsonPathTester.formatResult(pathItem.value).length > 50 ? '...' : ''}</span>
              </div>
            `).join('')}
          </div>
          ${paths.length > 10 ? `<p class="truncated-notice">... and ${paths.length - 10} more paths</p>` : ''}
        </div>
      `;
    }

    html += '</div>';
  } else {
    html += `
      <div class="no-results">
        <i class="fas fa-search" style="font-size: 48px; color: #ccc;"></i>
        <h5>No matches found</h5>
        <p>The JSONPath expression didn't match any elements in the JSON data.</p>
        <div class="suggestions">
          <h6>Try these suggestions:</h6>
          <ul>
            <li>Check if your JSON structure matches the path</li>
            <li>Use <code>$.*</code> to get all top-level properties</li>
            <li>Use <code>$..*</code> to search recursively</li>
            <li>Use array indices like <code>$.items[0]</code></li>
          </ul>
        </div>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('jsonpath-output').innerHTML = html;
}

// Set JSONPath example
function setJSONPathExample(expression) {
  document.getElementById('jsonpath-expression').value = expression;
  
  // If there's JSON data, test immediately
  const jsonText = document.getElementById('jsonpath-json').value.trim();
  if (jsonText) {
    testJSONPath();
  }
}

// Clear JSONPath tester
function clearJSONPath() {
  document.getElementById('jsonpath-json').value = '';
  document.getElementById('jsonpath-expression').value = '';
  document.getElementById('jsonpath-output').innerHTML = `
    <div style="color: #888; text-align: center; margin-top: 100px;">
      <i class="fas fa-route" style="font-size: 48px; margin-bottom: 10px;"></i>
      <div>JSONPath results will appear here</div>
    </div>
  `;
  showNotification('JSONPath tester cleared', 'success');
}

// Auto-suggest JSONPath expressions based on JSON structure
function suggestJSONPaths() {
  const jsonText = document.getElementById('jsonpath-json').value.trim();
  if (!jsonText) return;

  const suggestions = jsonPathTester.getSuggestions(jsonText);
  
  if (suggestions.length > 0) {
    const suggestionHtml = suggestions.map(suggestion => 
      `<button onclick="setJSONPathExample('${suggestion}')">${suggestion}</button>`
    ).join('');
    
    document.getElementById('jsonpath-suggestions').innerHTML = suggestionHtml;
  }
}
