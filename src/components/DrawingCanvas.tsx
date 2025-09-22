import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { 
  Brush, 
  Eraser, 
  Palette, 
  RotateCcw, 
  Save, 
  X, 
  Circle, 
  Square, 
  Type,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import { Language, t } from '../utils/translations';

interface DrawingCanvasProps {
  initialImage?: string | null;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  language: Language;
}

type Tool = 'brush' | 'eraser' | 'circle' | 'rectangle' | 'text';

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
];

export function DrawingCanvas({ initialImage, onSave, onCancel, language }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState([5]);
  const [color, setColor] = useState('#000000');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(0.5);
  const [lastPoint, setLastPoint] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - 750x1590px for consistent design dimensions
    canvas.width = 750;
    canvas.height = 1590;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load initial image if provided
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        saveToHistory();
      };
      img.src = initialImage;
    } else {
      saveToHistory();
    }
  }, [initialImage]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setHistoryIndex(historyIndex - 1);
      ctx.putImageData(history[historyIndex - 1], 0, 0);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    setLastPoint(coords);

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize[0];
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize[0];
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !lastPoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }

    setLastPoint(coords);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPoint(null);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          saveToHistory();
        }
      }
    }
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.2));
  };

  const resetZoom = () => {
    setZoom(0.5);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'phone-case-design.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full p-6">
      {/* Tools Panel */}
      <Card className="w-full lg:w-80 shrink-0">
        <CardContent className="p-4 space-y-4">
          {/* Tool Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{t(language, 'tools')}</Label>
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
              <Button
                variant={tool === 'brush' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('brush')}
                className="flex items-center gap-1"
              >
                <Brush className="w-3 h-3" />
                <span className="hidden sm:inline">{t(language, 'brush')}</span>
              </Button>
              <Button
                variant={tool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('eraser')}
                className="flex items-center gap-1"
              >
                <Eraser className="w-3 h-3" />
                <span className="hidden sm:inline">{t(language, 'eraser')}</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Zoom Controls */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {language === 'lv' ? 'Tālummaiņa' : 'Zoom'}: {Math.round(zoom * 100)}%
            </Label>
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= 0.2}
                className="flex items-center gap-1"
              >
                <ZoomOut className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetZoom}
                className="flex items-center gap-1"
              >
                <Maximize className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= 3}
                className="flex items-center gap-1"
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Brush Size */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {t(language, 'brushSize')}: {brushSize[0]}px
            </Label>
            <Slider
              value={brushSize}
              onValueChange={setBrushSize}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Color Picker */}
          <div>
            <Label className="text-sm font-medium mb-2 block">{t(language, 'colors')}</Label>
            <div className="grid grid-cols-5 lg:grid-cols-5 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded border-2 ${
                    color === c ? 'border-primary' : 'border-border'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full mt-2 h-6 sm:h-8 rounded border border-border"
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="w-full flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              {language === 'lv' ? 'Atsaukt' : 'Undo'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              className="w-full"
            >
              {t(language, 'clear')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCanvas}
              className="w-full flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              {language === 'lv' ? 'Lejupielādēt' : 'Download'}
            </Button>
          </div>

          <Separator />

          {/* Save/Cancel */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleSave}
              className="w-full flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              {t(language, 'save')}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              {t(language, 'cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-auto p-4">
        <div 
          ref={containerRef}
          className="border border-border rounded-lg p-1 bg-white shadow-lg max-w-full max-h-full"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="border border-border rounded cursor-crosshair"
            style={{ 
              width: '500px',
              height: '1060px',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
}