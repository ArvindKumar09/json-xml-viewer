/* -------------------------
   Sidebar Toggle & Search
------------------------- */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Mobile: slide in/out
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  } else {
    // Desktop: collapse/expand
    sidebar.classList.toggle('collapsed');
  }
}

function filterTools(query) {
  const q = query.toLowerCase().trim();
  const categories = document.querySelectorAll('.sidebar-nav .tool-category');
  const noResults = document.getElementById('sidebarNoResults');
  let anyVisible = false;

  categories.forEach(cat => {
    const items = cat.querySelectorAll('.dropdown-item');
    let catHasMatch = false;

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        item.classList.remove('search-hidden');
        catHasMatch = true;
      } else {
        item.classList.add('search-hidden');
      }
    });

    // Also check category name
    const catText = cat.querySelector('.category-text');
    if (catText && catText.textContent.toLowerCase().includes(q)) {
      catHasMatch = true;
      // Show all items in matching category
      items.forEach(item => item.classList.remove('search-hidden'));
    }

    if (catHasMatch) {
      cat.classList.remove('search-hidden');
      anyVisible = true;
      // Auto-expand matching categories when searching
      if (q) {
        const dropdown = cat.querySelector('.category-dropdown');
        const btn = cat.querySelector('.category-btn');
        if (dropdown) dropdown.classList.add('show');
        if (btn) btn.classList.add('open');
      }
    } else {
      cat.classList.add('search-hidden');
    }
  });

  if (noResults) {
    noResults.classList.toggle('show', !anyVisible && q.length > 0);
  }

  // Collapse all categories when search is cleared
  if (!q) {
    categories.forEach(cat => {
      cat.classList.remove('search-hidden');
      cat.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('search-hidden'));
    });
  }
}

// Close sidebar on mobile after selecting a tool
function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  }
}

// Keyboard shortcut: Ctrl+B to toggle sidebar
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault();
    toggleSidebar();
  }
});

/* -------------------------
   Show only one panel + save choice
------------------------- */
function showOnly(type, updateUrl = true) {
  const panels = ['json', 'xml', 'graph', 'base64', 'jwt', 'url', 'hash', 'uuid', 'color', 'timestamp', 'qr', 'regex', 'text', 'api', 'markdown', 'csv', 'sql', 'diff', 'password', 'jsonpath', 'summarize', 'translate', 'sentiment', 'grammar', 'keywords'];
  const buttons = ['btn-json', 'btn-xml', 'btn-graph', 'btn-base64', 'btn-jwt', 'btn-url', 'btn-hash', 'btn-uuid', 'btn-color', 'btn-timestamp', 'btn-qr', 'btn-regex', 'btn-text', 'btn-api', 'btn-markdown', 'btn-csv', 'btn-sql', 'btn-diff', 'btn-password', 'btn-jsonpath', 'btn-summarize', 'btn-translate', 'btn-sentiment', 'btn-grammar', 'btn-keywords'];
  
  // Hide all panels and deactivate all buttons
  panels.forEach(panel => {
    const element = document.getElementById(`panel-${panel}`);
    if (element) element.classList.add('hidden');
  });
  
  buttons.forEach(button => {
    const element = document.getElementById(button);
    if (element) element.classList.remove('active');
  });

  // Show selected panel and activate button
  const targetPanel = document.getElementById(`panel-${type}`);
  const targetButton = document.getElementById(`btn-${type}`);
  
  if (targetPanel) targetPanel.classList.remove('hidden');
  if (targetButton) targetButton.classList.add('active');

  // Update URL to clean path format instead of hash
  if (updateUrl && window.location.pathname !== `/${type}`) {
    try {
      window.history.pushState({tool: type}, null, `/${type}`);
    } catch (e) {
      // Fallback to hash for file:// protocol
      window.history.pushState(null, null, `#${type}`);
    }
  }

  // Update category dropdown selected tool display
  updateSelectedToolDisplay(type);

  // Restore saved inputs for the current panel
  restorePanelInputs(type);

  // Remember last opened panel
  localStorage.setItem('last-panel', type);
}

/* -------------------------
   Navigation function for clean URLs
------------------------- */
function navigateToTool(tool, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Close any open dropdowns
  document.querySelectorAll('.category-dropdown').forEach(dropdown => {
    dropdown.classList.remove('show');
  });
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('open');
  });
  
  // Show the tool panel and update URL
  showOnly(tool, true);
  
  // Highlight the active tool in sidebar and keep its category open
  highlightActiveTool(tool);
  
  // Close sidebar on mobile
  closeSidebarOnMobile();
  
  return false;
}

function highlightActiveTool(tool) {
  // Remove active class from all dropdown items
  document.querySelectorAll('.sidebar-nav .dropdown-item').forEach(item => {
    item.classList.remove('active');
  });

  // Find and activate the selected tool's dropdown item
  const activeItem = document.querySelector(`.sidebar-nav .dropdown-item[onclick*="'${tool}'"]`);
  if (activeItem) {
    activeItem.classList.add('active');

    // Keep the parent category dropdown open
    const dropdown = activeItem.closest('.category-dropdown');
    const categoryDiv = activeItem.closest('.tool-category');
    if (dropdown) dropdown.classList.add('show');
    if (categoryDiv) {
      const btn = categoryDiv.querySelector('.category-btn');
      if (btn) btn.classList.add('open');
    }
  }
}

/* -------------------------
   Update selected tool display in category buttons
------------------------- */
function updateSelectedToolDisplay(tool) {
  // Map tools to their display names
  const toolNames = {
    'json': 'JSON Viewer',
    'xml': 'XML Viewer', 
    'graph': 'Generate Graph',
    'csv': 'CSV Processor',
    'base64': 'Base64 Encoder',
    'jwt': 'JWT Decoder',
    'url': 'URL Encoder',
    'hash': 'Hash Generator',
    'uuid': 'UUID Generator',
    'qr': 'QR Generator',
    'password': 'Password Generator',
    'color': 'Color Converter',
    'timestamp': 'Timestamp Converter',
    'regex': 'Regex Tester',
    'text': 'Text Utilities',
    'api': 'API Formatter',
    'markdown': 'Markdown Preview',
    'sql': 'SQL Formatter',
    'diff': 'Diff Tool',
    'jsonpath': 'JSONPath Tester',
    'summarize': 'Text Summarizer',
    'translate': 'Text Translator',
    'sentiment': 'Sentiment Analysis',
    'grammar': 'Grammar Checker',
    'keywords': 'Keyword Extractor'
  };

  // Map tools to their categories
  const toolCategories = {
    'json': 'viewers', 'xml': 'viewers', 'graph': 'viewers', 'csv': 'viewers',
    'base64': 'encoders', 'jwt': 'encoders', 'url': 'encoders',
    'hash': 'generators', 'uuid': 'generators', 'qr': 'generators', 'password': 'generators',
    'color': 'converters', 'timestamp': 'converters',
    'regex': 'texttools', 'text': 'texttools', 'api': 'texttools', 'markdown': 'texttools', 'sql': 'texttools', 'diff': 'texttools', 'jsonpath': 'texttools',
    'summarize': 'ai', 'translate': 'ai', 'sentiment': 'ai', 'grammar': 'ai', 'keywords': 'ai'
  };

  const category = toolCategories[tool];
  const toolName = toolNames[tool] || tool;
  
  if (category) {
    const categoryBtn = document.querySelector(`[data-category="${category}"] .selected-tool`);
    if (categoryBtn) {
      categoryBtn.textContent = toolName;
    }
  }
}

/* -------------------------
   Get current tool from URL path
------------------------- */
function getCurrentToolFromPath() {
  const path = window.location.pathname;
  
  // Remove leading slash and get the tool name
  const tool = path.replace(/^\//, '').replace(/\/$/, '');
  
  // Valid tools list
  const validTools = ['json', 'xml', 'graph', 'base64', 'jwt', 'url', 'hash', 'uuid', 'color', 'timestamp', 'qr', 'regex', 'text', 'api', 'markdown', 'csv', 'sql', 'diff', 'password', 'jsonpath', 'summarize', 'translate', 'sentiment', 'grammar', 'keywords'];
  
  // Return tool if valid, otherwise check hash fallback, otherwise default to json
  if (validTools.includes(tool)) {
    return tool;
  }
  
  // Fallback to hash-based detection for backwards compatibility
  const hash = window.location.hash.replace('#', '');
  if (validTools.includes(hash)) {
    return hash;
  }
  
  return 'json'; // default
}

/* -------------------------
   Panel Input Restoration
------------------------- */
function restorePanelInputs(panelType) {
  // Define which inputs to restore for each panel
  const panelInputs = {
    json: ['json-io-input'],
    xml: ['xml-io-input'],
    graph: ['graph-input'],
    base64: ['base64-input'],
    jwt: ['jwt-input', 'jwt-secret'],
    url: ['url-input'],
    hash: ['hash-input', 'hash-algorithm'],
    uuid: ['uuid-input'],
    color: ['color-input', 'color-format'],
    timestamp: ['timestamp-input'],
    qr: ['qr-input', 'qr-size'],
    regex: ['regex-pattern', 'regex-flags', 'regex-input'],
    text: ['text-input', 'text-operation'],
    api: ['api-input', 'api-format'],
    markdown: ['markdown-input'],
    // AI Tools
    summarize: ['text-to-summarize', 'summary-length'],
    translate: ['text-to-translate', 'source-lang', 'target-lang'],
    sentiment: ['text-to-analyze'],
    grammar: ['text-to-check'],
    keywords: ['text-for-keywords', 'keyword-count']
  };
  
  // Restore inputs for the current panel
  if (panelInputs[panelType]) {
    panelInputs[panelType].forEach(inputId => {
      const element = document.getElementById(inputId);
      if (element) {
        const savedValue = LocalStorage.loadInput(panelType, inputId);
        if (savedValue && savedValue !== element.value) {
          element.value = savedValue;
          
          // Trigger any associated processing for restored values
          if (inputId === 'color-input' && savedValue.trim()) {
            setTimeout(() => convertColor(), 50);
          } else if (inputId === 'uuid-input' && savedValue.trim()) {
            setTimeout(() => validateUUID(), 50);
          } else if (inputId === 'markdown-input' && savedValue.trim()) {
            setTimeout(() => previewMarkdown(), 50);
          } else if (inputId === 'timestamp-input' && savedValue.trim()) {
            setTimeout(() => convertTimestamp(), 50);
          } else if (inputId === 'text-input' && savedValue.trim()) {
            setTimeout(() => transformText(), 50);
          }
        }
      }
    });
  }
}

/* -------------------------
   Local Storage Management for Input Persistence
------------------------- */
const LocalStorage = {
  // Save input value to localStorage
  saveInput: function(panelType, inputId, value) {
    try {
      const key = `${panelType}-${inputId}`;
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  // Load input value from localStorage
  loadInput: function(panelType, inputId) {
    try {
      const key = `${panelType}-${inputId}`;
      return localStorage.getItem(key) || '';
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return '';
    }
  },

  // Clear input from localStorage
  clearInput: function(panelType, inputId) {
    try {
      const key = `${panelType}-${inputId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear from localStorage:', error);
    }
  },

  // Clear all data for a panel
  clearPanel: function(panelType) {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`${panelType}-`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear panel data:', error);
    }
  },

  // Get storage usage info
  getStorageInfo: function() {
    let totalSize = 0;
    let itemCount = 0;
    
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
          itemCount++;
        }
      }
      
      return {
        totalSize: Math.round(totalSize / 1024 * 100) / 100, // KB
        itemCount: itemCount,
        available: 5120 - Math.round(totalSize / 1024) // Approximate 5MB limit
      };
    } catch (error) {
      return { totalSize: 0, itemCount: 0, available: 5120 };
    }
  }
};

/* -------------------------
   Full Screen Toggle
------------------------- */
function toggleFullScreen(id) {
  const element = document.getElementById(id);
  element.classList.toggle('full-screen');

  // Allow clicking anywhere OUTSIDE content to exit full screen
  element.onclick = function(e) {
    if (element.classList.contains('full-screen') && e.target === element) {
      element.classList.remove('full-screen');
    }
  }
}

/* -------------------------
   Copy / Paste / Clear
------------------------- */
function copyInput(id) {
  const value = document.getElementById(id).value;
  navigator.clipboard.writeText(value).catch(err => {
    console.error("Copy failed: ", err);
  });
}

async function pasteInput(id) {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById(id).value = text;
    localStorage.setItem(id, text); // store after pasting
  } catch (err) {
    console.error("Paste failed: ", err);
  }
}

function clearInput(id) {
  document.getElementById(id).value = '';
  localStorage.removeItem(id); // remove from storage as well
}

/* -------------------------
   Theme Toggle + save choice
------------------------- */
document.getElementById('themeToggle').addEventListener('click', () => {
  // Toggle theme classes on body
  if (document.body.classList.contains('light')) {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    localStorage.setItem('theme-mode', 'dark');
  } else {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    localStorage.setItem('theme-mode', 'light');
  }
});

/* -------------------------
   Restore everything on load
------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Restore saved theme. Default to light
  const savedTheme = localStorage.getItem('theme-mode') || 'light';
  if (savedTheme === 'light') {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  } else {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  }

  // Restore saved inputs
  const savedJSON = localStorage.getItem('json-input');
  const savedXML  = localStorage.getItem('xml-input');
  if (savedJSON) document.getElementById('json-input').value = savedJSON;
  if (savedXML)  document.getElementById('xml-input').value  = savedXML;

  document.getElementById('json-input').addEventListener('input', function() {
    localStorage.setItem('json-input', this.value);
  });

  document.getElementById('xml-input').addEventListener('input', function() {
    localStorage.setItem('xml-input', this.value);
  });

  // Get the current tool from URL path or hash
  const currentTool = getCurrentToolFromPath();
  
  // Show the current tool
  showOnly(currentTool, false); // Don't update URL on initial load
  
  // Highlight the active tool in sidebar
  highlightActiveTool(currentTool);
});

// Handle browser back/forward for both clean URLs and hash URLs
window.addEventListener('popstate', function(event) {
  const currentTool = getCurrentToolFromPath();
  showOnly(currentTool, false); // Don't update URL to avoid infinite loop
  highlightActiveTool(currentTool);
});

// Legacy support: Handle direct hash changes for backwards compatibility
window.addEventListener('hashchange', function() {
  const urlHash = window.location.hash.substring(1); // Remove #
  const validPanels = ['json', 'xml', 'graph', 'base64', 'jwt', 'url', 'hash', 'uuid', 'color', 'timestamp', 'qr', 'regex', 'text', 'api', 'markdown', 'csv', 'sql', 'diff', 'password', 'jsonpath', 'summarize', 'translate', 'sentiment', 'grammar', 'keywords'];
  
  if (urlHash && validPanels.includes(urlHash)) {
    // Call showOnly without updating URL to avoid infinite loop
    showOnly(urlHash, false);
  } else if (!urlHash) {
    // If hash is empty, go to default panel
    showOnly('json', false);
  }
});

/* -------------------------
   Optional Clear All Storage
------------------------- */
function clearAllSavedData() {
  localStorage.removeItem('json-input');
  localStorage.removeItem('xml-input');
  localStorage.removeItem('last-panel');
  localStorage.removeItem('theme-mode');
  document.getElementById('json-input').value = '';
  document.getElementById('xml-input').value  = '';
  // Reset to default panel and theme
  showOnly('json');
  document.body.classList.remove('light');
  document.body.classList.add('dark');
}

// Essential shared functions for UI interactions

function makeResizable(inputId, dividerId, outputId) {
  let dragging = false;
  let startX = 0;
  let startInputWidth = 0;
  let startOutputWidth = 0;
  const input = document.getElementById(inputId);
  const divider = document.getElementById(dividerId);
  const output = document.getElementById(outputId);
  if (!input || !divider || !output) return;

  // Reset widths to default (50/50) when panel is shown
  function resetWidths() {
    input.style.flex = '';
    output.style.flex = '';
    input.style.width = '';
    output.style.width = '';
  }

  // Listen for custom event to reset widths
  divider.parentNode.addEventListener('reset-divider', resetWidths);

  divider.addEventListener('mousedown', function(e) {
    dragging = true;
    startX = e.clientX;
    startInputWidth = input.offsetWidth;
    startOutputWidth = output.offsetWidth;
    divider.classList.add('active');
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });

  function onMouseMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    let newInputWidth = startInputWidth + dx;
    let newOutputWidth = startOutputWidth - dx;
    const min = 80;
    const total = newInputWidth + newOutputWidth;
    if (newInputWidth < min) {
      newInputWidth = min;
      newOutputWidth = total - min;
    }
    if (newOutputWidth < min) {
      newOutputWidth = min;
      newInputWidth = total - min;
    }
    input.style.flex = 'none';
    output.style.flex = 'none';
    input.style.width = newInputWidth + 'px';
    output.style.width = newOutputWidth + 'px';
  }

  function onMouseUp() {
    if (dragging) {
      dragging = false;
      divider.classList.remove('active');
      document.body.style.cursor = '';
    }
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  const text = element.textContent || element.innerText;
  
  if (!text.trim()) {
    alert('Nothing to copy!');
    return;
  }
  
  navigator.clipboard.writeText(text).then(() => {
    // Temporary visual feedback
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#d4edda';
    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, 200);
  }).catch(err => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  });
}

function pasteInput(elementId) {
  navigator.clipboard.readText().then(text => {
    const element = document.getElementById(elementId);
    if (element) {
      element.value = text;
      
      // Auto-trigger functions for certain panels
      if (elementId === 'color-input') convertColor();
      if (elementId === 'timestamp-input') convertTimestamp();
      if (elementId === 'uuid-input') validateUUID();
      if (elementId === 'markdown-input') previewMarkdown();
    }
  }).catch(err => {
    console.error('Failed to read clipboard: ', err);
  });
}

function clearInput(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.value = '';
    
    // Auto-clear related outputs
    if (elementId === 'color-input') {
      document.getElementById('color-output').textContent = '';
      document.getElementById('color-preview').style.backgroundColor = '#f0f0f0';
    }
    if (elementId === 'timestamp-input') {
      document.getElementById('timestamp-output').textContent = 'Timestamp conversion will appear here';
    }
    if (elementId === 'uuid-input') {
      document.getElementById('uuid-validation').textContent = '';
    }
    if (elementId === 'markdown-input') {
      document.getElementById('markdown-output').innerHTML = '<p><em>Enter Markdown text to see preview</em></p>';
    }
  }
}

function captureScreenshot(outputId, filename) {
  const output = document.getElementById(outputId);
  if (!output) return;
  // Temporarily expand to show all content
  const prevScrollTop = output.scrollTop;
  const prevScrollLeft = output.scrollLeft;
  output.scrollTop = 0;
  output.scrollLeft = 0;
  html2canvas(output, {useCORS: true, backgroundColor: null, windowWidth: output.scrollWidth, windowHeight: output.scrollHeight, width: output.scrollWidth, height: output.scrollHeight, scrollY: -window.scrollY}).then(canvas => {
    // Restore scroll
    output.scrollTop = prevScrollTop;
    output.scrollLeft = prevScrollLeft;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

function clearAll(panelType) {
  switch (panelType) {
    case 'url':
      document.getElementById('url-input').value = '';
      document.getElementById('url-output').innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-link" style="font-size: 48px; margin-bottom: 10px;"></i><div>URL encoded/decoded result will appear here</div></div>';
      break;
    case 'hash':
      document.getElementById('hash-input').value = '';
      document.getElementById('hash-output').innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-hashtag" style="font-size: 48px; margin-bottom: 10px;"></i><div>Hash values will appear here</div></div>';
      break;
    case 'uuid':
      document.getElementById('uuid-input').value = '';
      document.getElementById('uuid-output').innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-fingerprint" style="font-size: 48px; margin-bottom: 10px;"></i><div>Generated UUIDs will appear here</div></div>';
      break;
    case 'color':
      document.getElementById('color-input').value = '';
      document.getElementById('color-output').innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-palette" style="font-size: 48px; margin-bottom: 10px;"></i><div>Color conversions will appear here</div></div>';
      break;
    case 'timestamp':
      document.getElementById('timestamp-input').value = '';
      document.getElementById('timestamp-output').innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-clock" style="font-size: 48px; margin-bottom: 10px;"></i><div>Timestamp conversions will appear here</div></div>';
      break;
    case 'regex':
      document.getElementById('regex-pattern').value = '';
      document.getElementById('regex-input').value = '';
      if (document.getElementById('regex-global')) document.getElementById('regex-global').checked = true;
      if (document.getElementById('regex-ignorecase')) document.getElementById('regex-ignorecase').checked = true;
      document.getElementById('regex-output').innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-search" style="font-size: 48px; margin-bottom: 10px;"></i><div>Regex matches will appear here</div></div>';
      break;
    case 'text':
      document.getElementById('text-input').value = '';
      document.getElementById('text-output').innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-text-width" style="font-size: 48px; margin-bottom: 10px;"></i><div>Processed text will appear here</div></div>';
      break;
    case 'api':
      document.getElementById('api-input').value = '';
      document.getElementById('api-output').innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-server" style="font-size: 48px; margin-bottom: 10px;"></i><div>Formatted API response will appear here</div></div>';
      break;
    case 'markdown':
      document.getElementById('markdown-input').value = '';
      document.getElementById('markdown-output').innerHTML = '<div style="color: #888; text-align: center; margin-top: 100px;"><i class="fas fa-markdown" style="font-size: 48px; margin-bottom: 10px;"></i><div>Markdown preview will appear here</div></div>';
      break;
  }
}

function clearAllStorage() {
  if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
    // Clear all panel data (keep language and last-panel settings)
    const keysToKeep = ['language', 'last-panel'];
    const keysToRemove = [];
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    alert('All saved data has been cleared.');
    closeStorageModal();
  }
}
