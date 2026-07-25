import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import getCroppedImg from '@/utils/cropImage';

const AvatarCropModal = ({ imageSrc, onComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onComplete(croppedFile);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Adjust Avatar</h3>
          <button 
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative h-[300px] w-full bg-black/50 sm:h-[400px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ZoomOut className="h-4 w-4 text-slate-400" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <ZoomIn className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-4">
              <RotateCw className="h-4 w-4 text-slate-400" />
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs font-mono text-slate-400 w-8">{rotation}°</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-500 flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:bg-blue-600/50 transition-all"
            >
              {isProcessing ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save Avatar
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AvatarCropModal;
