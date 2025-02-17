import React from "react";
import InventoryCard from "./InventoryCard";

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  count: number;
  isCounted: boolean;
}

interface InventoryGridProps {
  items?: InventoryItem[];
  onItemUpdate?: (id: string, newCount: number) => void;
}

const InventoryGrid = ({
  items = [
    {
      id: "1",
      productName: "Sample Product 1",
      sku: "SKU001",
      count: 0,
      isCounted: false,
    },
    {
      id: "2",
      productName: "Sample Product 2",
      sku: "SKU002",
      count: 5,
      isCounted: true,
    },
    {
      id: "3",
      productName: "Sample Product 3",
      sku: "SKU003",
      count: 0,
      isCounted: false,
    },
  ],
  onItemUpdate = () => {},
}: InventoryGridProps) => {
  return (
    <div className="w-full min-h-[822px] bg-gray-50 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
        {items.map((item) => (
          <InventoryCard
            key={item.id}
            productName={item.productName}
            sku={item.sku}
            count={item.count}
            isCounted={item.isCounted}
            onIncrement={() => onItemUpdate(item.id, item.count + 1)}
            onDecrement={() =>
              onItemUpdate(item.id, Math.max(0, item.count - 1))
            }
            onSetCount={(count) => onItemUpdate(item.id, count)}
            objectType={item.productName}
          />
        ))}
      </div>
    </div>
  );
};

export default InventoryGrid;
