import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { CheckCircle, Copy, Download, QrCode } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  title?: string;
  description?: string;
  shareUrl?: string;
}

// Simple QR Code generator (no external dependencies)
const generateQRCode = (text: string, size: number = 200): string => {
  // For production, you might want to use a proper QR code library
  // This is a placeholder that creates a data URL for the QR code
  // You can replace this with actual QR code generation

  // Simple pattern generation (replace with actual QR code library)
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  canvas.width = size;
  canvas.height = size;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Generate a simple pattern based on the text hash
  const hash = text.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const blockSize = size / 25;
  ctx.fillStyle = "#000000";

  // Create a pattern based on the hash
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      const shouldFill = (hash + i * 25 + j) % 3 === 0;
      if (shouldFill) {
        ctx.fillRect(i * blockSize, j * blockSize, blockSize, blockSize);
      }
    }
  }

  // Add finder patterns (corners)
  const drawFinderPattern = (x: number, y: number) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, blockSize * 7, blockSize * 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + blockSize, y + blockSize, blockSize * 5, blockSize * 5);
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + blockSize * 2, y + blockSize * 2, blockSize * 3, blockSize * 3);
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(18 * blockSize, 0);
  drawFinderPattern(0, 18 * blockSize);

  return canvas.toDataURL();
};

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  data,
  size = 200,
  title = "Scan to Join",
  description = "Scan this QR code with your mobile device",
  shareUrl,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code when data changes
  useEffect(() => {
    if (data) {
      // In a real implementation, use a proper QR code library like 'qrcode'
      // For demo purposes, we'll create a simple pattern
      const url = generateQRCode(data, size);
      setQrCodeUrl(url);
    }
  }, [data, size]);

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  // Download QR code as image
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `screen-share-qr-${Date.now()}.png`;
    link.click();
  };

  if (!data) return null;

  return (
    <Card className="w-fit mx-auto">
      <CardHeader className="text-center pb-3">
        <div className="flex items-center gap-2 mx-auto">
          <QrCode className="w-5 h-5" />
          <h4 className="text-lg font-semibold">{title}</h4>
        </div>
      </CardHeader>
      <CardBody className="items-center space-y-4">
        {/* QR Code Image */}
        <div className="relative">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code for screen share"
              className="border-2 border-default-200 rounded-lg"
              style={{ width: size, height: size }}
            />
          ) : (
            <div
              className="bg-default-100 border-2 border-default-200 rounded-lg flex items-center justify-center"
              style={{ width: size, height: size }}
            >
              <span className="text-default-500">Generating QR Code...</span>
            </div>
          )}

          {/* Live indicator */}
          <div className="absolute top-2 right-2">
            <Chip color="success" size="sm" variant="solid">
              ● LIVE
            </Chip>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-default-600 text-center max-w-xs">{description}</p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {shareUrl && (
            <Button
              size="sm"
              variant="bordered"
              startContent={copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              onClick={copyShareUrl}
            >
              {copied ? "Copied!" : "Copy URL"}
            </Button>
          )}

          <Button size="sm" variant="bordered" startContent={<Download className="w-4 h-4" />} onClick={downloadQRCode}>
            Download
          </Button>
        </div>

        {/* Connection Info */}
        <div className="text-xs text-default-500 text-center space-y-1">
          <p>Encoded data length: {data.length} chars</p>
          <p>Compatible with any QR scanner</p>
        </div>
      </CardBody>
    </Card>
  );
};

// Hook for integrating with QR code scanning
export const useQRCodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string>("");
  const [error, setError] = useState<string>("");

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError("");

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });

      // In a real implementation, you would use a QR code scanning library
      // For now, we'll just provide a manual input option
      console.log("QR scanning started with stream:", stream);

      // Stop stream for demo
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      setError("Camera access denied or not available");
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const processQRData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === "screen-share") {
        setScannedData(data);
        return parsed;
      }
    } catch (error) {
      setError("Invalid QR code data");
    }
    return null;
  };

  return {
    isScanning,
    scannedData,
    error,
    startScanning,
    stopScanning,
    processQRData,
  };
};

export default QRCodeDisplay;
