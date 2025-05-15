// Furniture class for managing furniture objects
class Furniture {
    constructor(name, width_cm, length_cm, color, x = 0, y = 0, rotation = 0) {
        this.name = name;
        this.width_cm = width_cm;
        this.length_cm = length_cm;
        this.color = color;
        this.x = x;  // in pixels
        this.y = y;  // in pixels
        this.rotation = rotation;  // 0 or 90 degrees
    }

    rotate() {
        this.rotation = (this.rotation + 90) % 180;
    }

    rotateDimensions() {
        [this.width_cm, this.length_cm] = [this.length_cm, this.width_cm];
    }

    getCorners(zoom = 1.0) {
        // Convert cm to pixels (65 pixels per meter, 100 cm per meter)
        const CM_PER_METER = 100;
        const PIXELS_PER_METER = 65;
        
        let width_px = (this.width_cm / CM_PER_METER) * PIXELS_PER_METER;
        let length_px = (this.length_cm / CM_PER_METER) * PIXELS_PER_METER;

        if (this.rotation === 90) {
            [width_px, length_px] = [length_px, width_px];
        }

        // Apply zoom
        const x = this.x * zoom;
        const y = this.y * zoom;
        width_px *= zoom;
        length_px *= zoom;

        return [
            { x: x, y: y },
            { x: x + width_px, y: y },
            { x: x + width_px, y: y + length_px },
            { x: x, y: y + length_px }
        ];
    }

    draw(ctx, zoom = 1.0, selected = false) {
        const corners = this.getCorners(zoom);

        // Draw filled rectangle
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        corners.forEach(corner => ctx.lineTo(corner.x, corner.y));
        ctx.closePath();
        
        // Fill with semi-transparent color
        ctx.fillStyle = this.color + '80';  // 50% transparency
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = selected ? 'blue' : 'black';
        ctx.lineWidth = selected ? 3 : 2;
        ctx.stroke();

        // Draw label
        const centerX = (corners[0].x + corners[2].x) / 2;
        const centerY = (corners[0].y + corners[2].y) / 2;
        
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw white background for text
        const text = `${this.name}\n${this.width_cm}x${this.length_cm}cm`;
        const lines = text.split('\n');
        const lineHeight = 16;
        const padding = 4;
        
        const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const textHeight = lines.length * lineHeight;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(
            centerX - textWidth/2 - padding,
            centerY - textHeight/2 - padding,
            textWidth + padding*2,
            textHeight + padding*2
        );

        // Draw text
        ctx.fillStyle = 'black';
        lines.forEach((line, i) => {
            const y = centerY - (lines.length - 1) * lineHeight/2 + i * lineHeight;
            ctx.fillText(line, centerX, y);
        });
    }

    containsPoint(x, y, padding = 0) {
        const corners = this.getCorners();
        const x1 = Math.min(corners[0].x, corners[2].x) - padding;
        const x2 = Math.max(corners[0].x, corners[2].x) + padding;
        const y1 = Math.min(corners[0].y, corners[2].y) - padding;
        const y2 = Math.max(corners[0].y, corners[2].y) + padding;
        
        return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    }
}
