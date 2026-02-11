import React, { useState, useEffect } from 'react';
import { SimulationResults, ChartDataPoint, OptimalFConfig, RiskMode, OptimalFResultRow, OptimalFAnalysisResult, OptimalFChartPoint, EquityCurveData } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, ReferenceLine, Legend } from 'recharts';
import { Camera, HelpCircle, AlertTriangle, Sparkles, BarChart2, Calculator, PieChart, ShieldAlert, Info, Scale, Target, TrendingUp, Play, Percent, Rocket, Users, Grid, Check, ArrowRight, RotateCcw, Edit2, Settings, Link2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { calculateOptimalF } from '../utils/calculations';

interface DashboardProps {
    results: SimulationResults | null;
    isSidebarOpen?: boolean;
}

// --- Enums for Risk Control ---
enum CorrelationType {
    STRONG = 'STRONG',               // 强相关 (0.9)
    MEDIUM = 'MEDIUM',               // 中相关 (0.5)
    WEAK = 'WEAK',                   // 弱相关 (0.1)
    PARTIAL_HEDGE = 'PARTIAL_HEDGE', // 对冲 (-0.5)
    STRONG_HEDGE = 'STRONG_HEDGE'    // 强力对冲 (-0.8)
}

const CORRELATION_LABELS: Record<CorrelationType, string> = {
    [CorrelationType.STRONG]: '强 (Strong)',
    [CorrelationType.MEDIUM]: '中 (Medium)',
    [CorrelationType.WEAK]: '弱 (Weak)',
    [CorrelationType.PARTIAL_HEDGE]: '对冲 (Hedge)',
    [CorrelationType.STRONG_HEDGE]: '强力对冲 (Strong Hedge)',
};

const CORRELATION_COLORS: Record<CorrelationType, string> = {
    [CorrelationType.STRONG]: 'text-red-600 bg-red-50',
    [CorrelationType.MEDIUM]: 'text-orange-600 bg-orange-50',
    [CorrelationType.WEAK]: 'text-gray-400 bg-gray-50',
    [CorrelationType.PARTIAL_HEDGE]: 'text-blue-600 bg-blue-50',
    [CorrelationType.STRONG_HEDGE]: 'text-emerald-600 bg-emerald-50',
};

// Numeric mapping for heuristic algorithm
const CORRELATION_VALUES: Record<CorrelationType, number> = {
    [CorrelationType.STRONG]: 0.9,
    [CorrelationType.MEDIUM]: 0.5,
    [CorrelationType.WEAK]: 0.1,
    [CorrelationType.PARTIAL_HEDGE]: -0.5, // Updated from -0.4
    [CorrelationType.STRONG_HEDGE]: -0.8,
};

// --- Shared Components ---

const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subValue?: string;
    helpText?: string;
    variant?: 'default' | 'highlighted';
    valueClassName?: string;
    subValueClassName?: string;
    prefixIcon?: React.ReactNode;
}> = ({ title, value, subValue, helpText, variant = 'default', valueClassName, subValueClassName, prefixIcon }) => {
    const isHighlighted = variant === 'highlighted';

    return (
        <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative h-full flex flex-col ${isHighlighted ? 'items-center justify-center py-6' : 'justify-center'}`}>
            {/* Title Section */}
            <div className={`flex items-center ${isHighlighted ? 'relative mb-3' : 'justify-between w-full'}`}>
                <p className={`${isHighlighted ? 'text-sm font-bold text-gray-600' : 'text-xs font-medium text-gray-500'} uppercase tracking-wider`}>
                    {title}
                </p>

                {helpText && (
                    <div className={`group relative z-10 ${isHighlighted ? 'ml-2 -mt-0.5' : ''}`}>
                        <div className="cursor-help text-gray-400 hover:text-indigo-600 transition-colors">
                            <HelpCircle size={isHighlighted ? 16 : 14} />
                        </div>
                        {/* Tooltip */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-8 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 hidden group-hover:block opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-wrap leading-relaxed text-left">
                            {helpText}
                            {/* Arrow */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Value Section */}
            <div className={`flex items-baseline ${isHighlighted ? 'flex-col items-center' : 'mt-2'}`}>
                {isHighlighted ? (
                    <>
                        <div className="w-full flex items-center justify-center gap-2">
                            {prefixIcon}
                            <p className={`text-center tabular-nums ${valueClassName ? valueClassName : 'text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight'}`}>
                                {value}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        {prefixIcon}
                        <p className={`${valueClassName ? valueClassName : 'text-2xl font-bold text-gray-900'}`}>
                            {value}
                        </p>
                    </div>
                )}
                {subValue && (
                    <div className={`${isHighlighted ? 'mt-3 w-full flex justify-center' : 'ml-2'}`}>
                        <span className={`text-sm ${subValueClassName ? subValueClassName : (isHighlighted ? 'font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100' : 'text-gray-500')}`}>
                            {subValue}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const DualMetricCard: React.FC<{
    title1: string; value1: string | number;
    title2: string; value2: string | number;
    children?: React.ReactNode;
}> = ({ title1, value1, title2, value2, children }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[140px] h-full overflow-hidden">
        {/* Main Metrics Row */}
        <div className="flex items-center justify-between divide-x divide-gray-100 flex-1 p-4">
            <div className="flex-1 px-2 text-center flex flex-col justify-center">
                <p className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{title1}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-800">{value1}</p>
            </div>
            <div className="flex-1 px-2 text-center flex flex-col justify-center">
                <p className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{title2}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-800">{value2}</p>
            </div>
        </div>
        {/* Footer/Children (Sigma) */}
        {children && (
            <div className="bg-gray-50/80 border-t border-gray-100 p-3">
                {children}
            </div>
        )}
    </div>
);

const StatTable: React.FC<{ stats: { avg: number; median: number; min: number; max: number; p5: number; p95: number }, title: string, color: string }> = ({ stats, title, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-sm">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700 flex justify-between items-center">
            <span>{title}</span>
            <span className={`w-3 h-3 rounded-full ${color}`}></span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y border-gray-200">
            <div className="p-2">
                <span className="text-gray-500 text-xs block">平均值 (Avg)</span>
                <span className="font-medium">{stats.avg.toFixed(2)}</span>
            </div>
            <div className="p-2">
                <span className="text-gray-500 text-xs block">中位数 (Median)</span>
                <span className="font-medium">{stats.median.toFixed(2)}</span>
            </div>
            <div className="p-2">
                <span className="text-gray-500 text-xs block">最小值 (Min)</span>
                <span className="font-medium">{stats.min.toFixed(2)}</span>
            </div>
            <div className="p-2">
                <span className="text-gray-500 text-xs block">最大值 (Max)</span>
                <span className="font-medium">{stats.max.toFixed(2)}</span>
            </div>
            {/* New Percentile Row */}
            <div className="p-2 bg-gray-50/50">
                <span className="text-gray-500 text-xs block">5%分位 (P5)</span>
                <span className="font-mono font-medium text-gray-700">{stats.p5.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-gray-50/50">
                <span className="text-gray-500 text-xs block">95%分位 (P95)</span>
                <span className="font-mono font-medium text-gray-700">{stats.p95.toFixed(2)}</span>
            </div>
        </div>
    </div>
);

const HistogramChart: React.FC<{ data: ChartDataPoint[]; title: string; color: string; xLabel: string }> = ({ data, title, color, xLabel }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[320px]">
        <h3 className="text-sm font-bold text-gray-700 mb-4">{title} <span className="font-normal text-gray-500">(频数分布 / Frequency)</span></h3>
        <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="binLabel"
                        tick={{ fontSize: 10, fill: '#6b7280' }}
                        interval="preserveStartEnd"
                    >
                        <Label value={xLabel} offset={0} position="bottom" style={{ fontSize: 12, fill: '#9ca3af' }} />
                    </XAxis>
                    <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                    >
                        <Label value="频数 (Count)" angle={-90} position="insideLeft" style={{ fontSize: 12, fill: '#9ca3af' }} />
                    </YAxis>
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        formatter={(value: number) => [`${value} 次`, '频数 (Count)']}
                        labelFormatter={(label) => `区间: ${label}`}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar
                        dataKey="frequency"
                        fill={color}
                        radius={[2, 2, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const EquityCurvesChart: React.FC<{ curves: EquityCurveData[] }> = ({ curves }) => {
    // Transform data for Recharts: array of { step: 0, "Curve Name": 0, ... }
    const length = curves[0]?.data.length || 0;
    const data = [];

    for (let i = 0; i < length; i++) {
        const point: any = { step: i };
        curves.forEach(curve => {
            point[curve.name] = curve.data[i];
        });
        data.push(point);
    }

    // Sort curves to ensure layering (Average on top usually looks best)
    const sortedCurves = [...curves].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[400px] w-full">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-500" />
                典型累积R曲线 (Representative Cumulative R Curves)
                <span className="font-normal text-gray-500 text-xs ml-auto">
                    包含: 收益最值 / 回撤最值 / 持续期最值 / 平均值 (Includes: Best/Worst, Max/Min Drawdown, Duration, Avg)
                </span>
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="step"
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            interval="preserveStartEnd"
                            type="number"
                            domain={[0, 'dataMax']}
                        >
                            <Label value="交易笔数 (Trade Count)" offset={0} position="bottom" style={{ fontSize: 12, fill: '#9ca3af' }} />
                        </XAxis>
                        <YAxis
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            domain={['auto', 'auto']}
                        >
                            <Label
                                value="累积R (Cumulative R)"
                                angle={-90}
                                position="insideLeft"
                                style={{ textAnchor: 'middle', fontSize: 12, fill: '#9ca3af' }}
                                offset={10}
                            />
                        </YAxis>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            labelFormatter={(v) => `交易 #${v}`}
                            formatter={(val: number, name: string) => [val.toFixed(2) + ' R', name]}
                            itemSorter={(item) => -(item.value as number)} // Sort tooltip descending by value
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <ReferenceLine y={0} stroke="#000" strokeOpacity={0.2} />

                        {sortedCurves.map((curve) => (
                            <Line
                                key={curve.name}
                                type="monotone"
                                dataKey={curve.name}
                                stroke={curve.color}
                                strokeWidth={curve.strokeWidth || 1.5}
                                strokeDasharray={curve.strokeDasharray}
                                dot={false}
                                activeDot={{ r: 4 }}
                                isAnimationActive={false} // Disable animation for performance with many points
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Smart Number Input ---
const SmartNumberInput = ({
    value,
    onChange,
    onBlur,
    step = 1,
    min,
    max,
    className,
}: {
    value: number;
    onChange: (val: number) => void;
    onBlur?: () => void;
    step?: number;
    min?: number;
    max?: number;
    className?: string;
}) => {
    const [text, setText] = useState(value.toString());

    useEffect(() => {
        if (Number(text) !== value && text !== '-' && text !== '' && !text.endsWith('.')) {
            setText(value.toString());
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setText(newVal);

        const parsed = parseFloat(newVal);
        if (!isNaN(parsed)) {
            if (!newVal.endsWith('.') && newVal !== '-' && newVal !== '-0') {
                onChange(parsed);
            }
        } else if (newVal === '') {
            onChange(0);
        }
    };

    const handleInternalBlur = () => {
        let parsed = parseFloat(text);
        if (isNaN(parsed)) parsed = 0;

        setText(parsed.toString());
        onChange(parsed);
        if (onBlur) onBlur();
    };

    return (
        <input
            type="number"
            step={step}
            min={min}
            max={max}
            className={className}
            value={text}
            onChange={handleChange}
            onBlur={handleInternalBlur}
        />
    );
};

// --- Risk Allocation (Pruning) Widget ---

interface AllocationResult {
    name: string;
    initialRisk: number;
    finalRisk: number;
    constraint: string; // 'Single Cap', 'Risk Pruning', 'Global Scale'
}

const RiskAllocationWidget: React.FC<{ totalHeat: number }> = ({ totalHeat }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [assetCount, setAssetCount] = useState<number>(3);
    const [assetNames, setAssetNames] = useState<string[]>([]);
    const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationType[][]>([]);

    // Config States
    const [maxSingleRisk, setMaxSingleRisk] = useState<number>(2.0);
    const [allowOverAllocation, setAllowOverAllocation] = useState<boolean>(false);

    // Result State
    const [allocationResults, setAllocationResults] = useState<AllocationResult[]>([]);

    // Auto-calc default single risk
    useEffect(() => {
        if (totalHeat > 0 && assetCount > 0 && step === 1) {
            let suggested = totalHeat / Math.sqrt(assetCount);
            if (assetCount >= 3) {
                suggested = totalHeat / assetCount * 1.5;
            } else if (assetCount === 2) {
                // N=2 时，保持原来的 sqrt 公式更安全，或者用 1.2 倍系数
                suggested = totalHeat / Math.sqrt(assetCount) * 0.8; // 保守处理
            } else { // n === 1
                suggested = totalHeat; // 单品种就是总风险
            }
            const clamped = Math.max(0.1, Math.min(totalHeat, suggested));
            setMaxSingleRisk(Number(clamped.toFixed(2)));
        }
    }, [totalHeat, assetCount, step]);

    // Step 1: Initialize
    const handleSetup = () => {
        const n = Math.max(2, Math.min(10, assetCount));
        const names = Array.from({ length: n }, (_, i) => `Symbol ${String.fromCharCode(65 + i)}`);

        // Initialize Matrix: Default WEAK
        const matrix: CorrelationType[][] = [];
        for (let i = 0; i < n; i++) {
            const row: CorrelationType[] = [];
            for (let j = 0; j < n; j++) {
                row.push(CorrelationType.WEAK);
            }
            matrix.push(row);
        }

        setAssetCount(n);
        setAssetNames(names);
        setCorrelationMatrix(matrix);
        setStep(2);
    };

    // Step 2 actions
    const handleNameChange = (idx: number, newName: string) => {
        const newNames = [...assetNames];
        newNames[idx] = newName;
        setAssetNames(newNames);
    };

    const handleCorrelationChange = (rowIdx: number, colIdx: number, val: CorrelationType) => {
        const newMatrix = correlationMatrix.map(row => [...row]);
        newMatrix[rowIdx][colIdx] = val;
        newMatrix[colIdx][rowIdx] = val;
        setCorrelationMatrix(newMatrix);
    };

    // --- Core Algorithm: Risk Contribution Pruning (Hedge Optimized) ---
    const calculateAllocations = () => {
        const n = assetCount;
        // const K1 = totalHeat; // 目标风险限额 (也是名义总和限额)
        // 检查是否存在对冲项
        const hasHedge = correlationMatrix.some(row =>
            row.some(val => val === CorrelationType.PARTIAL_HEDGE || val === CorrelationType.STRONG_HEDGE)
        );

        // 如果允许对冲溢出且存在对冲项，则 K1 为 1.25 倍
        const K1 = (allowOverAllocation && hasHedge) ? totalHeat * 1.25 : totalHeat;
        const K2 = maxSingleRisk; // 单笔上限

        // 0. 预处理相关性矩阵
        const floatMatrix: number[][] = [];
        for (let i = 0; i < n; i++) {
            const row: number[] = [];
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    row.push(1.0);
                } else {
                    row.push(CORRELATION_VALUES[correlationMatrix[i][j]]);
                }
            }
            floatMatrix.push(row);
        }

        // 1. 初始化权重 (满仓开局)
        let weights = new Array(n).fill(K2);

        // 2. 迭代剪枝 (关键优化点)
        const MAX_ITER = 200;
        const LR = 0.1; // 学习率

        for (let iter = 0; iter < MAX_ITER; iter++) {
            // A. 计算当前状态：组合方差 & 名义总和
            let variance = 0;
            let currentSum = 0;
            const MRC = new Array(n).fill(0); // 边际风险贡献

            for (let i = 0; i < n; i++) {
                currentSum += weights[i]; // 累加名义总和

                let rowCovSum = 0;
                for (let j = 0; j < n; j++) {
                    rowCovSum += weights[j] * floatMatrix[i][j];
                }
                MRC[i] = rowCovSum; // 暂存中间值 (Sigma * w)
                variance += weights[i] * rowCovSum;
            }

            const currentRisk = Math.sqrt(Math.max(0, variance));

            // B. 双重检查 (核心修改)
            // 只有当 [组合风险] 和 [名义总和] 同时都不超标时，才算结束。
            // 之前的问题是 Risk 达标了就停了，导致 Sum 只能线性压缩。
            const riskOverload = currentRisk / K1;
            const sumOverload = currentSum / K1;
            const maxOverload = Math.max(riskOverload, sumOverload);

            if (maxOverload <= 1.0001) {
                break; // 完美达标
            }

            // C. 确定剪枝力度
            // 我们需要确定每个资产的“罪恶度”。即使是 Sum 超标，我们也要优先剪 Risk 大的。
            // 这样才能在 Sum 降下来的同时，把宝贵的额度留给对冲资产。

            let totalPositiveMRC = 0;
            // 计算由于方差引起的总正向贡献
            const positiveRiskContribs = weights.map((w, i) => {
                const contribution = w * MRC[i];
                if (contribution > 0) totalPositiveMRC += contribution;
                return Math.max(0, contribution);
            });

            // D. 执行剪枝
            let maxChange = 0;
            for (let i = 0; i < n; i++) {
                // 如果是完美的对冲资产（MRC < 0），它实际上在降低组合风险。
                // 我们应该极力保护它，除非它的单笔太大了，或者单纯为了压 Sum。
                // 这里的逻辑是：主要基于风险贡献比来剪。

                let pruneRatio = 0;

                // 情况1：组合风险太高 -> 按风险贡献比例剪
                if (riskOverload > 1.0 && totalPositiveMRC > 0) {
                    const contributionRatio = positiveRiskContribs[i] / totalPositiveMRC;
                    // 动态力度：超标越多，剪得越狠
                    pruneRatio = Math.max(pruneRatio, contributionRatio * (riskOverload - 1.0));
                }

                // 情况2：名义总和太高 (即便风险不高) -> 依然按风险贡献偏好剪，但也加一点均匀压力
                // 这样 B 会因为风险贡献大被剪更多，A/C 虽也受压但保留更多。
                if (sumOverload > 1.0) {
                    // 基础均匀压力 (保证能压下来)
                    let basePressure = (sumOverload - 1.0) * 0.1;

                    // 风险加权压力 (谁波动大谁多担待)
                    let riskPressure = 0;
                    if (totalPositiveMRC > 0) {
                        riskPressure = (positiveRiskContribs[i] / totalPositiveMRC) * (sumOverload - 1.0);
                    }

                    // 混合策略：既看总和，也看风险
                    pruneRatio = Math.max(pruneRatio, basePressure + riskPressure);
                }

                // 应用惩罚
                // 限制单次最大跌幅，防止震荡
                const safePrune = Math.min(0.2, pruneRatio * LR * 5.0);

                const oldW = weights[i];
                weights[i] = weights[i] * (1.0 - safePrune);
                maxChange = Math.max(maxChange, Math.abs(oldW - weights[i]));
            }

            if (maxChange < 0.00001) break;
        }

        // 3. 最后的保险栓 (Final Safety Net)
        // 这一步只处理数学误差，如果前面逻辑正确，这里几乎不会触发大的调整
        let finalSum = weights.reduce((a, b) => a + b, 0);
        if (finalSum > K1) {
            const scale = (K1 / finalSum) * 0.999;
            weights = weights.map(w => w * scale);
        }

        const finalResults: AllocationResult[] = assetNames.map((name, i) => {
            let constraint = 'None';
            if (weights[i] < 0.01) constraint = 'Risk Pruning';
            else if (Math.abs(weights[i] - K2) < 0.05) constraint = 'Single Cap';
            else if (weights[i] < K2) constraint = 'Risk Alloc.';

            return {
                name,
                initialRisk: K2,
                finalRisk: Math.max(0, weights[i]),
                constraint
            };
        });

        setAllocationResults(finalResults);
        setStep(3);
    };

    const handleReset = () => {
        setStep(1);
    };

    const handleEditConfig = () => {
        setStep(2);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col min-h-[420px] h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm uppercase tracking-wide">
                    <Users size={16} />
                    风险贡献分配 (Risk Contribution Alloc.)
                </div>
                <div className="group relative">
                    <Info size={16} className="text-gray-400 cursor-help hover:text-indigo-600 transition-colors" />
                    <div className="absolute right-0 top-6 w-80 p-4 bg-gray-900 text-white text-xs rounded shadow-xl z-50 hidden group-hover:block leading-relaxed whitespace-pre-wrap">
                        <span className="font-bold text-indigo-300 block mb-1">双重约束智能剪枝 (Dual-Constraint Pruning):</span>
                        这是一个高级迭代算法，旨在满足“最坏情况风控”的前提下，最大化对冲红利。<br />
                        1. <span className="font-semibold text-white">初始化</span>: 所有品种满仓 (单笔上限)。<br />
                        2. <span className="font-semibold text-white">双重检查</span>: 算法同时监控「组合波动率」和「名义总仓位」。任一指标超标，即触发剪枝。<br />
                        3. <span className="font-semibold text-white">智能择优</span>: 即使是受限于总仓位上限，算法依然优先削减“风险贡献大”的独立或相关品种，而保护对冲品种。<br />
                        <span className="text-indigo-200 mt-1 block border-t border-gray-700 pt-1">
                            结果：严格守住总风险底线，但自动向对冲组合倾斜（如 A/C 对冲组合的权重会自动高于独立的 B 品种）。
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                {step === 1 && (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                            <Grid size={32} className="text-indigo-500" />
                        </div>
                        <div className="text-center max-w-xs">
                            <p className="text-gray-900 font-medium mb-1">定义投资组合 (Define Portfolio)</p>
                            <p className="text-xs text-gray-500">请输入您计划同时持仓的品种数量 (2-10个)。</p>
                        </div>

                        <div className="flex items-center gap-2 w-full max-w-[200px]">
                            <button
                                onClick={() => setAssetCount(Math.max(2, assetCount - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                            >-</button>
                            <div className="flex-1 text-center font-mono text-xl font-bold text-gray-800 border-b-2 border-indigo-100 pb-1">
                                {assetCount}
                            </div>
                            <button
                                onClick={() => setAssetCount(Math.min(10, assetCount + 1))}
                                className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
                            >+</button>
                        </div>

                        <button
                            onClick={handleSetup}
                            className="w-full max-w-[200px] flex items-center justify-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            下一步 (Next) <ArrowRight size={16} className="ml-1.5" />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Controls Area */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <label className="font-semibold text-gray-700 flex items-center gap-1">
                                    单笔风险上限 (Max Single Risk)
                                    <span className="text-gray-400 font-normal" title="默认为 Total Heat / sqrt(N)">(Default: Auto)</span>
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={maxSingleRisk}
                                        onChange={(e) => setMaxSingleRisk(parseFloat(e.target.value))}
                                        className="w-16 h-6 text-right text-xs border border-gray-300 rounded px-1"
                                        step={0.1}
                                    />
                                    <span className="text-gray-500">%</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={allowOverAllocation}
                                            onChange={(e) => setAllowOverAllocation(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </div>
                                    <span className="text-xs text-gray-600 select-none">允许对冲溢出 (Allow Over-Allocation)</span>
                                </label>
                                <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                                    <RotateCcw size={12} />
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mb-2 font-medium">配置相关性矩阵 (Matrix):</p>

                        {/* Matrix Container */}
                        <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-gray-50/50 relative">
                            <table className="min-w-full text-xs">
                                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-2 border-b border-r border-gray-200 bg-gray-100 sticky left-0 z-20 min-w-[80px]">
                                            <span className="text-[10px] text-gray-400 font-mono">X \ Y</span>
                                        </th>
                                        {assetNames.map((name, i) => (
                                            <th key={i} className="p-2 border-b border-gray-200 font-medium text-gray-600 whitespace-nowrap min-w-[100px] text-left">
                                                {name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {assetNames.map((rowName, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-gray-50">
                                            {/* Row Header (Input) */}
                                            <th className="p-1 border-r border-b border-gray-200 bg-gray-50 sticky left-0 z-10">
                                                <input
                                                    type="text"
                                                    value={rowName}
                                                    onChange={(e) => handleNameChange(rIdx, e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-gray-700 px-1 py-1 rounded"
                                                />
                                            </th>
                                            {/* Cells */}
                                            {correlationMatrix[rIdx].map((val, cIdx) => (
                                                <td key={cIdx} className={`p-1 border-b border-gray-100 text-center ${rIdx === cIdx ? 'bg-gray-100' : ''}`}>
                                                    {rIdx === cIdx ? (
                                                        <span className="text-gray-300 font-mono">-</span>
                                                    ) : (
                                                        <select
                                                            value={val}
                                                            onChange={(e) => handleCorrelationChange(rIdx, cIdx, e.target.value as CorrelationType)}
                                                            className={`w-full text-[10px] py-1 pl-1 pr-4 border-none rounded focus:ring-1 focus:ring-indigo-500 cursor-pointer ${CORRELATION_COLORS[val]}`}
                                                        >
                                                            {Object.entries(CORRELATION_LABELS).map(([k, label]) => (
                                                                <option key={k} value={k}>{label}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={calculateAllocations}
                            className="mt-4 w-full flex items-center justify-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Calculator size={16} className="mr-2" /> 计算分配 (Run Allocation)
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check size={16} className="text-green-600" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm">分配结果 (Results)</h3>
                            </div>
                            <div className="text-xs text-right">
                                <span className="text-gray-400 block">Total Heat Limit: {totalHeat.toFixed(1)}%</span>
                                <span className={`font-mono font-bold ${allocationResults.reduce((a, b) => a + b.finalRisk, 0) > totalHeat * (allowOverAllocation ? 1.25 : 1.0)
                                    ? 'text-amber-600'
                                    : 'text-indigo-600'
                                    }`}>
                                    Allocated (Nominal): {allocationResults.reduce((a, b) => a + b.finalRisk, 0).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">品种 (Asset)</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">风险 (Risk %)</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">限制源 (Constraint)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {allocationResults.map((res, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 font-medium text-gray-800">{res.name}</td>
                                            <td className="px-3 py-2 text-right font-mono font-bold text-indigo-700">
                                                {res.finalRisk.toFixed(2)}%
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {res.constraint !== 'None' ? (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${res.constraint === 'Risk Pruning'
                                                        ? 'text-amber-600 bg-amber-50 border-amber-100'
                                                        : res.constraint === 'Single Cap'
                                                            ? 'text-gray-500 bg-gray-50 border-gray-100'
                                                            : 'text-red-500 bg-red-50 border-red-100'
                                                        }`}>
                                                        {res.constraint}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={handleEditConfig}
                            className="mt-4 flex items-center justify-center text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline py-2"
                        >
                            <Settings size={12} className="mr-1" /> 修改参数 & 矩阵 (Edit Params)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Optimal Position Sizing Widget ---

const OptimalPositionSizingWidget: React.FC<{ rDistribution: number[] }> = ({ rDistribution }) => {
    const [config, setConfig] = useState<OptimalFConfig>({
        successThreshold: 100,
        failureThreshold: -25,
        tradesPerSim: 100,
        totalSims: 10000,
        riskMode: RiskMode.FIXED_FRACTIONAL
    });

    const [isCalculating, setIsCalculating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultData, setResultData] = useState<OptimalFAnalysisResult | null>(null);

    // Toast Notification State
    const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' } | null>(null);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const validateConfig = (c: OptimalFConfig) => {
        let corrected = { ...c };
        let hasChanges = false;
        let reasons: string[] = [];

        if (corrected.successThreshold < 0) {
            corrected.successThreshold = 0;
            hasChanges = true;
            reasons.push("成功阈值≥0%");
        }

        if (corrected.failureThreshold < -100) {
            corrected.failureThreshold = -100;
            hasChanges = true;
            reasons.push("失败阈值≥-100%");
        }
        if (corrected.failureThreshold > 0) {
            corrected.failureThreshold = 0;
            hasChanges = true;
            reasons.push("失败阈值≤0%");
        }

        if (corrected.tradesPerSim < 100) {
            corrected.tradesPerSim = 100;
            hasChanges = true;
            reasons.push("交易≥100");
        }
        if (corrected.tradesPerSim > 1000) {
            corrected.tradesPerSim = 1000;
            hasChanges = true;
            reasons.push("交易≤1000");
        }

        if (corrected.totalSims < 10000) {
            corrected.totalSims = 10000;
            hasChanges = true;
            reasons.push("轮数≥1w");
        }
        if (corrected.totalSims > 100000) {
            corrected.totalSims = 100000;
            hasChanges = true;
            reasons.push("轮数≤10w");
        }

        return { corrected, hasChanges, reasons };
    };

    const handleBlur = () => {
        const { corrected, hasChanges } = validateConfig(config);
        if (hasChanges) {
            setConfig(corrected);
        }
    };

    const runAnalysis = async () => {
        // Correct config on run (in case user didn't blur)
        const { corrected, hasChanges, reasons } = validateConfig(config);

        if (hasChanges) {
            setConfig(corrected);
            setToast({ msg: `参数已自动修正: ${reasons.join(', ')}`, type: 'info' });
            // Proceed with corrected values
        }

        setIsCalculating(true);
        setProgress(0);
        setResultData(null);

        // Use setTimeout to allow UI update
        setTimeout(async () => {
            const generator = calculateOptimalF(rDistribution, corrected); // Use corrected directly
            let done = false;
            let finalRes: any = null;

            while (!done) {
                const next = await generator.next();
                if (next.done) {
                    done = true;
                    finalRes = next.value;
                } else {
                    setProgress(next.value as number);
                    // Yield to main thread to render progress bar
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
            setResultData(finalRes as OptimalFAnalysisResult);
            setIsCalculating(false);
        }, 50);
    };

    const renderGain = (val: number) => {
        // Threshold: 10^10 = 10,000,000,000
        if (val > 10000000000) {
            return (
                <div className="flex flex-col items-start justify-center">
                    <span className="text-purple-600 font-bold flex items-center gap-1">
                        <Rocket size={12} /> 突破天际
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium scale-90 origin-left">
                        (大于 10^10%)
                    </span>
                </div>
            );
        }

        // Only add + sign if positive. 
        // Negative numbers already have the minus sign from toString().
        const sign = val > 0 ? '+' : '';
        return <span className="text-gray-600">{sign}{val.toFixed(1)}%</span>;
    };

    // Helper component for small line charts
    const SmallChart: React.FC<{
        data: OptimalFChartPoint[],
        dataKey: string,
        color: string,
        title: string,
        yUnit?: string,
        capped?: boolean
    }> = ({ data, dataKey, color, title, yUnit = '%', capped = false }) => {

        // Define Cap Limits
        const MAX_CAP = 1000;
        const MIN_CAP = -100;

        // Prepare data: if capped, clamp value for display
        const chartData = capped
            ? data.map(d => ({
                ...d,
                _displayVal: Math.max(MIN_CAP, Math.min(MAX_CAP, d[dataKey as keyof OptimalFChartPoint]))
            }))
            : data;

        const valKey = capped ? '_displayVal' : dataKey;

        return (
            <div className="h-[200px] w-full flex flex-col bg-gray-50/50 rounded-lg border border-gray-100 p-2">
                <div className="flex justify-between items-center mb-2 pl-2 border-l-2" style={{ borderColor: color }}>
                    <p className="text-xs font-semibold text-gray-500">{title}</p>
                    {capped && (
                        <div className="flex gap-2 text-[9px] text-gray-400">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>&gt;1000%</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="risk"
                                tick={{ fontSize: 10 }}
                                interval="preserveStartEnd"
                                tickFormatter={(v) => `${v}%`}
                            />
                            <YAxis
                                tick={{ fontSize: 10 }}
                                domain={capped ? [MIN_CAP, MAX_CAP] : ['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                labelFormatter={(v) => `风险 (Risk): ${v}%`}
                                formatter={(val: number, name: string, props: any) => {
                                    // Show RAW value in tooltip
                                    const rawVal = capped ? props.payload[dataKey] : val;
                                    const displayVal = rawVal > 100000000 ? '>10^8' : rawVal.toFixed(1);
                                    return [`${displayVal}${yUnit}`, title]
                                }}
                            />
                            {capped && <ReferenceLine y={0} stroke="#000" strokeOpacity={0.1} />}
                            {capped && <ReferenceLine y={MAX_CAP} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.5} />}
                            {capped && <ReferenceLine y={MIN_CAP} stroke="#1f2937" strokeDasharray="2 2" strokeOpacity={0.5} />}

                            <Line
                                type="monotone"
                                dataKey={valKey}
                                stroke={color}
                                strokeWidth={2}
                                dot={(props: any) => {
                                    if (!capped) return null;
                                    const { cx, cy, payload } = props;
                                    const rawVal = payload[dataKey];

                                    if (rawVal > MAX_CAP) {
                                        return <circle cx={cx} cy={cy} r={2} fill="#ef4444" stroke="none" key={props.key} />; // Red for High Cap
                                    }
                                    return null;
                                }}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-8 relative">
            {/* Toast Notification */}
            {toast && (
                <div className="absolute top-4 right-4 z-50 bg-gray-800 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 max-w-sm border border-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Info size={16} className="text-indigo-400 flex-shrink-0" />
                    <span className="leading-tight">{toast.msg}</span>
                </div>
            )}

            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <Target className="text-indigo-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">蒙特卡洛最优风险敞口 (Monte Carlo Optimal Risk)</h2>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                        成功阈值 (Success) <span className="text-gray-400" title="定义“成功”的净增长率。例如：&#10;• 填 100% = 翻倍 (权益变为 2x)&#10;• 填 300% = 变为 4x&#10;• 填 900% = 十倍股 (10x)">?</span>
                    </label>
                    <div className="relative">
                        <SmartNumberInput
                            min={0}
                            value={config.successThreshold}
                            onChange={val => setConfig({ ...config, successThreshold: val })}
                            onBlur={handleBlur}
                            className="w-full border border-gray-300 rounded-md p-2 pl-2 pr-8 text-sm"
                        />
                        <span className="absolute right-3 top-2 text-gray-400 text-xs">%</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                        失败阈值 (Failure) <span className="text-gray-400" title="定义“破产”线 (基于初始本金)。例如：&#10;• 填 -25% = 剩 75% 本金时止损 (0.75x)&#10;• 填 -50% = 腰斩时止损 (0.5x)&#10;• 填 -100% = 归零 (0x)">?</span>
                    </label>
                    <div className="relative">
                        <SmartNumberInput
                            min={-100}
                            max={0}
                            value={config.failureThreshold}
                            onChange={val => setConfig({ ...config, failureThreshold: val })}
                            onBlur={handleBlur}
                            className="w-full border border-gray-300 rounded-md p-2 pl-2 pr-8 text-sm"
                        />
                        <span className="absolute right-3 top-2 text-gray-400 text-xs">%</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">风险模式 (Risk Mode)</label>
                    <select
                        value={config.riskMode}
                        onChange={e => setConfig({ ...config, riskMode: e.target.value as RiskMode })}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    >
                        <option value={RiskMode.FIXED_FRACTIONAL}>实时权益百分比 (复利)</option>
                        <option value={RiskMode.FIXED_INITIAL}>初始权益百分比 (单利)</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">交易笔数 (Trades)</label>
                    <SmartNumberInput
                        min={100}
                        max={1000}
                        value={config.tradesPerSim}
                        onChange={val => setConfig({ ...config, tradesPerSim: val })}
                        onBlur={handleBlur}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">模拟轮数 (Sims)</label>
                    <SmartNumberInput
                        min={10000}
                        max={100000}
                        value={config.totalSims}
                        onChange={val => setConfig({ ...config, totalSims: val })}
                        onBlur={handleBlur}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                </div>
            </div>

            {/* Action & Progress */}
            <div className="mb-6">
                {!isCalculating && !resultData && (
                    <button
                        onClick={runAnalysis}
                        className="flex items-center justify-center w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Play size={16} className="mr-2" /> 开始分析 (Run Analysis)
                    </button>
                )}

                {isCalculating && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-gray-600">
                            <span>正在分析 0.1% ~ 30.0% 的风险敞口...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {!isCalculating && resultData && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                            <Sparkles size={16} /> 分析完成
                        </p>
                        <button
                            onClick={runAnalysis}
                            className="text-indigo-600 text-sm hover:underline"
                        >
                            重新运行 (Rerun)
                        </button>
                    </div>
                )}
            </div>

            {/* Charts & Results Table */}
            {resultData && (
                <div className="space-y-6">
                    {/* 4 Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SmallChart
                            data={resultData.chartData}
                            dataKey="probSuccess"
                            title="成功概率 (Success Rate)"
                            color="#10b981"
                        />
                        <SmallChart
                            data={resultData.chartData}
                            dataKey="probRuin"
                            title="失败概率 (Ruin Rate)"
                            color="#ef4444"
                        />
                        <SmallChart
                            data={resultData.chartData}
                            dataKey="avgGain"
                            title="平均收益 % (Avg Gain)"
                            color="#3b82f6"
                            capped={true}
                        />
                        <SmallChart
                            data={resultData.chartData}
                            dataKey="medianGain"
                            title="中位数收益 % (Median Gain)"
                            color="#8b5cf6"
                            capped={true}
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目标 (Approach)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最优风险 % (Optimal Risk)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成功概率 (Prob Success)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">失败概率 (Prob Ruin)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均收益 % (Avg Gain)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中位数收益 % (Median Gain)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {resultData.bestRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">{row.approach}</td>
                                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{row.optimalRisk.toFixed(1)}%</td>
                                        <td className="px-4 py-3 text-gray-600">{row.probSuccess.toFixed(2)}%</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.probRuin > 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {row.probRuin.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{renderGain(row.avgGain)}</td>
                                        <td className="px-4 py-3">{renderGain(row.medianGain)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Sub-Views ---

const SystemAnalysisView: React.FC<{ results: SimulationResults }> = ({ results }) => {
    const { systemMetrics, riskMetrics, charts, stats, simulationConfig, equityCurves } = results;

    const handleScreenshot = async () => {
        const element = document.getElementById('dashboard-content');
        if (!element) return;

        // Find the button to hide it
        const btn = element.querySelector('.screenshot-btn') as HTMLElement;
        if (btn) btn.style.display = 'none';

        // Store original styles
        const originalOverflow = element.style.overflow;
        const originalHeight = element.style.height;
        const originalPosition = element.style.position;
        const originalWidth = element.style.width;
        const originalZIndex = element.style.zIndex;
        const originalBackground = element.style.background;

        const rect = element.getBoundingClientRect();
        const scrollTop = element.scrollTop;

        try {
            // Modify styles to capture full content
            element.style.position = 'fixed';
            element.style.top = '0';
            element.style.left = '0';
            element.style.width = `${rect.width}px`;
            element.style.height = 'auto';
            element.style.zIndex = '9999';
            element.style.overflow = 'visible';
            element.style.background = '#ffffff';

            const fullHeight = element.scrollHeight;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                height: fullHeight,
                windowHeight: fullHeight,
                scrollY: 0,
                x: 0,
                y: 0,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('dashboard-content');
                    if (clonedElement) {
                        clonedElement.style.height = 'auto';
                        clonedElement.style.overflow = 'visible';
                    }
                }
            });

            const link = document.createElement('a');
            link.download = `van-tharp-analysis-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Screenshot failed:", err);
            alert("截图失败，请重试");
        } finally {
            // Restore styles
            element.style.overflow = originalOverflow;
            element.style.height = originalHeight;
            element.style.position = originalPosition;
            element.style.width = originalWidth;
            element.style.zIndex = originalZIndex;
            element.style.background = originalBackground;
            element.scrollTop = scrollTop;

            if (btn) btn.style.display = '';
        }
    };

    const sqnHelpText = "T检验分数 (T-Score):\n• < 1.0：难以用于交易 (Poor)\n• 1.0 - 2.0：平均表现 (Average)\n• 2.0 - 3.0：优秀的系统 (Good)\n• 3.0 - 5.0：卓越的系统 (Excellent)\n• > 5.0：超级系统 (Super)";

    // Determine SQN visual style and text
    const getSqnState = (sqn: number) => {
        if (sqn <= 0) return {
            label: "不合格 (Warn)",
            valueClass: "text-5xl font-extrabold text-red-600 tracking-tight",
            badgeClass: "font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200",
            icon: <AlertTriangle size={36} className="text-red-500 mb-1" />
        };
        if (sqn < 1.0) return {
            label: "很一般 (Poor)",
            valueClass: "text-5xl font-extrabold text-orange-600 tracking-tight",
            badgeClass: "font-semibold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200",
            icon: null
        };
        if (sqn < 2.0) return {
            label: "一般 (Avg)",
            valueClass: "text-5xl font-extrabold text-amber-500 tracking-tight",
            badgeClass: "font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200",
            icon: null
        };
        if (sqn < 3.0) return {
            label: "优秀 (Good)",
            valueClass: "text-5xl font-extrabold text-blue-600 tracking-tight",
            badgeClass: "font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200",
            icon: null
        };
        if (sqn < 5.0) return {
            label: "卓越 (Excellent)",
            valueClass: "text-5xl font-extrabold text-emerald-600 tracking-tight",
            badgeClass: "font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200",
            icon: null
        };
        return {
            label: "超级系统 (Super)",
            valueClass: "text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-tight",
            badgeClass: "font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200",
            icon: <Sparkles size={36} className="text-purple-500 mb-1" />
        };
    };

    const sqnState = getSqnState(systemMetrics.sqn);

    // Calculate Sigma Intervals
    const mean = systemMetrics.expectancy;
    const sd = systemMetrics.standardDeviation;
    const n = systemMetrics.n;
    const standardError = n > 0 ? sd / Math.sqrt(n) : 0;

    const formatRange = (m: number, se: number, multiple: number) => {
        const lower = m - multiple * se;
        const upper = m + multiple * se;
        return `${lower.toFixed(2)} ~ ${upper.toFixed(2)}`;
    };

    return (
        <div id="dashboard-content" className="p-8 h-full overflow-y-auto space-y-8 relative">
            {/* Screenshot Button */}
            <div className="absolute top-8 right-8 z-20">
                <button
                    onClick={handleScreenshot}
                    className="screenshot-btn flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                    title="保存结果为图片"
                >
                    <Camera size={16} />
                    <span className="hidden sm:inline">保存图片 (Save)</span>
                </button>
            </div>

            {/* Top Cards: System Metrics */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 pr-32">系统指标 (System Metrics)</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <MetricCard
                        title="SQN 评分 (Score)"
                        value={systemMetrics.sqn.toFixed(2)}
                        subValue={sqnState.label}
                        helpText={sqnHelpText}
                        variant="highlighted"
                        valueClassName={sqnState.valueClass}
                        subValueClassName={sqnState.badgeClass}
                        prefixIcon={sqnState.icon}
                    />

                    <DualMetricCard
                        title1="期望值 (Expectancy)"
                        value1={`${mean.toFixed(2)}R`}
                        title2="标准差 (Std Dev)"
                        value2={sd.toFixed(2)}
                    >
                        <div className="max-w-[85%] mx-auto space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-medium">1σ (68.3%)</span>
                                <span className="flex-1 border-b border-gray-200 border-dashed mx-3 opacity-50"></span>
                                <span className="font-mono font-semibold text-gray-700">{formatRange(mean, standardError, 1)} R</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-medium">2σ (95.5%)</span>
                                <span className="flex-1 border-b border-gray-200 border-dashed mx-3 opacity-50"></span>
                                <span className="font-mono font-semibold text-gray-700">{formatRange(mean, standardError, 2)} R</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-medium">3σ (99.7%)</span>
                                <span className="flex-1 border-b border-gray-200 border-dashed mx-3 opacity-50"></span>
                                <span className="font-mono font-semibold text-gray-700">{formatRange(mean, standardError, 3)} R</span>
                            </div>
                        </div>
                    </DualMetricCard>

                    <DualMetricCard
                        title1="胜率 (Win Rate)"
                        value1={`${(systemMetrics.winRate * 100).toFixed(1)}%`}
                        title2="盈亏比 (P/L Ratio)"
                        value2={systemMetrics.profitFactor.toFixed(2)}
                    >
                        <div className="flex items-center justify-center h-full text-xs text-gray-400 italic">
                            基于 {systemMetrics.n} 笔基础交易数据 (Based on {systemMetrics.n} trades)
                        </div>
                    </DualMetricCard>
                </div>
                {systemMetrics.rUnitSize && (
                    <div className="mt-2 text-xs text-gray-500 text-right">
                        * 自动计算的 1R 单位 (Auto 1R): <span className="font-mono font-medium text-gray-700">${systemMetrics.rUnitSize.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Middle: Risk Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">风险概况 (Risk Profile - {simulationConfig.totalSimulations.toLocaleString()} Sims)</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <p className="text-indigo-600 text-xs font-bold uppercase">盈利概率 (Prob. Profit)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{riskMetrics.probabilityOfProfit.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500 mt-1">最终收益 &gt; 0R 的概率 (Final &gt; 0R)</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <p className="text-red-600 text-xs font-bold uppercase">95% 回撤持续期 (95% DD Duration)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">≤ {riskMetrics.p95DrawdownDuration}</p>
                            <p className="text-xs text-gray-500 mt-1">95% 的回撤在此期间内恢复 (95% Recover Within)</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <p className="text-green-600 text-xs font-bold uppercase">回报 / 风险比 (Reward/Risk)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{riskMetrics.rewardRiskRatio.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">平均收益 / 平均最大回撤 (Avg Return / Avg Max DD)</p>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">模拟超参 (Sim Config)</h2>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">每轮模拟交易次数 (Trades/Sim)</span>
                            <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">{simulationConfig.tradesPerSimulation}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">总模拟轮数 (Total Sims)</span>
                            <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">{simulationConfig.totalSimulations.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">基础样本 N (Base Sample N)</span>
                            <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">{systemMetrics.n}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW: Equity Curves Chart */}
            <div>
                <EquityCurvesChart curves={equityCurves || []} />
            </div>

            {/* Bottom: Charts Grid */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">蒙特卡洛分布直方图 (Monte Carlo Distributions)</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <HistogramChart data={charts.maxDrawdown} title="最大回撤 (Max Drawdown)" color="#ef4444" xLabel="回撤深度 (Drawdown R)" />
                        <StatTable stats={stats.maxDrawdown} title="回撤统计 (Stats)" color="bg-red-500" />
                    </div>
                    <div className="space-y-4">
                        <HistogramChart data={charts.finalResult} title="最终权益 (Final Equity)" color="#4f46e5" xLabel="权益 (Equity R)" />
                        <StatTable stats={stats.finalResult} title="最终结果统计 (Stats)" color="bg-indigo-500" />
                    </div>
                    <div className="space-y-4">
                        <HistogramChart data={charts.maxProfit} title="最高权益峰值 (Max Peak)" color="#10b981" xLabel="峰值 (Peak R)" />
                        <StatTable stats={stats.maxProfit} title="峰值统计 (Stats)" color="bg-green-500" />
                    </div>
                    <div className="space-y-4">
                        <HistogramChart data={charts.consecLosses} title="最大连败 (Max Consec. Losses)" color="#f59e0b" xLabel="连续亏损次数 (Streak Count)" />
                        <StatTable stats={stats.consecLosses} title="连败统计 (Stats)" color="bg-amber-500" />
                    </div>
                    <div className="space-y-4">
                        <HistogramChart data={charts.consecWins} title="最大连胜 (Max Consec. Wins)" color="#06b6d4" xLabel="连续盈利次数 (Streak Count)" />
                        <StatTable stats={stats.consecWins} title="连胜统计 (Stats)" color="bg-cyan-500" />
                    </div>
                </div>
            </div>

            <div className="pt-8 pb-4 text-center text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <span>Van Tharp Position Sizing Analyzer &copy; {new Date().getFullYear()}</span>
                <span className="hidden sm:inline text-gray-300">|</span>
                <span>Created by <span className="font-semibold text-gray-500">Ain</span></span>
            </div>
        </div>
    );
};

const PositionManagementView: React.FC<{ results: SimulationResults }> = ({ results }) => {
    const { systemMetrics } = results;

    const handleScreenshot = async () => {
        const element = document.getElementById('position-dashboard-content');
        if (!element) return;

        // Find the button to hide it
        const btn = element.querySelector('.screenshot-btn') as HTMLElement;
        if (btn) btn.style.display = 'none';

        // Store original styles
        const originalOverflow = element.style.overflow;
        const originalHeight = element.style.height;
        const originalPosition = element.style.position;
        const originalWidth = element.style.width;
        const originalZIndex = element.style.zIndex;
        const originalBackground = element.style.background;

        const rect = element.getBoundingClientRect();
        const scrollTop = element.scrollTop;

        try {
            // Modify styles to capture full content
            element.style.position = 'fixed';
            element.style.top = '0';
            element.style.left = '0';
            element.style.width = `${rect.width}px`;
            element.style.height = 'auto';
            element.style.zIndex = '9999';
            element.style.overflow = 'visible';
            element.style.background = '#f9fafb';

            const fullHeight = element.scrollHeight;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                height: fullHeight,
                windowHeight: fullHeight,
                scrollY: 0,
                x: 0,
                y: 0,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('position-dashboard-content');
                    if (clonedElement) {
                        clonedElement.style.height = 'auto';
                        clonedElement.style.overflow = 'visible';
                    }
                }
            });

            const link = document.createElement('a');
            link.download = `van-tharp-position-sizing-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Screenshot failed:", err);
            alert("截图失败，请重试");
        } finally {
            // Restore styles
            element.style.overflow = originalOverflow;
            element.style.height = originalHeight;
            element.style.position = originalPosition;
            element.style.width = originalWidth;
            element.style.zIndex = originalZIndex;
            element.style.background = originalBackground;
            element.scrollTop = scrollTop;

            if (btn) btn.style.display = '';
        }
    };

    // 1. Calculate SQN Heat (Ideal World)
    const calculateSqnHeat = (sqn: number): number => {
        if (sqn < 1.3) return 1.0;
        if (sqn < 1.7) return 1.0 + ((sqn - 1.3) / (1.7 - 1.3)) * (4 - 1);
        if (sqn < 2.5) return 4.0 + ((sqn - 1.7) / (2.5 - 1.7)) * (8 - 4);
        if (sqn < 3.0) return 8.0 + ((sqn - 2.5) / (3.0 - 2.5)) * (12 - 8);
        if (sqn < 4.0) return 12.0 + ((sqn - 3.0) / (4.0 - 3.0)) * (15 - 12);
        if (sqn < 5.0) return 15.0 + ((sqn - 4.0) / (5.0 - 4.0)) * (20 - 15);
        return Math.min(25.0, 20.0 + ((sqn - 5.0) / 1.0) * 5);
    };

    const sqnHeat = calculateSqnHeat(systemMetrics.sqn);

    // 2. Calculate Worst-Case Constraint
    const worstR = systemMetrics.worstR;
    const worstLoss = worstR < 0 ? Math.abs(worstR) : 0;

    const constraintHeat = worstLoss > 0 ? (100 / worstLoss) : 100;

    // 3. Final Recommendation (Min of both)
    const finalHeat = Math.min(sqnHeat, constraintHeat);
    const isConstrained = constraintHeat < sqnHeat;

    // Visual helpers
    const getHeatColor = (h: number) => {
        if (h <= 5) return 'text-emerald-600';
        if (h <= 12) return 'text-blue-600';
        if (h <= 18) return 'text-amber-600';
        return 'text-red-600';
    };

    const getHeatGradient = (h: number) => {
        if (h <= 5) return 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
        if (h <= 12) return 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]';
        if (h <= 18) return 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_12px_rgba(217,119,6,0.4)]';
        return 'bg-gradient-to-r from-red-500 to-red-700 shadow-[0_0_12px_rgba(220,38,38,0.5)]';
    };

    // Ticks for the ruler (0, 5, 10, 15, 20, 25)
    const rulerTicks = [0, 5, 10, 15, 20, 25];

    // Prepare distribution pool for the widget
    const preparePool = () => {
        // Using the clean type now
        return results.rDistribution || [];
    };

    return (
        <div id="position-dashboard-content" className="p-8 h-full overflow-y-auto bg-gray-50/50 relative">
            {/* Screenshot Button */}
            <div className="absolute top-8 right-8 z-20">
                <button
                    onClick={handleScreenshot}
                    className="screenshot-btn flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                    title="保存结果为图片"
                >
                    <Camera size={16} />
                    <span className="hidden sm:inline">保存图片 (Save)</span>
                </button>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <PieChart className="text-indigo-600" size={24} />
                头寸与风险管理模型 (Position & Risk Models)
            </h2>

            {/* --- 第一行：Portfolio Heat (保持原来的 1/3 宽度控制，避免在大屏上过宽) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* --- Card 1: Portfolio Heat --- */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col min-h-[380px]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm uppercase tracking-wide">
                            <ShieldAlert size={16} />
                            组合总风险敞口 (Portfolio Heat)
                        </div>
                        <div className="group relative">
                            <Info size={16} className="text-gray-400 cursor-help hover:text-indigo-600 transition-colors" />
                            <div className="absolute right-0 top-6 w-80 p-4 bg-gray-900 text-white text-xs rounded shadow-xl z-50 hidden group-hover:block leading-relaxed whitespace-pre-wrap">
                                <span className="font-bold text-indigo-300 block mb-1">定义 (Definition):</span>
                                H (Heat) 代表在任意时刻，如果账户内所有持仓同时触发生效止损，账户总权益允许遭受的最大损失百分比。
                                <br /><br />
                                <span className="font-bold text-indigo-300 block mb-1">计算逻辑 (Logic):</span>
                                最终建议值取以下两者的较小值：<br />
                                1. <span className="font-semibold text-white">SQN 模型建议值</span>：基于 Van Tharp 的阶梯建议拟合而成。<br />
                                2. <span className="font-semibold text-white">生存约束 (100% / |最差R|)</span>：确保历史上最差的一笔交易不会导致账户归零。
                            </div>
                        </div>
                    </div>

                    {/* Main Value Area */}
                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                        <div className={`text-6xl font-extrabold tracking-tighter ${getHeatColor(finalHeat)}`}>
                            {finalHeat.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-2 uppercase tracking-wider">建议最大总风险 (Rec. Max Total Risk)</div>
                    </div>

                    <div className="mt-auto space-y-8">
                        {/* Thermometer Bar & Granular Ruler */}
                        <div className="relative">
                            {/* Bar Track with Inner Shadow */}
                            <div className="relative h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200/50">
                                {/* Gradient Fill Bar with Glow */}
                                <div
                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${getHeatGradient(finalHeat)}`}
                                    style={{ width: `${Math.min(100, (finalHeat / 25) * 100)}%` }}
                                ></div>
                            </div>

                            {/* Ruler Labels */}
                            <div className="relative mt-2 h-4 select-none">
                                {rulerTicks.map((tick) => (
                                    <div
                                        key={tick}
                                        className="absolute flex flex-col items-center transform -translate-x-1/2"
                                        style={{ left: `${(tick / 25) * 100}%` }}
                                    >
                                        {/* Small vertical tick line */}
                                        <div className="w-px h-1 bg-gray-300 mb-1"></div>
                                        {/* Number Label */}
                                        <span className={`text-[9px] font-mono ${Math.abs(finalHeat - tick) < 2 ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>
                                            {tick === 25 ? '25%+' : tick}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className={`bg-gray-50 p-2.5 rounded border ${!isConstrained ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100'}`}>
                                <div className="text-gray-400 mb-1 flex items-center gap-1.5">
                                    <Sparkles size={12} /> SQN 模型
                                </div>
                                <div className={`font-mono text-base font-bold ${!isConstrained ? 'text-indigo-600' : 'text-gray-600'}`}>
                                    {sqnHeat.toFixed(1)}%
                                </div>
                            </div>
                            <div className={`bg-gray-50 p-2.5 rounded border ${isConstrained ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100'}`}>
                                <div className="text-gray-400 mb-1 flex items-center gap-1.5" title={`基于最差单笔: ${worstR}R`}>
                                    <Scale size={12} /> 生存约束
                                </div>
                                <div className={`font-mono text-base font-bold ${isConstrained ? 'text-amber-600' : 'text-gray-600'}`}>
                                    {constraintHeat >= 100 ? '>100%' : `${constraintHeat.toFixed(1)}%`}
                                </div>
                            </div>
                        </div>

                        {isConstrained && (
                            <div className="text-[10px] leading-relaxed text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-100 flex items-start gap-2">
                                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                <span>
                                    <span className="font-bold">风控触发:</span> 历史最大单笔亏损 ({worstR}R) 导致 SQN 建议值过于激进，已自动下调。
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                {/* --- 第二行：Risk Allocation Widget (现在独立出来，占满全宽) --- */}
                {/* Added w-full and removed from grid */}
                <div className="lg:col-span-2 w-full">
                    <RiskAllocationWidget totalHeat={finalHeat} />
                </div>
            </div>



            {/* Optimal Position Sizing Widget */}
            <OptimalPositionSizingWidget rDistribution={preparePool()} />
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ results, isSidebarOpen }) => {
    const [activeTab, setActiveTab] = useState<'system' | 'position'>('system');

    if (!results) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <BarChart2 size={32} className="text-gray-300" />
                </div>
                <p className="text-lg font-medium text-gray-600">暂无模拟数据 (No Data)</p>
                <p className="text-sm mt-2">请在左侧配置参数并点击“运行蒙特卡洛模拟”开始。</p>
                <p className="text-xs text-gray-400 mt-1">Please configure parameters on the left and click "Run" to start.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header Tabs */}
            <div className="border-b border-gray-200 px-8 flex items-center gap-8 bg-white shadow-sm z-10 flex-shrink-0">
                <button
                    onClick={() => setActiveTab('system')}
                    className={`py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'system' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    <BarChart2 size={18} />
                    系统分析 (System Analysis)
                </button>
                <button
                    onClick={() => setActiveTab('position')}
                    className={`py-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'position' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    <PieChart size={18} />
                    头寸管理 (Position Sizing)
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'system' ? (
                    <SystemAnalysisView results={results} />
                ) : (
                    <PositionManagementView results={results} />
                )}
            </div>
        </div>
    );
};
