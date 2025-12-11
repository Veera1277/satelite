export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ImageAnalysisData {
  id: string; // 'T0', 'T30', 'T60'
  timestampLabel: string;
  file: File | null;
  imageUrl: string | null;
  processedImageUrl: string | null;
  centroid: Point | null;
  boundingBox: BoundingBox | null;
  areaPx: number;
  isProcessed: boolean;
}

export interface PredictionResult {
  predictedCentroid: Point;
  speedKmh: number; // Simulated based on pixel displacement
  severity: 'WARNING' | 'SAFE' | 'UNKNOWN';
  reason: string;
}
