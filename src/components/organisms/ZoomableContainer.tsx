import { Button } from "@nextui-org/react";
import React, { ReactNode, useEffect, useRef, useState } from "react";

interface ZoomableContainerProps<T> {
  data: T[];
  children: (displayData: T[]) => ReactNode;
  onSelectionStart?: (label: string) => void;
  onSelectionMove?: (label: string) => void;
  onSelectionEnd?: () => void;
}

export function ZoomableContainer<T>({
  data,
  children,
}: ZoomableContainerProps<T>) {
  const [startIndex, setStartIndex] = useState<number>(0);
  const [endIndex, setEndIndex] = useState<number>(data.length - 1);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEndIndex(data.length - 1);
  }, [data]);

  const handleZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!chartRef.current) return;

    const zoomFactor = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    const chartRect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - chartRect.left;
    const percentage = mouseX / chartRect.width;

    const currentRange = endIndex - startIndex;
    const zoomAmount = Math.floor(currentRange * zoomFactor) * direction;

    const newStartIndex = Math.max(0, Math.floor(startIndex + zoomAmount * percentage));
    const newEndIndex = Math.min(data.length - 1, Math.ceil(endIndex - zoomAmount * (1 - percentage)));

    if (newEndIndex - newStartIndex >= 2) {
      setStartIndex(newStartIndex);
      setEndIndex(newEndIndex);
    }
  };

  const handleReset = () => {
    setStartIndex(0);
    setEndIndex(data.length - 1);
  };

  const getDisplayData = () => {
    return data.slice(startIndex, endIndex + 1);
  };

  return (
    <div className="w-full mt-4">
      <div ref={chartRef} onWheel={handleZoom} style={{ touchAction: "none" }}>
        <div className="flex justify-end mb-4">
          <Button
            variant="bordered"
            size="sm"
            onClick={handleReset}
            disabled={startIndex === 0 && endIndex === data.length - 1}
          >
            Reset Zoom
          </Button>
        </div>
        {children(getDisplayData())}
      </div>
    </div>
  );
}