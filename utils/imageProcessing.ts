import { Point, BoundingBox } from '../types';

// Module 1: Cloud Segmentation Logic
// Bright White Pixels (> Threshold) -> Storm Potential
export const processSatelliteImage = (
  file: File
): Promise<{
  processedDataUrl: string;
  centroid: Point | null;
  boundingBox: BoundingBox | null;
  area: number;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Canvas context not available');
        return;
      }

      // Resize for performance consistency, maintain aspect ratio
      const maxWidth = 500;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let totalX = 0;
      let totalY = 0;
      let whitePixelCount = 0;
      let minX = canvas.width;
      let maxX = 0;
      let minY = canvas.height;
      let maxY = 0;

      // Thresholding Logic (Grey/Dark vs Bright White)
      // High brightness in IR = Cold Clouds
      const THRESHOLD = 180; // Out of 255. Adjustable.

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Simple luminance calculation or just check average brightness
        const brightness = (r + g + b) / 3;

        if (brightness > THRESHOLD) {
          // It's a "Bright White" pixel - Keep it (Visualize as Cyan for tracking)
          // Using Cyan (0, 255, 255) to highlight the detected area clearly against B/W
          data[i] = 0;     // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
          // Alpha stays 255

          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);

          totalX += x;
          totalY += y;
          whitePixelCount++;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

        } else {
          // Darken the rest to emphasize the storm
          data[i] = r * 0.3;
          data[i + 1] = g * 0.3;
          data[i + 2] = b * 0.3;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      let centroid: Point | null = null;
      let boundingBox: BoundingBox | null = null;

      if (whitePixelCount > 0) {
        centroid = {
          x: totalX / whitePixelCount,
          y: totalY / whitePixelCount,
        };

        boundingBox = {
          minX,
          minY,
          maxX,
          maxY
        };

        // Draw visuals on the canvas for the "Processed" view
        ctx.strokeStyle = '#ef4444'; // Red bounding box
        ctx.lineWidth = 2;
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        ctx.fillStyle = '#facc15'; // Yellow centroid
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      resolve({
        processedDataUrl: canvas.toDataURL(),
        centroid,
        boundingBox,
        area: whitePixelCount
      });
      
      URL.revokeObjectURL(url);
    };

    img.onerror = (err) => reject(err);
  });
};

export const extrapolatePosition = (
  p1: Point, // T0
  p2: Point, // T30
  p3: Point  // T60
): Point => {
  // Simple Linear Extrapolation based on the last vector (T30 -> T60)
  // Or average velocity. Let's use the trend from T30 to T60 for the T90 prediction.
  
  const dx = p3.x - p2.x;
  const dy = p3.y - p2.y;

  return {
    x: p3.x + dx,
    y: p3.y + dy
  };
};

// Calculate approximate speed (Pixels per hour, effectively)
export const calculateSpeed = (p1: Point, p2: Point): number => {
    const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    // Assuming 30 min interval. Speed = Distance / 0.5 hours = Distance * 2
    return dist * 2; 
};
