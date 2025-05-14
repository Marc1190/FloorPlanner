// Measurements utilities
const Measurements = {
    drawLine(ctx, line, zoom = 1.0, PIXELS_PER_METER = 65) {
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(line.x1 * zoom, line.y1 * zoom);
        ctx.lineTo(line.x2 * zoom, line.y2 * zoom);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Calculate center point for text
        const centerX = (line.x1 * zoom + line.x2 * zoom) / 2;
        const centerY = (line.y1 * zoom + line.y2 * zoom) / 2;

        // Calculate line length
        const length_px = Math.sqrt(
            Math.pow((line.x2 - line.x1), 2) +
            Math.pow((line.y2 - line.y1), 2)
        );
        const length_m = length_px / PIXELS_PER_METER;
        const text = `${length_px.toFixed(1)}px (${length_m.toFixed(2)}m)`;

        // Draw text background
        ctx.font = '12px Arial';
        const metrics = ctx.measureText(text);
        const padding = 4;

        ctx.fillStyle = 'white';
        ctx.fillRect(
            centerX - metrics.width/2 - padding,
            centerY - 8 - padding,
            metrics.width + padding*2,
            16 + padding*2
        );

        // Draw text
        ctx.fillStyle = 'blue';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, centerX, centerY);
    },

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        // Calculate distance from point (px,py) to line segment (x1,y1)-(x2,y2)
        const lineLength = this.getDistance(x1, y1, x2, y2);
        if (lineLength === 0) {
            return this.getDistance(px, py, x1, y1);
        }
        
        // Calculate normalized projection
        const t = Math.max(0, Math.min(1, 
            ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength * lineLength)
        ));
        
        // Get point on line closest to (px,py)
        const projectionX = x1 + t * (x2 - x1);
        const projectionY = y1 + t * (y2 - y1);
        
        // Return distance to that point
        return this.getDistance(px, py, projectionX, projectionY);
    },

    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
};
