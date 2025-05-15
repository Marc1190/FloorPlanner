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
        
        // Mobile specific properties
        this.touchModeEnabled = false;
        this.touchHitAreaSize = 5; // Default hit area size

        // Constants
        this.PIXELS_PER_METER = 65;
        this.CM_PER_METER = 100;

        // Auto-detect mobile devices
        this.detectMobileDevice();
        
        this.setupCanvas();
        this.setupEventListeners();
        this.loadImage();
    }
    
    detectMobileDevice() {
        // Simple mobile detection - can be expanded with more robust detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            // Auto-enable touch mode on mobile devices
            this.touchModeEnabled = true;
        }
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
        document.getElementById('touchModeToggle').addEventListener('click', () => this.toggleTouchMode());

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startAction(e));
        this.canvas.addEventListener('mousemove', (e) => this.dragAction(e));
        this.canvas.addEventListener('mouseup', (e) => this.finishAction(e));
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.rotateFurniture();
        });

        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));

        // Initialize touch variables
        this.activeTouchId = null;
        this.isGesturing = false;
        this.lastTouchDistance = null;
        this.gestureStartZoom = null;
        this.longPressTimer = null;
        this.longPressDuration = 500; // ms

        // Dialog events
        document.getElementById('saveFurniture').addEventListener('click', () => this.addFurniture());
        document.getElementById('cancelFurniture').addEventListener('click', () => this.hideFurnitureDialog());
        
        // Apply initial touch mode state
        this.updateTouchModeUI();
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
        // Apply padding for touch mode to make furniture easier to select
        const padding = this.touchModeEnabled ? this.touchHitAreaSize : 0;
        
        for (let i = this.furniture.length - 1; i >= 0; i--) {
            if (this.furniture[i].containsPoint(x, y, padding)) {
                return this.furniture[i];
            }
        }
        return null;
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault(); // Prevent scrolling when touching the canvas
        
        if (e.touches.length === 1) {
            // Single touch - convert to mouse event coordinates
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / this.zoom;
            const y = (touch.clientY - rect.top) / this.zoom;
            
            // Store the touch identifier for tracking this touch
            this.activeTouchId = touch.identifier;
            
            // Check if touch is on a furniture for potential long press
            const furniture = this.getFurnitureAtPosition(x, y);
            if (furniture) {
                this.longPressTimer = setTimeout(() => {
                    this.selectedFurniture = furniture;
                    this.rotateFurniture();
                    this.showTouchIndicator(touch.clientX, touch.clientY, 'rotate');
                    this.longPressTimer = null;
                }, this.longPressDuration);
            }
            
            // Reuse existing mouse handling logic
            this.startAction({
                clientX: touch.clientX, 
                clientY: touch.clientY
            });
        } else if (e.touches.length === 2) {
            // Clear any single-touch operations
            this.cancelTouchActions();
            
            // Two-finger gesture - initiate pinch-to-zoom
            this.isGesturing = true;
            this.lastTouchDistance = this.getTouchDistance(e.touches);
            this.gestureStartZoom = this.zoom;
            this.lastTwoTouchesPosition = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        
        // Cancel any long press in progress if finger moves
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (e.touches.length === 1 && !this.isGesturing) {
            // Single touch move
            const touch = e.touches[0];
            
            // Only process if this is the same touch that started the action
            if (touch.identifier === this.activeTouchId) {
                this.dragAction({
                    clientX: touch.clientX, 
                    clientY: touch.clientY
                });
            }
        } else if (e.touches.length === 2) {
            // Handle pinch zoom
            const currentDistance = this.getTouchDistance(e.touches);
            
            if (this.lastTouchDistance) {
                const scaleFactor = currentDistance / this.lastTouchDistance;
                
                const oldZoom = this.zoom;
                this.zoom = Math.min(
                    Math.max(
                        this.zoom * scaleFactor,
                        this.zoomMin
                    ),
                    this.zoomMax
                );
                
                if (oldZoom !== this.zoom) {
                    // Get center point of the two touches
                    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    
                    // Apply the zoom centered on touch points
                    this.zoomAtPoint(centerX, centerY, scaleFactor);
                }
            }
            
            this.lastTouchDistance = currentDistance;
            
            // Handle two-finger pan
            const currentCenter = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
            
            if (this.lastTwoTouchesPosition) {
                const deltaX = currentCenter.x - this.lastTwoTouchesPosition.x;
                const deltaY = currentCenter.y - this.lastTwoTouchesPosition.y;
                
                // Pan the canvas (adjust scroll position of the container)
                const container = this.canvas.parentElement;
                container.scrollLeft -= deltaX;
                container.scrollTop -= deltaY;
            }
            
            this.lastTwoTouchesPosition = currentCenter;
            this.redraw();
        }
    }

    handleTouchEnd(e) {
        // Cancel any long press in progress
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.isGesturing && e.touches.length < 2) {
            // End of pinch gesture
            this.isGesturing = false;
            this.lastTouchDistance = null;
            this.lastTwoTouchesPosition = null;
        } 
        
        if (e.touches.length === 0) {
            // All touches ended
            this.activeTouchId = null;
            this.finishAction(e);
        }
    }

    cancelTouchActions() {
        // Cancel any long press in progress
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Clear drawing or dragging states
        this.drawing = false;
        this.dragging = false;
        this.currentLine = null;
    }

    // Helper methods for touch handling
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    zoomAtPoint(clientX, clientY, scaleFactor) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        
        const container = this.canvas.parentElement;
        
        // Calculate the world coordinates before zoom
        const worldX = container.scrollLeft + mouseX;
        const worldY = container.scrollTop + mouseY;
        
        // Apply new scroll position to keep the point under the finger fixed
        container.scrollLeft = worldX * scaleFactor - mouseX;
        container.scrollTop = worldY * scaleFactor - mouseY;
    }

    showTouchIndicator(x, y, type = 'default') {
        // Create or reuse touch indicator element
        let indicator = document.getElementById('touchIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'touchIndicator';
            document.body.appendChild(indicator);
        }
        
        // Position and style based on type
        indicator.style.left = `${x}px`;
        indicator.style.top = `${y}px`;
        indicator.className = `touch-indicator ${type}`;
        
        // Show briefly then fade out
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 300);
    }

    // Touch mode toggle functionality
    toggleTouchMode() {
        this.touchModeEnabled = !this.touchModeEnabled;
        
        if (this.touchModeEnabled) {
            // Increase hit area size for touch
            this.touchHitAreaSize = 20;
            this.canvas.classList.add('touch-mode');
            
            // Show touch mode confirmation
            this.showTouchIndicator(
                window.innerWidth / 2,
                window.innerHeight / 2,
                'default'
            );
        } else {
            // Restore default hit area size
            this.touchHitAreaSize = 5;
            this.canvas.classList.remove('touch-mode');
        }
        
        this.updateTouchModeUI();
        this.redraw();
    }
    
    updateTouchModeUI() {
        // Update touch mode button state
        const touchModeButton = document.getElementById('touchModeToggle');
        if (touchModeButton) {
            if (this.touchModeEnabled) {
                touchModeButton.classList.add('active');
            } else {
                touchModeButton.classList.remove('active');
            }
        }
    }
    
    // Use touch hit area size in erase operations
    removeLine(x, y) {
        const hitSize = this.touchModeEnabled ? this.touchHitAreaSize : 5;
        
        for (let i = this.lines.length - 1; i >= 0; i--) {
            const line = this.lines[i];
            const distance = Measurements.pointToLineDistance(
                x, y, line.x1, line.y1, line.x2, line.y2
            );
            if (distance < hitSize / this.zoom) {
                this.lines.splice(i, 1);
                this.redraw();
                break;
            }
        }
    }

    drawInstructions() {
        // Set text properties
        this.ctx.fillStyle = '#666';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Draw instructions in the center of the canvas
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const instructions = [
            "Draw Mode: Click and drag to draw measurement lines",
            "Erase Mode: Click on lines or furniture to remove them",
            "Add Furniture: Create and place furniture items",
            "Right-click or long-press furniture to rotate",
            "Use mouse wheel or pinch to zoom"
        ];
        
        // Add mobile specific instructions if touch mode is enabled
        if (this.touchModeEnabled) {
            instructions.push("Touch Mode is ON: Using larger hit areas");
            instructions.push("Two fingers: Pinch to zoom, drag to pan");
        }
        
        // Draw each line of instructions
        instructions.forEach((text, i) => {
            const y = centerY - (instructions.length * 20) / 2 + i * 24;
            this.ctx.fillText(text, centerX, y);
        });
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
