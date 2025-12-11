import React from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadCardProps {
  id: string;
  label: string;
  imagePreview: string | null;
  processedPreview: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  area?: number;
}

const ImageUploadCard: React.FC<ImageUploadCardProps> = ({ 
  id, 
  label, 
  imagePreview, 
  processedPreview,
  onUpload, 
  onClear,
  area
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm text-slate-300">{label}</span>
        {area !== undefined && area > 0 && (
            <span className="text-xs text-emerald-400 font-mono">Area: {area.toLocaleString()} px</span>
        )}
      </div>
      
      <div className="relative group w-full aspect-square bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg overflow-hidden hover:border-blue-500 transition-colors">
        {processedPreview ? (
             <img src={processedPreview} alt={`${label} processed`} className="w-full h-full object-cover" />
        ) : imagePreview ? (
            <img src={imagePreview} alt={`${label} raw`} className="w-full h-full object-cover opacity-60 grayscale" />
        ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
            <Upload size={24} className="mb-2" />
            <span className="text-xs">Upload IR Image</span>
            </div>
        )}

        <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={!!processedPreview}
        />

        {(imagePreview || processedPreview) && (
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    onClear();
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors"
            >
                <X size={14} />
            </button>
        )}
      </div>
    </div>
  );
};

export default ImageUploadCard;
