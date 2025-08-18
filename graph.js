// Graph functions for chart visualization

// Global variable to store current chart instance
let currentChart = null;

function generateGraphInPanel() {
  const input = document.getElementById('graph-input').value.trim();
  const chartType = document.getElementById('chart-type-select').value;
  
  if (!input) {
    alert('Please paste your data first!');
    return;
  }
  
  try {
    const parsedData = parseInput(input);
    drawChartInPanel(parsedData, chartType);
  } catch (error) {
    alert('Error parsing data: ' + error.message);
  }
}

function drawChartInPanel(data, type) {
  const canvas = document.getElementById('graph-panel-chart');
  const placeholder = document.getElementById('graph-placeholder');
  const ctx = canvas.getContext('2d');
  
  // Hide placeholder
  placeholder.style.display = 'none';
  canvas.style.display = 'block';
  
  // Destroy existing chart
  if (currentChart) {
    currentChart.destroy();
  }
  
  // Convert parsed data to Chart.js format
  const labels = data.map(item => item.label);
  const values = data.map(item => item.value);
  
  const chartData = {
    labels: labels,
    datasets: [{
      label: 'Dataset',
      data: values,
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
      ],
      borderColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
      ],
      borderWidth: 1
    }]
  };
  
  // Create new chart
  currentChart = new Chart(ctx, {
    type: type,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        }
      }
    }
  });
}

function downloadGraphFromPanel() {
  if (!currentChart) {
    alert('Please generate a chart first!');
    return;
  }
  
  const canvas = document.getElementById('graph-panel-chart');
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chart.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Helper function to parse input data
function parseInput(input) {
  // Try to parse as JSON first
  try {
    const jsonData = JSON.parse(input);
    if (Array.isArray(jsonData)) {
      return jsonData.map((item, index) => ({
        label: item.label || item.name || item.x || `Item ${index + 1}`,
        value: parseFloat(item.value || item.y || item.count || item) || 0
      }));
    } else if (typeof jsonData === 'object') {
      return Object.entries(jsonData).map(([key, value]) => ({
        label: key,
        value: parseFloat(value) || 0
      }));
    }
  } catch (e) {
    // Not JSON, try CSV
    const lines = input.split('\n').filter(line => line.trim());
    const data = [];
    
    lines.forEach((line, index) => {
      const parts = line.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        data.push({
          label: parts[0],
          value: parseFloat(parts[1]) || 0
        });
      } else if (parts.length === 1 && !isNaN(parseFloat(parts[0]))) {
        data.push({
          label: `Value ${index + 1}`,
          value: parseFloat(parts[0])
        });
      }
    });
    
    if (data.length > 0) {
      return data;
    }
  }
  
  throw new Error('Unable to parse data. Please provide JSON or CSV format.');
}
