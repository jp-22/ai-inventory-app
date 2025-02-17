import React from "react";
import { Button } from "./ui/button";
import { Save, Download } from "lucide-react";

interface TotalCounterProps {
  totalItems?: number;
  countedItems?: number;
  onSave?: () => void;
  onExport?: () => void;
}

const TotalCounter = ({
  totalItems = 100,
  countedItems = 0,
  onSave = () => {},
  onExport = () => {},
}: TotalCounterProps) => {
  const progress = ((countedItems / totalItems) * 100).toFixed(1);

  return (
    <div className="w-full h-20 bg-white border-t border-gray-200 fixed bottom-0 left-0 px-6 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Total Items</span>
          <span className="text-xl font-bold">{totalItems}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Items Counted</span>
          <span className="text-xl font-bold">{countedItems}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Progress</span>
          <span className="text-xl font-bold text-green-600">{progress}%</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onSave}
        >
          <Save className="h-4 w-4" />
          Save Progress
        </Button>
        <Button className="flex items-center gap-2" onClick={onExport}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
};

export default TotalCounter;
