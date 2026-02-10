import { FrequencyRow, SimulationMetrics, SimulationResults, ChartDataPoint, SystemMetrics, RiskMetrics, SimulationConfig, OptimalFConfig, RiskMode, OptimalFResultRow, OptimalFChartPoint, OptimalFAnalysisResult, EquityCurveData } from '../types';

// --- Constants ---
const HISTOGRAM_BINS = 30; // Number of bars in the histogram
const MAX_EQUITY_CAP = 1e100; // Cap equity to prevent Infinity -> NaN issues (1 googol is enough for any UI)

// --- Helper Functions ---
const parseStrictNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  // Accept plain decimals and scientific notation, reject partial parses like "123abc".
  const numericPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
  if (!numericPattern.test(trimmed)) return null;

  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
};

const calculateStats = (values: number[]) => {
  if (values.length === 0) return { avg: 0, median: 0, min: 0, max: 0, p5: 0, p95: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Percentiles
  const p5Index = Math.floor(sorted.length * 0.05);
  const p95Index = Math.floor(sorted.length * 0.95);
  
  // Guard bounds
  const p5 = sorted[Math.max(0, p5Index)];
  const p95 = sorted[Math.min(sorted.length - 1, p95Index)];

  return { avg, median, min, max, p5, p95 };
};

const generateHistogramData = (values: number[]): ChartDataPoint[] => {
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Edge case: all values distinct or same, minimal range
  if (Math.abs(max - min) < 1e-9) {
      return [{ 
          binLabel: min.toFixed(2), 
          binStart: min,
          frequency: values.length 
      }];
  }

  const range = max - min;
  const step = range / HISTOGRAM_BINS;
  
  // Initialize bins
  const bins = Array.from({ length: HISTOGRAM_BINS }, (_, i) => {
      const start = min + i * step;
      const end = min + (i + 1) * step;
      return {
          rangeStart: start,
          rangeEnd: end,
          count: 0
      };
  });

  // Fill bins
  values.forEach(v => {
      let index = Math.floor((v - min) / step);
      if (index >= HISTOGRAM_BINS) index = HISTOGRAM_BINS - 1; // Handle exact max value
      if (index < 0) index = 0; // Handle precision issues
      bins[index].count++;
  });

  // Format for Chart
  return bins.map(b => {
      // Create a nice label. If step is integer, no decimals. If small, use decimals.
      const labelPrecision = step < 1 ? 1 : 0;
      return {
          binLabel: `${b.rangeStart.toFixed(labelPrecision)}~${b.rangeEnd.toFixed(labelPrecision)}`,
          binStart: b.rangeStart,
          frequency: b.count
      };
  });
};

// --- Main Logic ---

export const calculateBasicMetrics = (rMultiples: number[], n: number, rUnitSize?: number): SystemMetrics => {
  const count = rMultiples.length;
  if (count === 0) {
    return { winRate: 0, profitFactor: 0, expectancy: 0, standardDeviation: 0, sqn: 0, n: 0, worstR: 0 };
  }

  const positiveR = rMultiples.filter(r => r > 0);
  const negativeR = rMultiples.filter(r => r < 0);

  const winRate = positiveR.length / count;
  
  const grossProfit = positiveR.reduce((a, b) => a + b, 0);
  const grossLossAbs = Math.abs(negativeR.reduce((a, b) => a + b, 0));

  // Profit Factor = gross profit / gross loss (absolute).
  // If there are no losses, use a high sentinel value for UI compatibility.
  const profitFactor = grossLossAbs === 0 ? (grossProfit > 0 ? 999 : 0) : grossProfit / grossLossAbs; 
  
  const sum = rMultiples.reduce((a, b) => a + b, 0);
  const expectancy = sum / count;
  
  const variance = rMultiples.reduce((acc, val) => acc + Math.pow(val - expectancy, 2), 0) / count;
  const standardDeviation = Math.sqrt(variance);
  
  const sqn = standardDeviation === 0 ? 0 : (expectancy / standardDeviation) * Math.sqrt(n);

  // Find worst trade (Minimum R)
  const worstR = Math.min(...rMultiples);

  return {
    winRate,
    profitFactor,
    expectancy,
    standardDeviation,
    sqn,
    n,
    rUnitSize,
    worstR
  };
};

export const parseRawData = (inputText: string): { rMultiples: number[]; rUnit: number; validCount: number; error?: string } => {
  const rawValues = inputText
    .split(/[\n,;]+/)
    .map(s => parseStrictNumber(s))
    .filter((n): n is number => n !== null);

  if (rawValues.length < 30) {
    return { rMultiples: [], rUnit: 0, validCount: 0, error: `数据不足。当前仅找到 ${rawValues.length} 笔交易，最少需要 30 笔。` };
  }

  const negativeValues = rawValues.filter(v => v < 0);
  if (negativeValues.length === 0) {
     return { rMultiples: [], rUnit: 0, validCount: rawValues.length, error: "未找到亏损交易。无法计算1R风险单位。" };
  }

  const avgLoss = negativeValues.reduce((a, b) => a + b, 0) / negativeValues.length;
  // Requirement: 1R = |Average Loss |
  const rUnit = Math.abs(avgLoss);

  if (rUnit === 0) {
      return { rMultiples: [], rUnit: 0, validCount: rawValues.length, error: "计算得出的R单位为0。" };
  }

  const rMultiples = rawValues.map(v => v / rUnit);
  let n = rawValues.length;
  if (n > 100) n = 100; // Clamp to 100 for SQN calc as per instructions

  return { rMultiples, rUnit, validCount: n };
};

export const runMonteCarloSimulation = (
  pool: number[], 
  systemMetrics: SystemMetrics,
  config: SimulationConfig
): SimulationResults => {
  
  const { totalSimulations, tradesPerSimulation } = config;
  const results: SimulationMetrics[] = [];

  // Trackers for Equity Curves
  // Note: Path length is tradesPerSimulation + 1 (starting at 0)
  let bestFinal = { val: -Infinity, path: [] as number[] };
  let worstFinal = { val: Infinity, path: [] as number[] };
  let deepestDD = { val: -Infinity, path: [] as number[] }; // Max Drawdown Value (depth)
  let shallowestDD = { val: Infinity, path: [] as number[] }; // Min Max Drawdown Value
  let longDur = { val: -Infinity, path: [] as number[] }; // Longest Duration
  let shortDur = { val: Infinity, path: [] as number[] }; // Shortest Duration
  
  const sumCurve = new Array(tradesPerSimulation + 1).fill(0);

  for (let i = 0; i < totalSimulations; i++) {
    let currentEquity = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let maxEquity = 0;
    let minEquity = 0; 
    let maxDrawdownR = 0;
    let maxProfitR = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let maxWinStreak = 0;

    // Drawdown Duration Logic
    let peakEquity = 0; // Highest high
    let currentDrawdownDuration = 0;
    let maxDrawdownDuration = 0;

    // Equity Curve for this sim (Start at 0)
    const currentPath = new Array(tradesPerSimulation + 1);
    currentPath[0] = 0;

    for (let t = 0; t < tradesPerSimulation; t++) {
      // Random sampling with replacement
      const randomIndex = Math.floor(Math.random() * pool.length);
      const r = pool[randomIndex];

      // Update Equity
      currentEquity += r;
      currentPath[t + 1] = currentEquity;

      // Max Profit
      if (currentEquity > maxProfitR) maxProfitR = currentEquity;
      if (currentEquity < minEquity) minEquity = currentEquity;

      // Drawdown Depth
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
        currentDrawdownDuration = 0; // Reset duration at new high
      } else {
        const drawdown = peakEquity - currentEquity;
        if (drawdown > maxDrawdownR) maxDrawdownR = drawdown;
        currentDrawdownDuration++;
      }

      if (currentDrawdownDuration > maxDrawdownDuration) {
        maxDrawdownDuration = currentDrawdownDuration;
      }
      
      // Streaks
      if (r < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      } else if (r > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else {
        // Breakeven
        currentLossStreak = 0;
        currentWinStreak = 0;
      }
    }

    // Accumulate for Average Curve
    for(let k=0; k < currentPath.length; k++) {
        sumCurve[k] += currentPath[k];
    }

    // Check Records
    // 1. Best Final Result
    if (currentEquity > bestFinal.val) {
        bestFinal.val = currentEquity;
        bestFinal.path = [...currentPath];
    }
    // 2. Worst Final Result
    if (currentEquity < worstFinal.val) {
        worstFinal.val = currentEquity;
        worstFinal.path = [...currentPath];
    }
    // 3. Deepest Drawdown (Max DD is largest)
    if (maxDrawdownR > deepestDD.val) {
        deepestDD.val = maxDrawdownR;
        deepestDD.path = [...currentPath];
    }
    // 4. Shallowest Drawdown (Max DD is smallest)
    if (maxDrawdownR < shallowestDD.val) {
        shallowestDD.val = maxDrawdownR;
        shallowestDD.path = [...currentPath];
    }
    // 5. Longest Drawdown Duration
    if (maxDrawdownDuration > longDur.val) {
        longDur.val = maxDrawdownDuration;
        longDur.path = [...currentPath];
    }
    // 6. Shortest Drawdown Duration
    if (maxDrawdownDuration < shortDur.val) {
        shortDur.val = maxDrawdownDuration;
        shortDur.path = [...currentPath];
    }

    results.push({
      finalResultR: currentEquity,
      maxDrawdownR,
      maxProfitR,
      maxConsecutiveLosses: maxLossStreak,
      maxConsecutiveWins: maxWinStreak,
      drawdownDuration: maxDrawdownDuration
    });
  }

  // --- Post Analysis ---

  const finalResults = results.map(r => r.finalResultR);
  const maxDrawdowns = results.map(r => r.maxDrawdownR);
  const maxProfits = results.map(r => r.maxProfitR);
  const consecLosses = results.map(r => r.maxConsecutiveLosses);
  const consecWins = results.map(r => r.maxConsecutiveWins);
  const durations = results.map(r => r.drawdownDuration);

  // Probability of Profit
  const profitCount = finalResults.filter(r => r > 0).length;
  const probabilityOfProfit = (profitCount / totalSimulations) * 100;

  // 95th Percentile Drawdown Duration
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const p95Index = Math.floor(sortedDurations.length * 0.95);
  const p95DrawdownDuration = sortedDurations[p95Index];

  // Reward/Risk
  const avgFinal = finalResults.reduce((a, b) => a + b, 0) / totalSimulations;
  const avgDrawdown = maxDrawdowns.reduce((a, b) => a + b, 0) / totalSimulations;
  const rewardRiskRatio = avgDrawdown === 0 ? 0 : avgFinal / avgDrawdown;

  const riskMetrics: RiskMetrics = {
    probabilityOfProfit,
    p95DrawdownDuration,
    rewardRiskRatio
  };

  // Compile Equity Curves
  const avgPath = sumCurve.map(v => v / totalSimulations);
  
  const equityCurves: EquityCurveData[] = [
      { name: '收益最高 (Best Result)', data: bestFinal.path, color: '#16a34a', zIndex: 10 },
      { name: '收益最低 (Worst Result)', data: worstFinal.path, color: '#dc2626', zIndex: 10 },
      { name: '回撤最大 (Max Drawdown)', data: deepestDD.path, color: '#9333ea', zIndex: 5 },
      { name: '回撤最小 (Min Drawdown)', data: shallowestDD.path, color: '#2563eb', zIndex: 5 },
      { name: '回撤期最长 (Longest DD)', data: longDur.path, color: '#ea580c', zIndex: 5 },
      { name: '回撤期最短 (Shortest DD)', data: shortDur.path, color: '#0891b2', zIndex: 5 },
      { name: '平均收益 (Average)', data: avgPath, color: '#4b5563', strokeWidth: 2, strokeDasharray: '4 4', zIndex: 20 },
  ];

  return {
    systemMetrics,
    riskMetrics,
    simulationConfig: config,
    charts: {
      maxDrawdown: generateHistogramData(maxDrawdowns),
      maxProfit: generateHistogramData(maxProfits),
      finalResult: generateHistogramData(finalResults),
      consecLosses: generateHistogramData(consecLosses),
      consecWins: generateHistogramData(consecWins),
    },
    stats: {
      maxDrawdown: calculateStats(maxDrawdowns),
      maxProfit: calculateStats(maxProfits),
      finalResult: calculateStats(finalResults),
      consecLosses: calculateStats(consecLosses),
      consecWins: calculateStats(consecWins),
    },
    rDistribution: pool,
    equityCurves
  };
};

// --- Optimal F (Position Sizing) Calculation ---

// Using a Generator function to yield progress back to the UI loop
export async function* calculateOptimalF(
  rPool: number[],
  config: OptimalFConfig
) {
  const { successThreshold, failureThreshold, tradesPerSim, totalSims, riskMode } = config;

  // Trackers for the 6 approaches
  let bestAvgGain = { f: 0, val: -Infinity, row: null as any };
  let bestMedianGain = { f: 0, val: -Infinity, row: null as any };
  let bestProbSuccess = { f: 0, val: -Infinity, row: null as any };
  let bestProbRuin1Pct = { f: 0, val: Infinity, row: null as any }; // diff from 1%
  let bestProbRuinMin = { f: 0, val: Infinity, row: null as any };
  let bestSpread = { f: 0, val: -Infinity, row: null as any };

  // Data for charts
  const chartData: OptimalFChartPoint[] = [];

  // Loop f from 0.1% to 30.0%
  const startF = 0.1;
  const endF = 30.0;
  const stepF = 0.1;
  const totalSteps = Math.round((endF - startF) / stepF) + 1;

  let stepCount = 0;

  for (let f = startF; f <= endF + 0.0001; f += stepF) {
    stepCount++;
    
    // Convert percentage to decimal
    const riskDecimal = f / 100.0;
    
    // Stats for this f
    let successCount = 0;
    let ruinCount = 0;
    const finalEquities: number[] = [];

    // Run Simulations
    for (let s = 0; s < totalSims; s++) {
      let equity = 1.0; // Start at 100%
      let ruined = false;

      // Run Trades
      for (let t = 0; t < tradesPerSim; t++) {
        // Sample R
        const rIndex = Math.floor(Math.random() * rPool.length);
        const r = rPool[rIndex];
        
        let pnl = 0;
        if (riskMode === RiskMode.FIXED_FRACTIONAL) {
           pnl = equity * riskDecimal * r;
        } else {
           // Fixed Initial (Initial is always 1.0)
           pnl = 1.0 * riskDecimal * r; 
        }

        equity += pnl;

        // CAP Logic to prevent Infinity / NaN
        if (equity > MAX_EQUITY_CAP) {
            equity = MAX_EQUITY_CAP;
        }
        
        // FLOOR Logic to prevent Negative Equity (Debt)
        // Market limits loss to 100% (equity = 0)
        if (equity < 0) {
            equity = 0;
        }

        // Ruin check: e.g., if threshold is -25%, equity limit is 0.75
        // We use slightly forgiving logic: only ruin if we end a trade below limit
        if (equity <= (1 + failureThreshold / 100)) {
           ruined = true;
           break; // Stop trading this run
        }

        // Note: We DO NOT check success here inside loop as per requirements.
        // Success is only counted if FINAL equity >= threshold.
      }

      if (ruined) {
          ruinCount++;
      } else {
          // Only check success if not ruined (or just check equity at end)
          // "只有本轮最终权益≥成功阈值，才算成功"
          if (equity >= (1 + successThreshold / 100)) {
              successCount++;
          }
      }
      
      finalEquities.push(equity);
    }

    // Calculate Aggregates for this f
    const avgEquity = finalEquities.reduce((a, b) => a + b, 0) / totalSims;
    const probSuccess = (successCount / totalSims) * 100;
    const probRuin = (ruinCount / totalSims) * 100;
    
    // Sort for median
    finalEquities.sort((a, b) => a - b);
    const mid = Math.floor(finalEquities.length / 2);
    const medianEquity = finalEquities.length % 2 !== 0 ? finalEquities[mid] : (finalEquities[mid-1] + finalEquities[mid])/2;

    const avgGainPct = (avgEquity - 1) * 100;
    const medianGainPct = (medianEquity - 1) * 100;

    const optimalRisk = Number(f.toFixed(1));

    // Store Chart Data
    chartData.push({
      risk: optimalRisk,
      probSuccess,
      probRuin,
      avgGain: avgGainPct,
      medianGain: medianGainPct
    });

    const currentRow: OptimalFResultRow = {
      approach: '', // Filled later
      optimalRisk,
      probSuccess: Number(probSuccess.toFixed(2)),
      probRuin: Number(probRuin.toFixed(2)),
      avgGain: Number(avgGainPct.toFixed(2)),
      medianGain: Number(medianGainPct.toFixed(2))
    };

    // --- Compare with Goals ---
    
    // 1. Max Average Return
    if (avgGainPct > bestAvgGain.val) {
      bestAvgGain = { f, val: avgGainPct, row: { ...currentRow, approach: '最大平均回报 (Max Avg Gain)' } };
    }

    // 2. Max Median Return
    if (medianGainPct > bestMedianGain.val) {
      bestMedianGain = { f, val: medianGainPct, row: { ...currentRow, approach: '最大中位数回报 (Max Median Gain)' } };
    }

    // 3. Max Prob Success
    if (probSuccess > bestProbSuccess.val) {
      bestProbSuccess = { f, val: probSuccess, row: { ...currentRow, approach: '最大成功概率 (Max Prob. Success)' } };
    } else if (probSuccess === bestProbSuccess.val && avgGainPct > bestAvgGain.val) {
       // Tie breaker
    }

    // 4. Ruin < 1% and closest to 1%
    if (probRuin < 1.0) {
      const diff = Math.abs(probRuin - 1.0);
      if (diff < bestProbRuin1Pct.val) {
        bestProbRuin1Pct = { f, val: diff, row: { ...currentRow, approach: '失败概率 < 1% 且最接近 (Ruin ≈ 1%)' } };
      }
    }

    // 5. Min Prob Ruin (> 0)
    // Modified to find lowest POSITIVE non-zero probability of ruin
    if (probRuin > 0) {
       if (probRuin < bestProbRuinMin.val) {
          bestProbRuinMin = { f, val: probRuin, row: { ...currentRow, approach: '最小正失败概率 (Min Positive Ruin)' } };
       } else if (probRuin === bestProbRuinMin.val) {
          if (avgGainPct > bestProbRuinMin.row?.avgGain) {
             bestProbRuinMin = { f, val: probRuin, row: { ...currentRow, approach: '最小正失败概率 (Min Positive Ruin)' } };
          }
       }
    }

    // 6. Max (Success - Ruin)
    const spread = probSuccess - probRuin;
    if (spread > bestSpread.val) {
      bestSpread = { f, val: spread, row: { ...currentRow, approach: '最大 (成功率 - 失败率) 差值 (Max Prob. Success - Ruin)' } };
    }

    // Yield progress every 5 steps (0.5%)
    if (stepCount % 5 === 0) {
      yield Math.round((stepCount / totalSteps) * 100);
    }
  }

  // Finished.
  const bestRows = [
    bestAvgGain.row,
    bestMedianGain.row,
    bestProbSuccess.row,
    bestProbRuin1Pct.row || { approach: '失败概率 < 1% (无结果)', optimalRisk: 0, probSuccess: 0, probRuin: 0, avgGain: 0, medianGain: 0 },
    bestProbRuinMin.row || { approach: '最小正失败概率 (无/None)', optimalRisk: 0, probSuccess: 0, probRuin: 0, avgGain: 0, medianGain: 0 },
    bestSpread.row
  ];

  // Return final complex object
  return { bestRows, chartData };
}
