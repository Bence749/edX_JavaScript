const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Correctly get the context for gameCanvas
const chartCanvas = document.getElementById('scoreChart'); // Get the scoreChart element
const chartCtx = chartCanvas.getContext('2d'); // Get the context for scoreChart
let scoreChart;

class Button {
  constructor(x, y, width, height, text) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.visible = true;
  }

  draw() {
    if (!this.visible) return;

    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
  }

  isClicked(mouseX, mouseY) {
    return this.visible &&
      mouseX >= this.x && mouseX <= this.x + this.width &&
      mouseY >= this.y && mouseY <= this.y + this.height;
  }
}

const buttons = [
  new Button(250, 485, 100, 50, 'One'),
  new Button(400, 485, 100, 50, 'Two'),
  new Button(550, 485, 100, 50, 'Three'),
  new Button(700, 485, 100, 50, 'Four')
];

function initializeGame() {
  ctx.fillStyle = "darkgreen";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'black';
  ctx.fillRect(200, 425, 650, 150);

  ctx.fillStyle = 'darkgrey';
  ctx.fillRect(205, 430, 640, 140);

  ctx.fillStyle = 'lightgrey';
  ctx.fillRect(208, 433, 634, 134);

  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText("Select the player number", canvas.width / 2 , 460);

  buttons.forEach(button => button.draw());
}

function initializeChart() {
  // Initialize the score chart with no data
  scoreChart = new Chart(chartCtx, {
    type: 'bar',
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allows better control of chart size
      plugins: {
        legend: {
          display: false // Hide legend
        },
        tooltip: {
          enabled: false // Disable tooltips
        },
        datalabels: {
          anchor: 'end', // Position label at the end of the bar
          align: 'top', // Align label to the top of the bar
          offset: 4, // Add space between the bar and the label
          clamp: true, // Ensure labels stay within chart bounds
          formatter: function (value) {
            return value; // Display the value on top of the bar
          },
          font: {
            weight: 'bold' // Make labels bold for better visibility
          }
        }
      },
      scales: {
        x: {
          display: false // Hide x-axis
        },
        y: {
          display: false, // Hide y-axis
          beginAtZero: true, // Ensure bars start from zero
          suggestedMax: null // Placeholder for dynamic max value adjustment
        }
      }
    },
    plugins: [ChartDataLabels] // Include Chart.js Data Labels plugin
  });

  // Draw the initial waiting message directly on the chart canvas
  drawWaitingMessage();
}

function drawWaitingMessage() {
  const { left, right, top, bottom } = chartCtx.canvas.getBoundingClientRect();

  chartCtx.clearRect(0, 0, chartCtx.canvas.width, chartCtx.canvas.height); // Clear previous drawings

  // Set styles for the message
  chartCtx.fillStyle = 'darkgreen'; // Background color
  chartCtx.fillRect(0, 0, chartCtx.canvas.width, chartCtx.canvas.height); // Draw background rectangle

  chartCtx.fillStyle = 'white'; // Text color
  chartCtx.textAlign = 'center';
  chartCtx.textBaseline = 'middle';
  chartCtx.font = '20px Arial';
  chartCtx.fillText('Waiting for results...', chartCtx.canvas.width / 2, chartCtx.canvas.height / 2);
}


function changeBackgroundColor(color){
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

async function handleButtonClick(buttonNumber) {
  ctx.strokeStyle = "darkgrey";
  ctx.lineWidth = 5;
  ctx.strokeRect(buttons[buttonNumber - 1].x + 3,
    buttons[buttonNumber - 1].y + 3,
    buttons[buttonNumber - 1].width - 6,
    buttons[buttonNumber - 1].height - 6);

  await new Promise(resolve => setTimeout(resolve, 50));

  changeBackgroundColor('lightgrey');
  buttons[buttonNumber - 1].visible = false;
}

function handleCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  buttons.forEach((button, index) => {
    if (button.isClicked(mouseX, mouseY)) {
      handleButtonClick(index + 1).then(() => {
        startGame(canvas, index + 1, scoreChart).then(() => {});
      });
      canvas.removeEventListener('click', handleCanvasClick);
    }
  });
}

canvas.addEventListener('click', handleCanvasClick);

initializeGame();
initializeChart();

