export const calculateSMA = (data: number[], period: number): number[] => {
  return data.map((_, index) => {
    if (index < period - 1) return null;
    const slice = data.slice(index - period + 1, index + 1);
    return slice.reduce((sum, val) => sum + val, 0) / period;
  });
};

export const calculateEMA = (data: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const ema = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const value = data[i] * k + ema[i - 1] * (1 - k);
    ema.push(value);
  }
  return ema;
};

export const calculateMACD = (data: number[]): { macd: number[], signal: number[], histogram: number[] } => {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);

  return { macd: macdLine, signal: signalLine, histogram };
};

export const calculateRSI = (data: number[], period: number = 14): number[] => {
  const changes = data.slice(1).map((value, index) => value - data[index]);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);

  const rsi = [];
  let avgGain = gains.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

  // First RSI value
  rsi.push(100 - (100 / (1 + avgGain / avgLoss)));

  // Calculate remaining RSI values
  for (let i = period; i < data.length - 1; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
  }

  // Pad the beginning with nulls
  return Array(period).fill(null).concat(rsi);
};