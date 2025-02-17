import React, { useRef, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Camera, X, Check } from "lucide-react";
import { Input } from "./ui/input";

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  objectType: string;
}

const CameraView = ({ onCapture, onClose, objectType }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedCount, setDetectedCount] = useState<number>(0);
  const [manualCount, setManualCount] = useState<string>("");

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        setCapturedImage(imageData);
        // Simulate initial detection count
        setDetectedCount(Math.floor(Math.random() * 5) + 1);
      }
    }
  };

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    } else {
      stopStream();
    }
  }, [capturedImage]);

  const confirmCapture = () => {
    if (capturedImage) {
      const finalCount = manualCount ? parseInt(manualCount) : detectedCount;
      onCapture(capturedImage.split(",")[1]);
      stopStream();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg max-w-2xl w-full mx-4 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="space-y-4">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-white opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-green-400 rounded-lg w-1/2 h-1/2 opacity-50">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-400 text-white px-2 py-1 rounded text-sm">
                      {objectType}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <img src={capturedImage} className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {!capturedImage ? (
            <div className="flex justify-center">
              <Button
                onClick={captureImage}
                className="bg-white text-black hover:bg-gray-100"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture {objectType}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">AI Detected Count</p>
                  <p className="text-2xl font-bold">{detectedCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Manual Count</p>
                  <Input
                    type="number"
                    value={manualCount}
                    onChange={(e) => setManualCount(e.target.value)}
                    className="w-24"
                    min="0"
                    placeholder={detectedCount.toString()}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCapturedImage(null)}
                >
                  Retake
                </Button>
                <Button onClick={confirmCapture}>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Count
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraView;
