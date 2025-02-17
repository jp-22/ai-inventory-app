import React, { useState, useRef } from "react";
import CameraView from "./CameraView";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Plus,
  Minus,
  Camera,
  Loader2,
  Upload,
  AlertCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "./ui/input";
import { useToast } from "@/components/ui/use-toast";
import { countObjectsInImage } from "@/lib/gemini"; // Your path to the API call

const InventoryCard = ({
  productName = "Sample Product",
  sku = "SKU123456",
  count = 0,
  isCounted = false,
  onIncrement = () => {},
  onDecrement = () => {},
  onSetCount = () => {},
}: any) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCapture = async (base64Image: string, boundingBoxes: any[]) => {
    setIsProcessing(true);
    try {
      // Send image and bounding box data to Gemini API
      const data = await countObjectsInImage(base64Image, productName);
      if (data.count !== undefined) {
        onSetCount(data.count);
        toast({
          title: "Count updated!",
          description: `Detected: ${data.count}`,
        });
      } else {
        setError(data.error);
        setShowErrorDialog(true);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setError("Error detecting objects");
      setShowErrorDialog(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <h3>{productName}</h3>
          <p>SKU: {sku}</p>

          <div className="flex items-center justify-between">
            <Button onClick={onDecrement} disabled={count === 0}>
              <Minus />
            </Button>
            <span>{count}</span>
            <Button onClick={onIncrement}>
              <Plus />
            </Button>
            <Button onClick={() => setShowCamera(true)} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin" /> : <Camera />}
            </Button>
          </div>

          <Input ref={fileInputRef} type="file" className="hidden" />
        </CardContent>
      </Card>

      {showCamera && (
        <CameraView
          objectType={productName}
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <AlertCircle /> Error
            </AlertDialogTitle>
            <p>{error}</p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InventoryCard;
