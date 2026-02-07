

export enum AppMode {
  FREQUENCY = 'FREQUENCY',
  RAW_PNL = 'RAW_PNL'
}

export enum RiskMode {
  FIXED_FRACTIONAL = 'FIXED_FRACTIONAL', // % of Current Equity (Compounding)
  FIXED_INITIAL = 'FIXED_INITIAL'        // % of Initial Equity
}

export interface FrequencyRow {
  id: string;
  rValue: number;
  count: number;
}

export interface SimulationMetrics {
  maxDrawdownR: number;
  maxProfitR: number;
  finalResultR: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  drawdownDuration: number; // For 95th percentile calc
}

export interface SystemMetrics {
  winRate: number;
  profitFactor: number; // Profit/Loss Ratio
  expectancy: number;
  standardDeviation: number;
  sqn: number;
  n: number;
  rUnitSize?: number; // Only for Raw PnL mode
  worstR: number; // The single worst trade in the dataset (e.g. -5.5)
}

export interface RiskMetrics {
  probabilityOfProfit: number;
  p95DrawdownDuration: number;
  rewardRiskRatio: number;
}

export interface ChartDataPoint {
  binLabel: string;  // Label for the X-axis (e.g., "-5R to -4R")
  binStart: number;  // Numeric start for sorting/reference
  frequency: number; // Count in this bin
}

export interface SimulationConfig {
  totalSimulations: number;
  tradesPerSimulation: number;
}

export interface EquityCurveData {
  name: string;
  data: number[]; // Array of cumulative R values
  color: string;
  strokeDasharray?: string;
  strokeWidth?: number;
  zIndex?: number; // Visual layering priority
}

export interface SimulationResults {
  systemMetrics: SystemMetrics;
  riskMetrics: RiskMetrics;
  simulationConfig: SimulationConfig;
  charts: {
    maxDrawdown: ChartDataPoint[];
    maxProfit: ChartDataPoint[];
    finalResult: ChartDataPoint[];
    consecLosses: ChartDataPoint[];
    consecWins: ChartDataPoint[];
  };
  stats: {
    [key: string]: {
      avg: number;
      median: number;
      min: number;
      max: number;
      p5: number;
      p95: number;
    }
  };
  rDistribution: number[]; // The source distribution used for the simulation
  equityCurves: EquityCurveData[]; // The 7 specific equity curves
}

// --- Optimal Position Sizing Types ---

export interface OptimalFConfig {
  successThreshold: number; // e.g., 100% (2x equity)
  failureThreshold: number; // e.g., -25% (0.75x equity)
  tradesPerSim: number;
  totalSims: number;
  riskMode: RiskMode;
}

export interface OptimalFResultRow {
  approach: string;
  optimalRisk: number;
  probSuccess: number;
  probRuin: number;
  avgGain: number;   // In % (e.g., 50 means 50% profit)
  medianGain: number; // In %
}

export interface OptimalFChartPoint {
  risk: number;
  probSuccess: number;
  probRuin: number;
  avgGain: number;
  medianGain: number;
}

export interface OptimalFAnalysisResult {
  bestRows: OptimalFResultRow[];
  chartData: OptimalFChartPoint[];
}
