import { Switch } from "@nextui-org/react";
import React from 'react';

export interface Indicators {
  sma: boolean;
  ema: boolean;
  macd: boolean;
  rsi: boolean;
  volume: boolean;
}

interface IndicatorControlsProps {
  indicators: Indicators;
  onIndicatorChange: (updatedIndicators: Indicators) => void;
}

const IndicatorControls: React.FC<IndicatorControlsProps> = ({
                                                               indicators,
                                                               onIndicatorChange
                                                             }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4">
      <Switch
        isSelected={indicators.sma}
        onValueChange={(value) =>
          onIndicatorChange({ ...indicators, sma: value })
        }
      >
        SMA (20)
      </Switch>
      <Switch
        isSelected={indicators.ema}
        onValueChange={(value) =>
          onIndicatorChange({ ...indicators, ema: value })
        }
      >
        EMA (20)
      </Switch>
      <Switch
        isSelected={indicators.macd}
        onValueChange={(value) =>
          onIndicatorChange({ ...indicators, macd: value })
        }
      >
        MACD
      </Switch>
      <Switch
        isSelected={indicators.rsi}
        onValueChange={(value) =>
          onIndicatorChange({ ...indicators, rsi: value })
        }
      >
        RSI
      </Switch>
      <Switch
        isSelected={indicators.volume}
        onValueChange={(value) =>
          onIndicatorChange({ ...indicators, volume: value })
        }
      >
        Volume
      </Switch>
    </div>
  );
};

export default IndicatorControls;