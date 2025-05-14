# Floor Planner

A web-based floor planning application that allows users to create and manipulate floor plans with measurements and furniture placement.

## Features

- **Drawing Tools**: Draw and erase lines with real-time measurements in meters
- **Furniture Management**: 
  - Add furniture with custom dimensions
  - Drag and drop furniture placement
  - Rotate furniture position (right-click)
  - Rotate furniture dimensions (swap width/length)
  - Custom furniture colors
- **Measurement System**: 
  - Automatic conversion between pixels and real-world measurements
  - Visual measurement display on lines
- **Interactive Canvas**:
  - Zoom in/out functionality
  - Pan around the canvas
  - Background plan image support
- **Responsive Design**: Adapts to different screen sizes

## Usage

1. **Drawing Mode**:
   - Click and drag to draw measurement lines
   - Measurements are shown in pixels and meters
   - Use the erase mode to remove lines

2. **Furniture Management**:
   - Click "Add Furniture" to create new furniture
   - Enter name, dimensions (in cm), and select color
   - Drag furniture to position
   - Right-click to rotate furniture's position 90 degrees
   - Click "Rotate Dimensions" to swap width and length
   - Use "Remove Furniture" to delete selected items

3. **Canvas Controls**:
   - Mouse wheel to zoom in/out
   - Click and drag furniture to move
   - Clear All button to reset the canvas

## Technical Details

The application is built using vanilla JavaScript with an object-oriented approach:

- `FloorPlanner`: Main application class handling canvas setup and user interactions
- `Furniture`: Class for managing furniture objects with dimensions and placement
- `Measurements`: Utility class for handling measurements and distance calculations

### Constants

- Pixels per meter: 65
- Centimeters per meter: 100
- Zoom range: 0.1x to 5.0x

## Project Structure

```
/
├── index.html           # Main HTML file
├── css/
│   └── styles.css      # Application styles
├── js/
│   ├── app.js          # Main application logic
│   ├── furniture.js    # Furniture class implementation
│   └── measurements.js # Measurement utilities
└── img/
    └── plan.jpg        # Background plan image
```

## License

See the LICENSE file for details.
