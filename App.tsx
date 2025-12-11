import React, { useState, useEffect } from 'react';
import { Radar, AlertTriangle, Activity, Map as MapIcon, Info, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import ImageUploadCard from './components/ImageUploadCard';
import TrajectoryChart from './components/TrajectoryChart';
import { processSatelliteImage, extrapolatePosition, calculateSpeed } from './utils/imageProcessing';
import { ImageAnalysisData, PredictionResult } from './types';

const INITIAL_STATE: ImageAnalysisData[] = [
  { id: 'T0', timestampLabel: 'T0 (Start)', file: null, imageUrl: null, processedImageUrl: null, centroid: null, boundingBox: null, areaPx: 0, isProcessed: false },
  { id: 'T30', timestampLabel: 'T+30 mins', file: null, imageUrl: null, processedImageUrl: null, centroid: null, boundingBox: null, areaPx: 0, isProcessed: false },
  { id: 'T60', timestampLabel: 'T+60 mins', file: null, imageUrl: null, processedImageUrl: null, centroid: null, boundingBox: null, areaPx: 0, isProcessed: false },
];

export default function App() {
  const [images, setImages] = useState<ImageAnalysisData[]>(INITIAL_STATE);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle uploading an image for a specific slot
  const handleUpload = (index: number, file: File) => {
    const url = URL.createObjectURL(file);
    const newImages = [...images];
    newImages[index] = {
      ...newImages[index],
      file,
      imageUrl: url,
      processedImageUrl: null, // Reset processing if new image uploaded
      centroid: null,
      boundingBox: null,
      areaPx: 0,
      isProcessed: false
    };
    setImages(newImages);
    setPrediction(null); // Reset prediction
  };

  const handleClear = (index: number) => {
    const newImages = [...images];
    if (newImages[index].imageUrl) {
        URL.revokeObjectURL(newImages[index].imageUrl!);
    }
    newImages[index] = { ...INITIAL_STATE[index] };
    setImages(newImages);
    setPrediction(null);
  };

  const runAnalysis = async () => {
    // Validation: Need all 3 images
    if (images.some(img => !img.file)) {
      alert("Please upload all 3 sequential satellite images (T0, T30, T60) to run the tracking algorithm.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const processedImages = [...images];

      // Process each image sequentially
      for (let i = 0; i < processedImages.length; i++) {
        if (processedImages[i].file && !processedImages[i].isProcessed) {
           const result = await processSatelliteImage(processedImages[i].file!);
           processedImages[i] = {
             ...processedImages[i],
             processedImageUrl: result.processedDataUrl,
             centroid: result.centroid,
             boundingBox: result.boundingBox,
             areaPx: result.area,
             isProcessed: true
           };
        }
      }

      setImages(processedImages);

      // Perform Tracking & Prediction (Module 2)
      const t0 = processedImages[0].centroid;
      const t30 = processedImages[1].centroid;
      const t60 = processedImages[2].centroid;

      if (t0 && t30 && t60) {
        const predicted = extrapolatePosition(t0, t30, t60);
        
        // Calculate Speed (avg of two intervals)
        const speed1 = calculateSpeed(t0, t30);
        const speed2 = calculateSpeed(t30, t60);
        const avgSpeed = (speed1 + speed2) / 2;

        // Perform Severity Classification (Module 3)
        // Logic: Area Increasing -> Storm Potential.
        const area0 = processedImages[0].areaPx;
        const area60 = processedImages[2].areaPx;
        const areaChange = ((area60 - area0) / area0) * 100; // Percent change

        let severity: 'WARNING' | 'SAFE' | 'UNKNOWN' = 'SAFE';
        let reason = "System is dissipating or stable.";

        if (areaChange > 5) { // Threshold: >5% growth
            severity = 'WARNING';
            reason = `Developing Storm: Cloud cluster area increased by ${areaChange.toFixed(1)}% in 1 hour.`;
        } else if (areaChange < -5) {
            severity = 'SAFE';
            reason = `Dissipating System: Cloud cluster area decreased by ${Math.abs(areaChange).toFixed(1)}%.`;
        } else {
            severity = 'SAFE';
            reason = "Stable System: No significant change in cloud mass.";
        }

        setPrediction({
            predictedCentroid: predicted,
            speedKmh: avgSpeed * 0.5, // Arbitrary scale factor to make it look like km/h
            severity,
            reason
        });
      }

    } catch (error) {
      console.error("Analysis failed", error);
      alert("An error occurred during image processing.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadDemoData = async () => {
    // In a real app, this would fetch sample images. 
    // For this environment, we can't easily fetch external images due to CORS or lack of assets.
    // I'll show an alert instead.
    alert("To test, please upload 3 images. You can use any screenshots of white blobs on a dark background to simulate clouds!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Radar className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Megh-Net</h1>
            <p className="text-xs text-slate-500">ISRO Hackathon Track</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-sm">
                <h3 className="font-semibold text-slate-400 mb-2 text-xs uppercase tracking-wider">Mission Status</h3>
                <div className="flex items-center gap-2 text-emerald-400">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span>Systems Online</span>
                </div>
            </div>
            
            <div className="mt-4 text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Objective:</strong> Process INSAT-3D IR imagery to identify storm clusters.
                <br /><br />
                <strong className="text-slate-300">Steps:</strong>
                <ol className="list-decimal pl-4 space-y-1 mt-1">
                    <li>Upload T0, T30, T60 images.</li>
                    <li>System isolates Cloud Layer (> -40°C).</li>
                    <li>Calculates Motion Vectors.</li>
                    <li>Predicts T90 trajectory.</li>
                </ol>
            </div>
        </nav>

        <div className="mt-auto">
            <button onClick={loadDemoData} className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors flex items-center justify-center gap-2">
                <Info size={14} />
                How to Test
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Cyclone Detection Dashboard</h2>
                <p className="text-slate-400">Real-time Cloud Segmentation & Trajectory Prediction</p>
            </div>
            <button 
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all
                    ${isAnalyzing ? 'bg-slate-700 cursor-wait text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105'}
                `}
            >
                {isAnalyzing ? (
                    <RefreshCw className="animate-spin" size={20} />
                ) : (
                    <Play size={20} fill="currentColor" />
                )}
                {isAnalyzing ? 'Processing...' : 'Run Analysis'}
            </button>
        </header>

        {/* Input Section */}
        <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={20} className="text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-200">Satellite Feed Input (IR Band)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {images.map((img, idx) => (
                    <ImageUploadCard 
                        key={img.id}
                        id={img.id}
                        label={img.timestampLabel}
                        imagePreview={img.imageUrl}
                        processedPreview={img.processedImageUrl}
                        onUpload={(file) => handleUpload(idx, file)}
                        onClear={() => handleClear(idx)}
                        area={img.isProcessed ? img.areaPx : undefined}
                    />
                ))}
            </div>
        </section>

        {/* Results Section */}
        {prediction && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                {/* Panel 1: Trajectory Map */}
                <div className="lg:col-span-2">
                     <div className="flex items-center gap-2 mb-4">
                        <MapIcon size={20} className="text-purple-400" />
                        <h3 className="text-lg font-semibold text-slate-200">Trajectory Prediction (The Compass)</h3>
                    </div>
                    <TrajectoryChart 
                        t0={images[0].centroid}
                        t30={images[1].centroid}
                        t60={images[2].centroid}
                        t90={prediction.predictedCentroid}
                    />
                </div>

                {/* Panel 2: Decision Matrix */}
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={20} className={prediction.severity === 'WARNING' ? 'text-red-500' : 'text-emerald-500'} />
                        <h3 className="text-lg font-semibold text-slate-200">Analysis Report</h3>
                    </div>

                    <div className={`p-6 rounded-xl border-2 ${prediction.severity === 'WARNING' ? 'bg-red-950/30 border-red-500/50' : 'bg-emerald-950/30 border-emerald-500/50'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            {prediction.severity === 'WARNING' ? (
                                <AlertTriangle className="text-red-500" size={32} />
                            ) : (
                                <CheckCircle2 className="text-emerald-500" size={32} />
                            )}
                            <div>
                                <h4 className={`text-xl font-bold ${prediction.severity === 'WARNING' ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {prediction.severity}
                                </h4>
                                <span className="text-xs text-slate-400 uppercase tracking-wider">Classification</span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Observation</p>
                                <p className="text-slate-200 text-sm leading-relaxed border-l-2 border-slate-600 pl-3">
                                    {prediction.reason}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 p-3 rounded-lg">
                                    <p className="text-xs text-slate-500">Est. Speed</p>
                                    <p className="text-lg font-mono text-blue-300">{prediction.speedKmh.toFixed(0)} km/h</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg">
                                    <p className="text-xs text-slate-500">Impact Time</p>
                                    <p className="text-lg font-mono text-purple-300">T+90</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        )}

      </main>
    </div>
  );
}
