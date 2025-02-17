import React, { useRef, useState } from "react";
import CameraView from "./CameraView";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Plus,
  Minus,
  Camera,
  Loader2,
  AlertCircle,
  X,
  Upload,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "./ui/input";

interface InventoryCardProps {
  productName?: string;
  sku?: string;
  count?: number;
  isCounted?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onSetCount?: (count: number) => void;
  objectType?: string;
}

const InventoryCard = ({
  productName = "Sample Product",
  sku = "SKU123456",
  count = 0,
  isCounted = false,
  onIncrement = () => {},
  onDecrement = () => {},
  onSetCount = () => {},
  objectType = "",
}: InventoryCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  return (
    <>
      <Card className="w-[360px] h-[200px] bg-white hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex flex-col h-full justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {productName}
              </h3>
              <Badge
                variant={isCounted ? "default" : "secondary"}
                className={`${isCounted ? "bg-green-500" : "bg-gray-200"}`}
              >
                {isCounted ? "Counted" : "Not Counted"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">SKU: {sku}</p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onDecrement}
              className="h-10 w-10"
              disabled={count === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>

            <span className="text-2xl font-bold text-gray-900">{count}</span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onIncrement}
                className="h-10 w-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCamera(true)}
                  className="h-10 w-10"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10"
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setIsProcessing(true);
                  try {
                    // Convert image to base64
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = async () => {
                      const base64Image = reader.result
                        ?.toString()
                        .split(",")[1];

                      const { countObjectsInImage } = await import(
                        "@/lib/gemini"
                      );
                      console.log("Sending image to Gemini for", productName);
                      const data = await countObjectsInImage(
                        base64Image,
                        productName.toLowerCase(),
                      );
                      console.log("Gemini API Response:", data);

                      if (data.count !== undefined) {
                        onSetCount(data.count);
                        setError("");
                      } else if (data.error) {
                        setError(data.error);
                        setShowErrorDialog(true);
                        console.error("API Error:", data.error);
                      }
                      setIsProcessing(false);
                    };
                  } catch (error) {
                    console.error("Error processing image:", error);
                  } finally {
                    setIsProcessing(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Detecting Objects
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {error}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showCamera && (
        <CameraView
          onCapture={async (base64Image) => {
            setShowCamera(false);
            setIsProcessing(true);
            try {
              const { countObjectsInImage } = await import("@/lib/gemini");
              console.log("Sending image to Gemini for", productName);
              const data = await countObjectsInImage(
                base64Image,
                productName.toLowerCase(),
              );
              console.log("Gemini API Response:", data);

              if (data.count !== undefined) {
                onSetCount(data.count);
                setError("");
              } else if (data.error) {
                setError(data.error);
                setShowErrorDialog(true);
                console.error("API Error:", data.error);
              }
            } catch (error) {
              console.error("Error processing image:", error);
            } finally {
              setIsProcessing(false);
            }
          }}
          onClose={() => {
            setShowCamera(false);
            setIsProcessing(false);
          }}
          objectType={productName}
        />
      )}
    </>
  );
};

export default InventoryCard;
