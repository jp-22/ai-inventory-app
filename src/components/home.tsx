import React, { useState } from "react";
import SearchBar from "./SearchBar";
import InventoryGrid from "./InventoryGrid";
import TotalCounter from "./TotalCounter";

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  count: number;
  isCounted: boolean;
}

interface HomeProps {
  initialItems?: InventoryItem[];
}

const Home = ({
  initialItems = [
    {
      id: "1",
      productName: "Wireless Mouse",
      sku: "WM001",
      count: 0,
      isCounted: false,
    },
    {
      id: "2",
      productName: "Mechanical Keyboard",
      sku: "KB002",
      count: 5,
      isCounted: true,
    },
    {
      id: "3",
      productName: "USB-C Cable",
      sku: "USB003",
      count: 0,
      isCounted: false,
    },
    {
      id: "4",
      productName: "Monitor Stand",
      sku: "MS004",
      count: 2,
      isCounted: true,
    },
    {
      id: "5",
      productName: "Water Bottle",
      sku: "WB005",
      count: 0,
      isCounted: false,
    },
  ],
}: HomeProps) => {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [filteredItems, setFilteredItems] =
    useState<InventoryItem[]>(initialItems);

  const handleSearch = (query: string) => {
    const filtered = items.filter(
      (item) =>
        item.productName.toLowerCase().includes(query.toLowerCase()) ||
        item.sku.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredItems(filtered);
  };

  const handleItemUpdate = (id: string, newCount: number) => {
    const updatedItems = items.map((item) =>
      item.id === id
        ? { ...item, count: newCount, isCounted: newCount > 0 }
        : item,
    );
    setItems(updatedItems);
    setFilteredItems(
      filteredItems.map((item) =>
        item.id === id
          ? { ...item, count: newCount, isCounted: newCount > 0 }
          : item,
      ),
    );
  };

  const totalItems = items.length;
  const countedItems = items.filter((item) => item.isCounted).length;

  const handleSave = () => {
    console.log("Saving progress...", items);
  };

  const handleExport = () => {
    const csvContent = [
      ["Product Name", "SKU", "Count", "Status"].join(","),
      ...items.map((item) =>
        [
          item.productName,
          item.sku,
          item.count,
          item.isCounted ? "Counted" : "Not Counted",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_count.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <SearchBar onSearch={handleSearch} />
      <div className="flex-1 pb-20">
        <InventoryGrid items={filteredItems} onItemUpdate={handleItemUpdate} />
      </div>
      <TotalCounter
        totalItems={totalItems}
        countedItems={countedItems}
        onSave={handleSave}
        onExport={handleExport}
      />
    </div>
  );
};

export default Home;
