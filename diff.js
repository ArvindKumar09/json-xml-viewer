// Diff/Comparison Tool
// Advanced text and code comparison with highlighting

class DiffTool {
  constructor() {
    this.options = {
      ignoreCase: false,
      ignoreWhitespace: false,
      contextLines: 3
    };
  }

  // Compare two texts and generate diff
  compare(text1, text2, options = {}) {
    this.options = { ...this.options, ...options };
    
    const lines1 = this.preprocessText(text1);
    const lines2 = this.preprocessText(text2);
    
    const diff = this.calculateDiff(lines1, lines2);
    const stats = this.calculateStats(diff);
    
    return {
      diff: diff,
      stats: stats,
      success: true
    };
  }

  // Preprocess text based on options
  preprocessText(text) {
    let processedText = text;
    
    if (this.options.ignoreCase) {
      processedText = processedText.toLowerCase();
    }
    
    if (this.options.ignoreWhitespace) {
      processedText = processedText.replace(/\s+/g, ' ');
    }
    
    return processedText.split('\n');
  }

  // Calculate diff using a simplified LCS algorithm
  calculateDiff(lines1, lines2) {
    const m = lines1.length;
    const n = lines2.length;
    const lcs = this.longestCommonSubsequence(lines1, lines2);
    
    const diff = [];
    let i = 0, j = 0, lcsIndex = 0;
    
    while (i < m || j < n) {
      if (lcsIndex < lcs.length && i < m && lines1[i] === lcs[lcsIndex]) {
        // Common line
        if (j < n && lines2[j] === lcs[lcsIndex]) {
          diff.push({
            type: 'common',
            oldLine: i + 1,
            newLine: j + 1,
            content: lines1[i]
          });
          i++;
          j++;
          lcsIndex++;
        } else {
          // Added line
          diff.push({
            type: 'added',
            oldLine: null,
            newLine: j + 1,
            content: lines2[j]
          });
          j++;
        }
      } else if (lcsIndex < lcs.length && j < n && lines2[j] === lcs[lcsIndex]) {
        // Deleted line
        diff.push({
          type: 'deleted',
          oldLine: i + 1,
          newLine: null,
          content: lines1[i]
        });
        i++;
      } else {
        // Changed lines
        if (i < m && j < n) {
          diff.push({
            type: 'deleted',
            oldLine: i + 1,
            newLine: null,
            content: lines1[i]
          });
          diff.push({
            type: 'added',
            oldLine: null,
            newLine: j + 1,
            content: lines2[j]
          });
          i++;
          j++;
        } else if (i < m) {
          diff.push({
            type: 'deleted',
            oldLine: i + 1,
            newLine: null,
            content: lines1[i]
          });
          i++;
        } else if (j < n) {
          diff.push({
            type: 'added',
            oldLine: null,
            newLine: j + 1,
            content: lines2[j]
          });
          j++;
        }
      }
    }
    
    return diff;
  }

  // Longest Common Subsequence algorithm
  longestCommonSubsequence(lines1, lines2) {
    const m = lines1.length;
    const n = lines2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Fill the DP table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (lines1[i - 1] === lines2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    // Reconstruct LCS
    const lcs = [];
    let i = m, j = n;
    
    while (i > 0 && j > 0) {
      if (lines1[i - 1] === lines2[j - 1]) {
        lcs.unshift(lines1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    
    return lcs;
  }

  // Calculate statistics
  calculateStats(diff) {
    const stats = {
      total: diff.length,
      common: 0,
      added: 0,
      deleted: 0,
      changed: 0
    };

    diff.forEach(line => {
      stats[line.type]++;
    });

    // Calculate changed lines (consecutive deleted + added)
    for (let i = 0; i < diff.length - 1; i++) {
      if (diff[i].type === 'deleted' && diff[i + 1].type === 'added') {
        stats.changed++;
        stats.deleted--;
        stats.added--;
        i++; // Skip the next line as it's part of the change
      }
    }

    stats.similarity = Math.round((stats.common / stats.total) * 100) || 0;
    
    return stats;
  }

  // Generate unified diff format
  generateUnifiedDiff(text1, text2, filename1 = 'file1.txt', filename2 = 'file2.txt') {
    const comparison = this.compare(text1, text2);
    const diff = comparison.diff;
    
    let unified = `--- ${filename1}\n+++ ${filename2}\n`;
    let hunkStart1 = 1, hunkStart2 = 1;
    let hunkLines = [];
    
    for (let i = 0; i < diff.length; i++) {
      const line = diff[i];
      
      switch (line.type) {
        case 'common':
          hunkLines.push(` ${line.content}`);
          break;
        case 'deleted':
          hunkLines.push(`-${line.content}`);
          break;
        case 'added':
          hunkLines.push(`+${line.content}`);
          break;
      }
    }
    
    if (hunkLines.length > 0) {
      const hunkSize1 = hunkLines.filter(l => !l.startsWith('+')).length;
      const hunkSize2 = hunkLines.filter(l => !l.startsWith('-')).length;
      unified += `@@ -${hunkStart1},${hunkSize1} +${hunkStart2},${hunkSize2} @@\n`;
      unified += hunkLines.join('\n');
    }
    
    return unified;
  }

  // Compare JSON structures
  compareJSON(json1, json2) {
    try {
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);
      
      const differences = this.deepCompareObjects(obj1, obj2, '');
      
      return {
        success: true,
        differences: differences,
        structuralChanges: differences.length
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid JSON format'
      };
    }
  }

  // Deep compare objects
  deepCompareObjects(obj1, obj2, path) {
    const differences = [];
    
    const keys1 = Object.keys(obj1 || {});
    const keys2 = Object.keys(obj2 || {});
    const allKeys = [...new Set([...keys1, ...keys2])];
    
    allKeys.forEach(key => {
      const newPath = path ? `${path}.${key}` : key;
      const val1 = obj1 ? obj1[key] : undefined;
      const val2 = obj2 ? obj2[key] : undefined;
      
      if (val1 === undefined) {
        differences.push({
          type: 'added',
          path: newPath,
          value: val2
        });
      } else if (val2 === undefined) {
        differences.push({
          type: 'deleted',
          path: newPath,
          value: val1
        });
      } else if (typeof val1 === 'object' && typeof val2 === 'object') {
        if (Array.isArray(val1) && Array.isArray(val2)) {
          // Compare arrays
          const maxLength = Math.max(val1.length, val2.length);
          for (let i = 0; i < maxLength; i++) {
            const subDiffs = this.deepCompareObjects(
              val1[i] ? { [i]: val1[i] } : {},
              val2[i] ? { [i]: val2[i] } : {},
              newPath
            );
            differences.push(...subDiffs);
          }
        } else {
          // Compare objects
          const subDiffs = this.deepCompareObjects(val1, val2, newPath);
          differences.push(...subDiffs);
        }
      } else if (val1 !== val2) {
        differences.push({
          type: 'changed',
          path: newPath,
          oldValue: val1,
          newValue: val2
        });
      }
    });
    
    return differences;
  }

  // Word-level diff
  compareWords(text1, text2) {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const diff = this.calculateDiff(words1, words2);
    return diff;
  }

  // Character-level diff for inline changes
  compareCharacters(line1, line2) {
    const chars1 = line1.split('');
    const chars2 = line2.split('');
    
    const diff = this.calculateDiff(chars1, chars2);
    return diff;
  }
}

// Global diff tool instance
const diffTool = new DiffTool();

// Compare texts
function compareTexts() {
  const text1 = document.getElementById('diff-text1').value;
  const text2 = document.getElementById('diff-text2').value;

  if (!text1.trim() && !text2.trim()) {
    showNotification('Please enter text in both fields', 'warning');
    return;
  }

  const ignoreCase = document.getElementById('diff-ignore-case').checked;
  const ignoreWhitespace = document.getElementById('diff-ignore-whitespace').checked;

  const options = {
    ignoreCase: ignoreCase,
    ignoreWhitespace: ignoreWhitespace
  };

  // Try JSON comparison first
  let isJSON = false;
  let jsonComparison = null;

  try {
    JSON.parse(text1);
    JSON.parse(text2);
    isJSON = true;
    jsonComparison = diffTool.compareJSON(text1, text2);
  } catch (e) {
    // Not JSON, proceed with text comparison
  }

  const textComparison = diffTool.compare(text1, text2, options);
  
  displayDiffResults(textComparison, jsonComparison, isJSON);
}

// Display diff results
function displayDiffResults(textComparison, jsonComparison, isJSON) {
  const stats = textComparison.stats;
  
  let html = `
    <div class="diff-results">
      <div class="diff-header">
        <h4>📊 Comparison Results</h4>
        <div class="diff-stats">
          <div class="stat-item ${stats.similarity >= 80 ? 'high' : stats.similarity >= 60 ? 'medium' : 'low'}">
            <span class="stat-label">Similarity:</span>
            <span class="stat-value">${stats.similarity}%</span>
          </div>
          <div class="stat-item ${stats.added === 0 ? 'good' : ''}">
            <span class="stat-label">Added:</span>
            <span class="stat-value">${stats.added} lines</span>
          </div>
          <div class="stat-item ${stats.deleted === 0 ? 'good' : ''}">
            <span class="stat-label">Deleted:</span>
            <span class="stat-value">${stats.deleted} lines</span>
          </div>
          <div class="stat-item ${stats.changed === 0 ? 'good' : ''}">
            <span class="stat-label">Changed:</span>
            <span class="stat-value">${stats.changed} lines</span>
          </div>
        </div>
      </div>
  `;

  // Add JSON structural comparison if applicable
  if (isJSON && jsonComparison && jsonComparison.success) {
    html += `
      <div class="json-diff-section">
        <h5>🔍 JSON Structure Changes</h5>
        <div class="json-changes-count">
          <strong>${jsonComparison.structuralChanges}</strong> structural changes detected
        </div>
    `;

    if (jsonComparison.differences.length > 0) {
      html += '<div class="json-differences">';
      jsonComparison.differences.slice(0, 20).forEach(diff => {
        const icon = diff.type === 'added' ? '➕' : diff.type === 'deleted' ? '➖' : '🔄';
        html += `
          <div class="json-diff-item diff-${diff.type}">
            <span class="diff-icon">${icon}</span>
            <span class="diff-path">${diff.path}</span>
            ${diff.type === 'changed' ? `
              <div class="diff-values">
                <span class="old-value">${JSON.stringify(diff.oldValue)}</span>
                <span class="arrow">→</span>
                <span class="new-value">${JSON.stringify(diff.newValue)}</span>
              </div>
            ` : `
              <span class="diff-value">${JSON.stringify(diff.value || '')}</span>
            `}
          </div>
        `;
      });
      html += '</div>';
      
      if (jsonComparison.differences.length > 20) {
        html += `<p class="truncated-notice">... and ${jsonComparison.differences.length - 20} more changes</p>`;
      }
    }
    html += '</div>';
  }

  // Side-by-side diff view
  html += `
    <div class="diff-view">
      <div class="diff-side-by-side">
        <div class="diff-column">
          <h5>Original Text</h5>
          <div class="diff-content" id="diff-original">
  `;

  // Generate side-by-side view
  let originalLineNum = 1;
  let modifiedLineNum = 1;
  
  textComparison.diff.forEach(line => {
    if (line.type === 'common') {
      html += `
        <div class="diff-line common">
          <span class="line-number">${originalLineNum}</span>
          <span class="line-content">${escapeHtml(line.content)}</span>
        </div>
      `;
      originalLineNum++;
    } else if (line.type === 'deleted') {
      html += `
        <div class="diff-line deleted">
          <span class="line-number">${originalLineNum}</span>
          <span class="line-content">${escapeHtml(line.content)}</span>
        </div>
      `;
      originalLineNum++;
    } else if (line.type === 'added') {
      html += `
        <div class="diff-line empty">
          <span class="line-number"></span>
          <span class="line-content"></span>
        </div>
      `;
    }
  });

  html += `
          </div>
        </div>
        <div class="diff-column">
          <h5>Modified Text</h5>
          <div class="diff-content" id="diff-modified">
  `;

  originalLineNum = 1;
  modifiedLineNum = 1;

  textComparison.diff.forEach(line => {
    if (line.type === 'common') {
      html += `
        <div class="diff-line common">
          <span class="line-number">${modifiedLineNum}</span>
          <span class="line-content">${escapeHtml(line.content)}</span>
        </div>
      `;
      modifiedLineNum++;
    } else if (line.type === 'added') {
      html += `
        <div class="diff-line added">
          <span class="line-number">${modifiedLineNum}</span>
          <span class="line-content">${escapeHtml(line.content)}</span>
        </div>
      `;
      modifiedLineNum++;
    } else if (line.type === 'deleted') {
      html += `
        <div class="diff-line empty">
          <span class="line-number"></span>
          <span class="line-content"></span>
        </div>
      `;
    }
  });

  html += `
          </div>
        </div>
      </div>
    </div>

    <div class="diff-actions">
      <button onclick="exportUnifiedDiff()">
        <i class="fas fa-download"></i> Export Unified Diff
      </button>
      <button onclick="copyDiffSummary()">
        <i class="fas fa-copy"></i> Copy Summary
      </button>
    </div>
    </div>
  `;

  document.getElementById('diff-output').innerHTML = html;
  showNotification(`Comparison completed: ${stats.similarity}% similarity`, 'success');
}

// Swap text contents
function swapTexts() {
  const text1 = document.getElementById('diff-text1').value;
  const text2 = document.getElementById('diff-text2').value;

  document.getElementById('diff-text1').value = text2;
  document.getElementById('diff-text2').value = text1;

  showNotification('Text contents swapped', 'success');
}

// Export unified diff
function exportUnifiedDiff() {
  const text1 = document.getElementById('diff-text1').value;
  const text2 = document.getElementById('diff-text2').value;

  const unifiedDiff = diffTool.generateUnifiedDiff(text1, text2, 'original.txt', 'modified.txt');
  
  downloadFile(`diff_${Date.now()}.patch`, unifiedDiff);
  showNotification('Unified diff exported', 'success');
}

// Copy diff summary
function copyDiffSummary() {
  const text1 = document.getElementById('diff-text1').value;
  const text2 = document.getElementById('diff-text2').value;
  
  const comparison = diffTool.compare(text1, text2);
  const stats = comparison.stats;
  
  const summary = `Diff Summary:
- Similarity: ${stats.similarity}%
- Total lines: ${stats.total}
- Common lines: ${stats.common}
- Added lines: ${stats.added}
- Deleted lines: ${stats.deleted}
- Changed lines: ${stats.changed}`;

  copyToClipboard(summary);
  showNotification('Diff summary copied to clipboard', 'success');
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
