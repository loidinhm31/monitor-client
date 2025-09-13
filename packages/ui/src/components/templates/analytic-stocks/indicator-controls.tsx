import React from "react";
import { Switch } from "@repo/ui/components/atoms/switch";
import { Label } from "@repo/ui/components/atoms/label";

export interface Indicators {
  sma: boolean;
  ema: boolean;
  macd: boolean;
  rsi: boolean;
  volume: boolean;
  highLow: boolean;
  pivotPoints: boolean;
}

interface IndicatorControlsProps {
  indicators: Indicators;
  onIndicatorChange: (updatedIndicators: Indicators) => void;
  isVNGold: boolean;
}

const IndicatorControls: React.FC<IndicatorControlsProps> = ({ indicators, onIndicatorChange, isVNGold }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4">
      <div className="flex items-center space-x-2">
        <Switch
          checked={indicators.highLow}
          id="high-low-switch"
          variant="holographic"
          onCheckedChange={(value) => onIndicatorChange({ ...indicators, highLow: value })}
        />
        <Label className="text-sm text-cyan-400/70 font-mono font-medium cursor-pointer" htmlFor="high-low-switch">
          Highest/Lowest Price
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={indicators.pivotPoints}
          id="pivot-points-switch"
          variant="holographic"
          onCheckedChange={(value) => onIndicatorChange({ ...indicators, pivotPoints: value })}
        />
        <Label className="text-sm text-cyan-400/70 font-mono font-medium cursor-pointer" htmlFor="pivot-points-switch">
          Pivot Points
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={indicators.sma}
          id="sma-switch"
          variant="holographic"
          onCheckedChange={(value) => onIndicatorChange({ ...indicators, sma: value })}
        />
        <Label className="text-sm text-cyan-400/70 font-mono font-medium cursor-pointer" htmlFor="sma-switch">
          SMA (20)
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={indicators.ema}
          id="ema-switch"
          variant="holographic"
          onCheckedChange={(value) => onIndicatorChange({ ...indicators, ema: value })}
        />
        <Label className="text-sm text-cyan-400/70 font-mono font-medium cursor-pointer" htmlFor="ema-switch">
          EMA (20)
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={indicators.macd}
          id="macd-switch"
          variant="holographic"
          onCheckedChange={(value) => onIndicatorChange({ ...indicators, macd: value })}
        />
        <Label className="text-sm text-cyan-400/70 font-mono font-medium cursor-pointer" htmlFor="macd-switch">
          MACD
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={indicators.rsi}
          id="rsi-switch"
          variant="holographic"
          onCheckedChange={(value) => onIndicatorChange({ ...indicators, rsi: value })}
        />
        <Label className="text-sm text-cyan-400/70 font-mono font-medium cursor-pointer" htmlFor="rsi-switch">
          RSI
        </Label>
      </div>

      {!isVNGold && (
        <div className="flex items-center space-x-2">
          <Switch
            checked={indicators.volume}
            id="volume-switch"
            variant="holographic"
            onCheckedChange={(value) => onIndicatorChange({ ...indicators, volume: value })}
          />
          <Label className="text-sm text-cyan-400/70 font-mono font-medium cursor-pointer" htmlFor="volume-switch">
            Volume
          </Label>
        </div>
      )}
    </div>
  );
};

export default IndicatorControls;
