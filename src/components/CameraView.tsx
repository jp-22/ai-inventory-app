import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "./ui/button";
import { Camera, X, Check } from "lucide-react";
import { Input } from "./ui/input";
import { countObjectsInImage } from "@/lib/gemini";

interface CameraViewProps {
  onCapture: (imageData: string, boundingBoxes: any[]) => void;
  onClose: () => void;
  objectType: string;
}

const CameraView = ({ onCapture, onClose, objectType }: CameraViewProps) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedCount, setDetectedCount] = useState<number>(0);
  const [boundingBoxes, setBoundingBoxes] = useState<any[]>([]);
  const [manualCount, setManualCount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const captureImage = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setIsProcessing(true);
        try {
          const base64Image = imageSrc.split(",")[1];
          const data = await countObjectsInImage(base64Image, objectType);
          if (data.count !== undefined) {
            setDetectedCount(data.count);
            setBoundingBoxes(data.boundingBoxes);
          } else {
            console.error("Error detecting objects:", data.error);
          }
        } catch (error) {
          console.error("API call failed:", error);
        } finally {
          setIsProcessing(false);
        }
      }
    }
  }, [webcamRef, objectType]);

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage.split(",")[1], boundingBoxes);
      onClose();
    }
  };

  const getBoundingBoxStyle = (box: any) => {
    if (!imageRef.current) return {};

    const img = imageRef.current;
    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;

    // The coordinates are now normalized (0-1), so we just multiply by display dimensions
    const scaledLeft = Math.round(box.x1 * displayWidth);
    const scaledTop = Math.round(box.y1 * displayHeight);
    const scaledWidth = Math.round((box.x2 - box.x1) * displayWidth);
    const scaledHeight = Math.round((box.y2 - box.y1) * displayHeight);

    return {
      position: "absolute" as const,
      left: `${scaledLeft}px`,
      top: `${scaledTop}px`,
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      border: "2px solid #ef4444",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      pointerEvents: "none",
      zIndex: 10,
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg max-w-2xl w-full mx-4 relative flex flex-col space-y-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="relative flex-1">
          <div
            ref={containerRef}
            className="relative h-[60vh] rounded-lg overflow-hidden bg-black"
          >
            {!capturedImage ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-contain"
                  videoConstraints={{
                    facingMode: "environment",
                    width: 960,
                    height: 960,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-green-400 rounded-lg w-1/2 h-1/2 opacity-50">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-400 text-white px-2 py-1 rounded text-sm">
                      {objectType}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative h-full flex items-center justify-center bg-black">
                <div
                  className="relative"
                  style={{ width: "fit-content", height: "fit-content" }}
                >
                  <img
                    ref={imageRef}
                    src={capturedImage}
                    className="max-h-[60vh] w-auto"
                    alt="Captured"
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      console.log("Image loaded dimensions:", {
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        displayWidth: img.width,
                        displayHeight: img.height,
                        clientWidth: img.clientWidth,
                        clientHeight: img.clientHeight,
                        boundingBoxes,
                      });
                      setBoundingBoxes([...boundingBoxes]);
                    }}
                  />
                  {boundingBoxes.map((box, index) => (
                    <div
                      key={index}
                      style={getBoundingBoxStyle(box)}
                      className="absolute border-2 border-red-500 bg-red-500/10"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Count overlay */}
          {capturedImage && (
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg z-10">
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
          )}
        </div>

        <div className="flex justify-center gap-2">
          {!capturedImage ? (
            <Button
              onClick={captureImage}
              className="bg-white text-black hover:bg-gray-100"
              disabled={isProcessing}
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" /> Capture {objectType}
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setCapturedImage(null)}>
                Retake
              </Button>
              <Button onClick={confirmCapture}>
                <Check className="h-4 w-4 mr-2" />
                Confirm Count
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraView;
