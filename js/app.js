// Main Floor Planner Application
class FloorPlanner {
    constructor() {
        this.canvas = document.getElementById('planCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.furniture = [];
        this.lines = [];
        this.mode = 'draw';
        this.zoom = 1.0;
        this.zoomMin = 0.1;
        this.zoomMax = 5.0;
        this.zoomFactor = 1.1;
        this.selectedFurniture = null;
        this.dragging = false;
        this.drawing = false;
        this.currentLine = null;

        // Constants
        this.PIXELS_PER_METER = 65;
        this.CM_PER_METER = 100;

        this.setupCanvas();
        this.setupEventListeners();
        this.loadImage();
    }

    setupCanvas() {
        // Set initial canvas size to match container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.redraw();
        });
    }

    setupEventListeners() {
        // Mode buttons
        document.getElementById('drawMode').addEventListener('click', () => this.setMode('draw'));
        document.getElementById('eraseMode').addEventListener('click', () => this.setMode('erase'));
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());
        document.getElementById('addFurniture').addEventListener('click', () => this.showFurnitureDialog());
        document.getElementById('removeFurniture').addEventListener('click', () => this.removeSelectedFurniture());
        document.getElementById('rotateDimensions').addEventListener('click', () => this.rotateFurnitureDimensions());

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startAction(e));
        this.canvas.addEventListener('mousemove', (e) => this.dragAction(e));
        this.canvas.addEventListener('mouseup', (e) => this.finishAction(e));
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.rotateFurniture();
        });

        // Dialog events
        document.getElementById('saveFurniture').addEventListener('click', () => this.addFurniture());
        document.getElementById('cancelFurniture').addEventListener('click', () => this.hideFurnitureDialog());
    }

    loadImage() {
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'img/plan.jpg';
        this.backgroundImage.onload = () => {
            this.canvas.width = this.backgroundImage.width;
            this.canvas.height = this.backgroundImage.height;
            this.redraw();
        };
    }

    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.toolbar button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'Mode')?.classList.add('active');
    }

    showFurnitureDialog() {
        document.getElementById('furnitureDialog').classList.add('visible');
    }

    hideFurnitureDialog() {
        document.getElementById('furnitureDialog').classList.remove('visible');
    }

    addFurniture() {
        const name = document.getElementById('furnitureName').value.trim();
        const width = parseFloat(document.getElementById('furnitureWidth').value);
        const length = parseFloat(document.getElementById('furnitureLength').value);
        const color = document.getElementById('furnitureColor').value;

        if (name && width > 0 && length > 0) {
            const x = this.canvas.width / (2 * this.zoom);
            const y = this.canvas.height / (2 * this.zoom);
            const furniture = new Furniture(name, width, length, color, x, y);
            this.furniture.push(furniture);
            this.selectedFurniture = furniture;
            this.hideFurnitureDialog();
            this.redraw();

            // Reset form
            document.getElementById('furnitureName').value = '';
            document.getElementById('furnitureWidth').value = '';
            document.getElementById('furnitureLength').value = '';
        }
    }

    removeSelectedFurniture() {
        if (this.selectedFurniture) {
            const index = this.furniture.indexOf(this.selectedFurniture);
            if (index > -1) {
                this.furniture.splice(index, 1);
                this.selectedFurniture = null;
                this.redraw();
            }
        }
    }

    rotateFurniture() {
        if (this.selectedFurniture) {
            this.selectedFurniture.rotate();
            this.redraw();
        }
    }

    rotateFurnitureDimensions() {
        if (this.selectedFurniture) {
            this.selectedFurniture.rotateDimensions();
            this.redraw();
        }
    }

    clearAll() {
        this.lines = [];
        this.furniture = [];
        this.selectedFurniture = null;
        this.redraw();
    }

    handleZoom(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const oldZoom = this.zoom;
        if (e.deltaY < 0) {
            this.zoom = Math.min(this.zoom * this.zoomFactor, this.zoomMax);
        } else {
            this.zoom = Math.max(this.zoom / this.zoomFactor, this.zoomMin);
        }

        if (oldZoom !== this.zoom) {
            // Adjust scroll to keep the point under mouse fixed
            const scale = this.zoom / oldZoom;
            const canvasX = this.canvas.scrollLeft + mouseX;
            const canvasY = this.canvas.scrollTop + mouseY;
            
            this.canvas.scrollLeft = canvasX * scale - mouseX;
            this.canvas.scrollTop = canvasY * scale - mouseY;
            
            this.redraw();
        }
    }

    startAction(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;

        // Check for furniture first
        const furniture = this.getFurnitureAtPosition(x, y);
        if (furniture) {
            if (this.mode === 'erase') {
                this.removeSelectedFurniture();
            } else {
                this.selectedFurniture = furniture;
                this.dragging = true;
                this.dragStartX = x;
                this.dragStartY = y;
                this.dragOffsetX = x - furniture.x;
                this.dragOffsetY = y - furniture.y;
            }
        } else {
            if (this.mode === 'draw') {
                this.drawing = true;
                this.currentLine = { x1: x, y1: y, x2: x, y2: y };
            } else if (this.mode === 'erase') {
                this.removeLine(x, y);
            }
            this.selectedFurniture = null;
        }
        this.redraw();
    }

    dragAction(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;

        if (this.dragging && this.selectedFurniture) {
            this.selectedFurniture.x = x - this.dragOffsetX;
            this.selectedFurniture.y = y - this.dragOffsetY;
            this.redraw();
        } else if (this.drawing) {
            this.currentLine.x2 = x;
            this.currentLine.y2 = y;
            this.redraw();
        }
    }

    finishAction(e) {
        if (this.drawing && this.currentLine) {
            const length = Math.sqrt(
                Math.pow(this.currentLine.x2 - this.currentLine.x1, 2) +
                Math.pow(this.currentLine.y2 - this.currentLine.y1, 2)
            );

            if (length > 0) {
                this.lines.push({
                    ...this.currentLine,
                    length_px: length,
                    length_m: length / this.PIXELS_PER_METER
                });
            }
        }
        this.drawing = false;
        this.dragging = false;
        this.currentLine = null;
        this.redraw();
    }

    removeLine(x, y) {
        for (let i = this.lines.length - 1; i >= 0; i--) {
            const line = this.lines[i];
            const distance = Measurements.pointToLineDistance(
                x, y, line.x1, line.y1, line.x2, line.y2
            );
            if (distance < 5 / this.zoom) {
                this.lines.splice(i, 1);
                this.redraw();
                break;
            }
        }
    }

    getFurnitureAtPosition(x, y) {
        for (let i = this.furniture.length - 1; i >= 0; i--) {
            if (this.furniture[i].containsPoint(x, y)) {
                return this.furniture[i];
            }
        }
        return null;
    }

    redraw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background image or instructions
        if (this.backgroundImage) {
            const width = this.backgroundImage.width * this.zoom;
            const height = this.backgroundImage.height * this.zoom;
            this.ctx.drawImage(this.backgroundImage, 0, 0, width, height);
        } else {
            this.drawInstructions();
        }

        // Draw furniture
        this.furniture.forEach(furniture => {
            furniture.draw(this.ctx, this.zoom, furniture === this.selectedFurniture);
        });

        // Draw lines
        this.lines.forEach(line => {
            Measurements.drawLine(this.ctx, line, this.zoom, this.PIXELS_PER_METER);
        });

        // Draw current line if drawing
        if (this.drawing && this.currentLine) {
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentLine.x1 * this.zoom, this.currentLine.y1 * this.zoom);
            this.ctx.lineTo(this.currentLine.x2 * this.zoom, this.currentLine.y2 * this.zoom);
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
    new FloorPlanner();
});
