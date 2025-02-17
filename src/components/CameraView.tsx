import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Button } from "./ui/button";
import { Camera, X, Check } from "lucide-react";
import { Input } from "./ui/input";
import { countObjectsInImage } from "@/lib/gemini"; // Import the API call

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

  const captureImage = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);

        // Call the API immediately after image capture
        setIsProcessing(true);
        try {
          const base64Image = imageSrc.split(",")[1]; // Extract base64 data from the image src
          const data = await countObjectsInImage(base64Image, objectType);
          console.log(data, "datatatatatattatt");
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
      const finalCount = manualCount ? parseInt(manualCount) : detectedCount;

      // Send image data and bounding box to parent
      onCapture(capturedImage.split(",")[1], boundingBoxes);

      // Close the camera
      onClose();
    }
  };

  // Utility function to directly position bounding boxes relative to the image
  const getBoundingBoxStyle = (box: any) => {
    // Since bounding box coordinates are now relative to the image,
    // you can directly apply them as a percentage of the image's width and height.
    const style = {
      top: `${box.y1}px`, // Using percentage-based positioning
      left: `${box.x1}px`,
      width: `${box.x2 - box.x1}px`, // Using the width as percentage of the image
      height: `${box.y2 - box.y1}px`, // Using the height as percentage of the image
      border: "2px solid red",
      position: "absolute",
    };

    return style;
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
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            {!capturedImage ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{ facingMode: "environment" }}
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
              <div className="relative">
                <img
                  ref={imageRef}
                  src={capturedImage}
                  className="w-full h-full object-cover"
                />
                {/* Overlay bounding boxes on the image */}
                {boundingBoxes.map((box, index) => (
                  <div
                    key={index}
                    className="absolute"
                    style={getBoundingBoxStyle(box)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional fields */}
        <div className="space-y-4">
          {!capturedImage ? (
            <div className="flex justify-center">
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
