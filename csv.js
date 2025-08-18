// CSV Processor Tool
// Comprehensive CSV processing with validation, conversion, and analysis

class CSVProcessor {
  constructor() {
    this.data = [];
    this.headers = [];
    this.delimiter = ',';
    this.hasHeaders = true;
  }

  // Parse CSV data
  parseCSV(csvText, delimiter = ',', hasHeaders = true) {
    try {
      this.delimiter = delimiter;
      this.hasHeaders = hasHeaders;
      
      const lines = csvText.trim().split('\n');
      if (lines.length === 0) {
        throw new Error('CSV data is empty');
      }

      // Parse CSV with proper handling of quoted values
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      // Extract headers
      if (hasHeaders) {
        this.headers = parseCSVLine(lines[0]);
        this.data = lines.slice(1).map(parseCSVLine);
      } else {
        const firstRow = parseCSVLine(lines[0]);
        this.headers = firstRow.map((_, index) => `Column ${index + 1}`);
        this.data = lines.map(parseCSVLine);
      }

      return {
        success: true,
        rows: this.data.length,
        columns: this.headers.length,
        headers: this.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Convert to JSON
  toJSON() {
    return this.data.map(row => {
      const obj = {};
      this.headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  }

  // Convert to XML
  toXML() {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
    
    this.data.forEach((row, index) => {
      xml += `  <row id="${index + 1}">\n`;
      this.headers.forEach((header, colIndex) => {
        const value = row[colIndex] || '';
        const cleanHeader = header.replace(/[^a-zA-Z0-9]/g, '_');
        xml += `    <${cleanHeader}>${this.escapeXML(value)}</${cleanHeader}>\n`;
      });
      xml += '  </row>\n';
    });
    
    xml += '</root>';
    return xml;
  }

  // Validate CSV data
  validate() {
    const issues = [];
    const expectedColumns = this.headers.length;

    this.data.forEach((row, index) => {
      if (row.length !== expectedColumns) {
        issues.push({
          row: index + 1,
          issue: `Expected ${expectedColumns} columns, found ${row.length}`,
          type: 'column_count'
        });
      }

      row.forEach((cell, colIndex) => {
        if (cell === undefined || cell === null) {
          issues.push({
            row: index + 1,
            column: this.headers[colIndex] || colIndex,
            issue: 'Empty cell',
            type: 'empty_cell'
          });
        }
      });
    });

    return {
      isValid: issues.length === 0,
      issues: issues,
      summary: {
        totalRows: this.data.length,
        totalColumns: this.headers.length,
        issueCount: issues.length
      }
    };
  }

  // Generate statistics
  getStatistics() {
    const stats = {
      totalRows: this.data.length,
      totalColumns: this.headers.length,
      delimiter: this.delimiter,
      hasHeaders: this.hasHeaders,
      columns: []
    };

    this.headers.forEach((header, colIndex) => {
      const columnData = this.data.map(row => row[colIndex]).filter(val => val);
      const uniqueValues = [...new Set(columnData)];
      
      const columnStats = {
        name: header,
        totalValues: columnData.length,
        uniqueValues: uniqueValues.length,
        emptyValues: this.data.length - columnData.length,
        sampleValues: uniqueValues.slice(0, 5)
      };

      // Try to detect data type
      const numericValues = columnData.filter(val => !isNaN(parseFloat(val)));
      if (numericValues.length > columnData.length * 0.8) {
        columnStats.type = 'numeric';
        columnStats.min = Math.min(...numericValues.map(parseFloat));
        columnStats.max = Math.max(...numericValues.map(parseFloat));
      } else {
        columnStats.type = 'text';
        columnStats.avgLength = columnData.reduce((sum, val) => sum + val.length, 0) / columnData.length;
      }

      stats.columns.push(columnStats);
    });

    return stats;
  }

  // Helper method to escape XML
  escapeXML(text) {
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Preview data with pagination
  getPreview(page = 1, pageSize = 10) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = this.data.slice(startIndex, endIndex);

    return {
      headers: this.headers,
      data: pageData,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalRows: this.data.length,
        totalPages: Math.ceil(this.data.length / pageSize),
        hasNextPage: endIndex < this.data.length,
        hasPrevPage: page > 1
      }
    };
  }
}

// Global CSV processor instance
const csvProcessor = new CSVProcessor();
let currentCSVPage = 1;

// Main CSV processing function
function processCSV() {
  const csvInput = document.getElementById('csv-input').value.trim();
  if (!csvInput) {
    showNotification('Please enter CSV data', 'warning');
    return;
  }

  const delimiter = document.getElementById('csv-delimiter').value;
  const hasHeaders = document.getElementById('csv-headers').checked;

  const result = csvProcessor.parseCSV(csvInput, delimiter, hasHeaders);
  
  if (result.success) {
    displayCSVPreview();
    showNotification(`CSV processed: ${result.rows} rows, ${result.columns} columns`, 'success');
  } else {
    document.getElementById('csv-output').innerHTML = `
      <div class="error">
        <h4>❌ CSV Processing Error</h4>
        <p>${result.error}</p>
      </div>
    `;
    showNotification('CSV processing failed', 'error');
  }
}

// Display CSV preview with statistics
function displayCSVPreview() {
  const preview = csvProcessor.getPreview(currentCSVPage, 10);
  const stats = csvProcessor.getStatistics();
  
  let html = `
    <div class="csv-stats">
      <h4>📊 CSV Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item"><strong>Rows:</strong> ${stats.totalRows}</div>
        <div class="stat-item"><strong>Columns:</strong> ${stats.totalColumns}</div>
        <div class="stat-item"><strong>Delimiter:</strong> ${stats.delimiter === '\t' ? 'Tab' : stats.delimiter}</div>
        <div class="stat-item"><strong>Headers:</strong> ${stats.hasHeaders ? 'Yes' : 'No'}</div>
      </div>
    </div>

    <div class="csv-preview">
      <h4>📋 Data Preview (Page ${preview.pagination.currentPage} of ${preview.pagination.totalPages})</h4>
      <div class="csv-table-container">
        <table class="csv-table">
          <thead>
            <tr>
              ${preview.headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${preview.data.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell || '<em>empty</em>'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="csv-pagination">
        <button onclick="changeCSVPage(${currentCSVPage - 1})" ${!preview.pagination.hasPrevPage ? 'disabled' : ''}>
          ← Previous
        </button>
        <span>Page ${preview.pagination.currentPage} of ${preview.pagination.totalPages}</span>
        <button onclick="changeCSVPage(${currentCSVPage + 1})" ${!preview.pagination.hasNextPage ? 'disabled' : ''}>
          Next →
        </button>
      </div>
    </div>

    <div class="csv-column-stats">
      <h4>📈 Column Analysis</h4>
      <div class="column-stats-grid">
        ${stats.columns.map(col => `
          <div class="column-stat">
            <h5>${col.name}</h5>
            <p><strong>Type:</strong> ${col.type}</p>
            <p><strong>Values:</strong> ${col.totalValues} (${col.uniqueValues} unique)</p>
            ${col.emptyValues > 0 ? `<p><strong>Empty:</strong> ${col.emptyValues}</p>` : ''}
            ${col.type === 'numeric' ? `
              <p><strong>Range:</strong> ${col.min} - ${col.max}</p>
            ` : `
              <p><strong>Avg Length:</strong> ${Math.round(col.avgLength)} chars</p>
            `}
            <p><strong>Sample:</strong> ${col.sampleValues.join(', ')}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('csv-output').innerHTML = html;
}

// Change CSV preview page
function changeCSVPage(page) {
  if (page < 1 || page > Math.ceil(csvProcessor.data.length / 10)) return;
  currentCSVPage = page;
  displayCSVPreview();
}

// Convert CSV to JSON
function convertCSVToJSON() {
  if (csvProcessor.data.length === 0) {
    showNotification('Please process CSV data first', 'warning');
    return;
  }

  const json = csvProcessor.toJSON();
  const jsonString = JSON.stringify(json, null, 2);
  
  document.getElementById('csv-output').innerHTML = `
    <div class="conversion-result">
      <h4>🔄 CSV → JSON Conversion</h4>
      <div class="json-result">
        <pre><code class="json">${jsonString}</code></pre>
      </div>
      <div class="result-actions">
        <button onclick="copyToClipboard(\`${jsonString.replace(/`/g, '\\`')}\`)">
          <i class="fas fa-copy"></i> Copy JSON
        </button>
        <button onclick="downloadFile('${Date.now()}_converted.json', \`${jsonString.replace(/`/g, '\\`')}\`)">
          <i class="fas fa-download"></i> Download JSON
        </button>
      </div>
    </div>
  `;

  showNotification('CSV converted to JSON successfully', 'success');
}

// Convert CSV to XML
function convertCSVToXML() {
  if (csvProcessor.data.length === 0) {
    showNotification('Please process CSV data first', 'warning');
    return;
  }

  const xml = csvProcessor.toXML();
  
  document.getElementById('csv-output').innerHTML = `
    <div class="conversion-result">
      <h4>🔄 CSV → XML Conversion</h4>
      <div class="xml-result">
        <pre><code class="xml">${xml}</code></pre>
      </div>
      <div class="result-actions">
        <button onclick="copyToClipboard(\`${xml.replace(/`/g, '\\`')}\`)">
          <i class="fas fa-copy"></i> Copy XML
        </button>
        <button onclick="downloadFile('${Date.now()}_converted.xml', \`${xml.replace(/`/g, '\\`')}\`)">
          <i class="fas fa-download"></i> Download XML
        </button>
      </div>
    </div>
  `;

  showNotification('CSV converted to XML successfully', 'success');
}

// Validate CSV
function validateCSV() {
  if (csvProcessor.data.length === 0) {
    showNotification('Please process CSV data first', 'warning');
    return;
  }

  const validation = csvProcessor.validate();
  
  let html = `
    <div class="validation-result">
      <h4>${validation.isValid ? '✅' : '❌'} CSV Validation</h4>
      <div class="validation-summary">
        <p><strong>Status:</strong> ${validation.isValid ? 'Valid' : 'Issues Found'}</p>
        <p><strong>Total Rows:</strong> ${validation.summary.totalRows}</p>
        <p><strong>Total Columns:</strong> ${validation.summary.totalColumns}</p>
        <p><strong>Issues:</strong> ${validation.summary.issueCount}</p>
      </div>
  `;

  if (!validation.isValid) {
    html += `
      <div class="validation-issues">
        <h5>Issues Found:</h5>
        <ul>
          ${validation.issues.map(issue => `
            <li class="issue-${issue.type}">
              <strong>Row ${issue.row}:</strong> ${issue.issue}
              ${issue.column ? ` (Column: ${issue.column})` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  html += '</div>';
  document.getElementById('csv-output').innerHTML = html;

  showNotification(validation.isValid ? 'CSV is valid' : `${validation.summary.issueCount} issues found`, 
    validation.isValid ? 'success' : 'warning');
}

// Helper function to download files
function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
