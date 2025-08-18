// SQL Formatter Tool
// Comprehensive SQL formatting, validation, and optimization

class SQLFormatter {
  constructor() {
    this.keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL',
      'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'INSERT', 'INTO',
      'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP',
      'INDEX', 'VIEW', 'TRIGGER', 'FUNCTION', 'PROCEDURE', 'DATABASE', 'SCHEMA',
      'UNION', 'INTERSECT', 'EXCEPT', 'AS', 'DISTINCT', 'ALL', 'EXISTS', 'IN',
      'LIKE', 'BETWEEN', 'IS', 'NULL', 'NOT', 'AND', 'OR', 'CASE', 'WHEN', 'THEN',
      'ELSE', 'END', 'IF', 'ELSEIF', 'WHILE', 'FOR', 'DECLARE', 'BEGIN', 'COMMIT',
      'ROLLBACK', 'TRANSACTION', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CHECK',
      'UNIQUE', 'DEFAULT', 'AUTO_INCREMENT', 'IDENTITY'
    ];
    
    this.functions = [
      'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'UPPER', 'LOWER', 'LENGTH', 'SUBSTRING',
      'TRIM', 'LTRIM', 'RTRIM', 'REPLACE', 'CONCAT', 'COALESCE', 'ISNULL', 'NULLIF',
      'CAST', 'CONVERT', 'DATEPART', 'DATEDIFF', 'GETDATE', 'NOW', 'CURRENT_TIMESTAMP'
    ];
    
    this.dialectRules = {
      mysql: {
        quoteChar: '`',
        limitSyntax: 'LIMIT',
        autoIncrement: 'AUTO_INCREMENT'
      },
      postgresql: {
        quoteChar: '"',
        limitSyntax: 'LIMIT',
        autoIncrement: 'SERIAL'
      },
      sqlite: {
        quoteChar: '[',
        limitSyntax: 'LIMIT',
        autoIncrement: 'AUTOINCREMENT'
      },
      oracle: {
        quoteChar: '"',
        limitSyntax: 'ROWNUM',
        autoIncrement: 'SEQUENCE'
      },
      sqlserver: {
        quoteChar: '[',
        limitSyntax: 'TOP',
        autoIncrement: 'IDENTITY'
      }
    };
  }

  // Format SQL query
  format(sql, options = {}) {
    const {
      dialect = 'generic',
      indentSize = 2,
      maxLineLength = 80,
      keywordCase = 'upper',
      commaPosition = 'before'
    } = options;

    try {
      let formatted = this.cleanSQL(sql);
      formatted = this.formatKeywords(formatted, keywordCase);
      formatted = this.formatStructure(formatted, indentSize, commaPosition);
      formatted = this.formatDialectSpecific(formatted, dialect);
      
      return {
        success: true,
        formatted: formatted,
        originalLength: sql.length,
        formattedLength: formatted.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        formatted: sql
      };
    }
  }

  // Clean and normalize SQL
  cleanSQL(sql) {
    // Remove extra whitespace
    let cleaned = sql.replace(/\s+/g, ' ').trim();
    
    // Add spaces around operators
    cleaned = cleaned.replace(/([=<>!]+)/g, ' $1 ');
    
    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned;
  }

  // Format keywords
  formatKeywords(sql, keywordCase) {
    let formatted = sql;
    
    // Format SQL keywords
    this.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const replacement = keywordCase === 'upper' ? keyword.toUpperCase() : keyword.toLowerCase();
      formatted = formatted.replace(regex, replacement);
    });

    // Format functions
    this.functions.forEach(func => {
      const regex = new RegExp(`\\b${func}\\b`, 'gi');
      const replacement = keywordCase === 'upper' ? func.toUpperCase() : func.toLowerCase();
      formatted = formatted.replace(regex, replacement);
    });

    return formatted;
  }

  // Format SQL structure with proper indentation
  formatStructure(sql, indentSize, commaPosition) {
    const indent = ' '.repeat(indentSize);
    let formatted = '';
    let indentLevel = 0;
    const tokens = this.tokenize(sql);
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const upperToken = token.toUpperCase();
      const nextToken = tokens[i + 1];
      
      // Handle major clauses
      if (['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 
           'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'].includes(upperToken)) {
        if (formatted.length > 0) formatted += '\n';
        formatted += token;
        
        if (upperToken === 'SELECT' && nextToken && nextToken.toUpperCase() !== 'DISTINCT') {
          formatted += '\n' + indent;
        }
        continue;
      }

      // Handle JOINs
      if (['JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL'].includes(upperToken)) {
        formatted += '\n' + token;
        continue;
      }

      // Handle comma positioning
      if (token === ',') {
        if (commaPosition === 'before') {
          formatted += '\n' + indent + token + ' ';
        } else {
          formatted += token + '\n' + indent;
        }
        continue;
      }

      // Handle parentheses
      if (token === '(') {
        formatted += token;
        indentLevel++;
        if (nextToken && nextToken.toUpperCase() === 'SELECT') {
          formatted += '\n' + indent.repeat(indentLevel);
        }
        continue;
      }

      if (token === ')') {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted += token;
        continue;
      }

      // Handle AND/OR
      if (['AND', 'OR'].includes(upperToken)) {
        formatted += '\n' + indent + token + ' ';
        continue;
      }

      // Default: add token with space
      formatted += (formatted.endsWith(' ') ? '' : ' ') + token;
    }

    return formatted.trim();
  }

  // Apply dialect-specific formatting
  formatDialectSpecific(sql, dialect) {
    if (dialect === 'generic') return sql;
    
    const rules = this.dialectRules[dialect];
    if (!rules) return sql;

    // Apply dialect-specific quote characters and syntax
    // This is a simplified implementation
    return sql;
  }

  // Tokenize SQL string
  tokenize(sql) {
    const tokens = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      
      if (inString) {
        current += char;
        if (char === stringChar) {
          inString = false;
          tokens.push(current);
          current = '';
        }
        continue;
      }

      if (char === '"' || char === "'") {
        if (current) {
          tokens.push(current);
          current = '';
        }
        inString = true;
        stringChar = char;
        current = char;
        continue;
      }

      if (/\s/.test(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      if ('(),;'.includes(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
        continue;
      }

      current += char;
    }

    if (current) {
      tokens.push(current);
    }

    return tokens.filter(token => token.trim());
  }

  // Validate SQL syntax
  validate(sql) {
    const issues = [];
    const upperSQL = sql.toUpperCase();
    
    // Check for balanced parentheses
    let parenBalance = 0;
    for (const char of sql) {
      if (char === '(') parenBalance++;
      if (char === ')') parenBalance--;
      if (parenBalance < 0) {
        issues.push({
          type: 'syntax',
          message: 'Unmatched closing parenthesis',
          severity: 'error'
        });
        break;
      }
    }
    
    if (parenBalance > 0) {
      issues.push({
        type: 'syntax',
        message: 'Unmatched opening parenthesis',
        severity: 'error'
      });
    }

    // Check for basic SQL structure
    if (!upperSQL.includes('SELECT') && !upperSQL.includes('INSERT') && 
        !upperSQL.includes('UPDATE') && !upperSQL.includes('DELETE') &&
        !upperSQL.includes('CREATE') && !upperSQL.includes('ALTER') &&
        !upperSQL.includes('DROP')) {
      issues.push({
        type: 'structure',
        message: 'No recognized SQL statement found',
        severity: 'warning'
      });
    }

    // Check for SELECT without FROM (unless it's a simple expression)
    if (upperSQL.includes('SELECT') && !upperSQL.includes('FROM') && 
        upperSQL.includes('*')) {
      issues.push({
        type: 'structure',
        message: 'SELECT * without FROM clause',
        severity: 'warning'
      });
    }

    // Check for common syntax errors
    const syntaxPatterns = [
      { pattern: /SELECT\s*,/, message: 'Empty SELECT list' },
      { pattern: /,\s*FROM/i, message: 'Comma before FROM clause' },
      { pattern: /WHERE\s*AND/i, message: 'WHERE clause starts with AND' },
      { pattern: /WHERE\s*OR/i, message: 'WHERE clause starts with OR' }
    ];

    syntaxPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(sql)) {
        issues.push({
          type: 'syntax',
          message: message,
          severity: 'error'
        });
      }
    });

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues: issues,
      summary: {
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length
      }
    };
  }

  // Minify SQL
  minify(sql) {
    try {
      let minified = sql
        .replace(/--[^\n]*/g, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\s*([(),;])\s*/g, '$1') // Remove spaces around punctuation
        .trim();

      return {
        success: true,
        minified: minified,
        originalLength: sql.length,
        minifiedLength: minified.length,
        compressionRatio: Math.round((1 - minified.length / sql.length) * 100)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        minified: sql
      };
    }
  }

  // Get SQL analysis
  analyze(sql) {
    const analysis = {
      length: sql.length,
      lines: sql.split('\n').length,
      keywords: [],
      tables: [],
      columns: [],
      complexity: 'Low'
    };

    // Extract keywords
    this.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = sql.match(regex);
      if (matches) {
        analysis.keywords.push({
          keyword: keyword,
          count: matches.length
        });
      }
    });

    // Simple complexity assessment
    const complexityFactors = [
      { pattern: /JOIN/gi, weight: 1 },
      { pattern: /UNION/gi, weight: 2 },
      { pattern: /CASE/gi, weight: 1 },
      { pattern: /EXISTS/gi, weight: 2 },
      { pattern: /\(/g, weight: 0.5 }
    ];

    let complexityScore = 0;
    complexityFactors.forEach(({ pattern, weight }) => {
      const matches = sql.match(pattern);
      if (matches) {
        complexityScore += matches.length * weight;
      }
    });

    if (complexityScore > 10) analysis.complexity = 'High';
    else if (complexityScore > 5) analysis.complexity = 'Medium';

    return analysis;
  }
}

// Global SQL formatter instance
const sqlFormatter = new SQLFormatter();

// Format SQL
function formatSQL() {
  const sqlInput = document.getElementById('sql-input').value.trim();
  if (!sqlInput) {
    showNotification('Please enter SQL query', 'warning');
    return;
  }

  const dialect = document.getElementById('sql-dialect').value;
  
  const result = sqlFormatter.format(sqlInput, {
    dialect: dialect,
    keywordCase: 'upper',
    indentSize: 2,
    commaPosition: 'after'
  });

  if (result.success) {
    document.getElementById('sql-output').innerHTML = `
      <div class="sql-format-result">
        <h4>✨ Formatted SQL</h4>
        <div class="format-stats">
          <span>Original: ${result.originalLength} chars</span>
          <span>Formatted: ${result.formattedLength} chars</span>
          <span>Dialect: ${dialect}</span>
        </div>
        <div class="sql-result">
          <pre><code class="sql">${result.formatted}</code></pre>
        </div>
        <div class="result-actions">
          <button onclick="copyToClipboard(\`${result.formatted.replace(/`/g, '\\`')}\`)">
            <i class="fas fa-copy"></i> Copy SQL
          </button>
          <button onclick="downloadFile('formatted_${Date.now()}.sql', \`${result.formatted.replace(/`/g, '\\`')}\`)">
            <i class="fas fa-download"></i> Download
          </button>
        </div>
      </div>
    `;
    showNotification('SQL formatted successfully', 'success');
  } else {
    document.getElementById('sql-output').innerHTML = `
      <div class="error">
        <h4>❌ Formatting Error</h4>
        <p>${result.error}</p>
      </div>
    `;
    showNotification('SQL formatting failed', 'error');
  }
}

// Validate SQL
function validateSQL() {
  const sqlInput = document.getElementById('sql-input').value.trim();
  if (!sqlInput) {
    showNotification('Please enter SQL query', 'warning');
    return;
  }

  const validation = sqlFormatter.validate(sqlInput);
  const analysis = sqlFormatter.analyze(sqlInput);

  let html = `
    <div class="sql-validation">
      <h4>${validation.isValid ? '✅' : '❌'} SQL Validation</h4>
      
      <div class="validation-summary">
        <div class="summary-item">
          <strong>Status:</strong> ${validation.isValid ? 'Valid' : 'Issues Found'}
        </div>
        <div class="summary-item">
          <strong>Errors:</strong> ${validation.summary.errors}
        </div>
        <div class="summary-item">
          <strong>Warnings:</strong> ${validation.summary.warnings}
        </div>
        <div class="summary-item">
          <strong>Complexity:</strong> ${analysis.complexity}
        </div>
      </div>

      <div class="sql-analysis">
        <h5>📊 Query Analysis</h5>
        <div class="analysis-grid">
          <div class="analysis-item">
            <strong>Length:</strong> ${analysis.length} characters
          </div>
          <div class="analysis-item">
            <strong>Lines:</strong> ${analysis.lines}
          </div>
          <div class="analysis-item">
            <strong>Keywords:</strong> ${analysis.keywords.length}
          </div>
        </div>
      </div>
  `;

  if (validation.issues.length > 0) {
    html += `
      <div class="validation-issues">
        <h5>Issues Found:</h5>
        <ul>
          ${validation.issues.map(issue => `
            <li class="issue-${issue.severity}">
              <span class="issue-type">${issue.type.toUpperCase()}:</span>
              ${issue.message}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  if (analysis.keywords.length > 0) {
    html += `
      <div class="keyword-analysis">
        <h5>Keyword Usage:</h5>
        <div class="keyword-grid">
          ${analysis.keywords.slice(0, 10).map(kw => `
            <div class="keyword-item">
              <span class="keyword">${kw.keyword}</span>
              <span class="count">${kw.count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('sql-output').innerHTML = html;

  showNotification(validation.isValid ? 'SQL is valid' : `${validation.summary.errors} errors, ${validation.summary.warnings} warnings`, 
    validation.isValid ? 'success' : 'warning');
}

// Minify SQL
function minifySQL() {
  const sqlInput = document.getElementById('sql-input').value.trim();
  if (!sqlInput) {
    showNotification('Please enter SQL query', 'warning');
    return;
  }

  const result = sqlFormatter.minify(sqlInput);

  if (result.success) {
    document.getElementById('sql-output').innerHTML = `
      <div class="sql-minify-result">
        <h4>🗜️ Minified SQL</h4>
        <div class="minify-stats">
          <span>Original: ${result.originalLength} chars</span>
          <span>Minified: ${result.minifiedLength} chars</span>
          <span>Saved: ${result.compressionRatio}%</span>
        </div>
        <div class="sql-result">
          <pre><code class="sql">${result.minified}</code></pre>
        </div>
        <div class="result-actions">
          <button onclick="copyToClipboard(\`${result.minified.replace(/`/g, '\\`')}\`)">
            <i class="fas fa-copy"></i> Copy Minified SQL
          </button>
          <button onclick="downloadFile('minified_${Date.now()}.sql', \`${result.minified.replace(/`/g, '\\`')}\`)">
            <i class="fas fa-download"></i> Download
          </button>
        </div>
      </div>
    `;
    showNotification(`SQL minified successfully (${result.compressionRatio}% smaller)`, 'success');
  } else {
    document.getElementById('sql-output').innerHTML = `
      <div class="error">
        <h4>❌ Minification Error</h4>
        <p>${result.error}</p>
      </div>
    `;
    showNotification('SQL minification failed', 'error');
  }
}
