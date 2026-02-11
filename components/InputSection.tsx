import React, { useRef, useState, useEffect } from 'react';
import { Plus, Trash2, Play, PanelLeftClose, Download, Upload, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { AppMode, FrequencyRow, SimulationConfig } from '../types';
import * as XLSX from 'xlsx';

interface InputSectionProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  frequencyData: FrequencyRow[];
  setFrequencyData: (data: FrequencyRow[]) => void;
  rawPnlText: string;
  setRawPnlText: (text: string) => void;
  onRun: () => void;
  isCalculating: boolean;
  onToggleSidebar: () => void;
  simulationConfig: SimulationConfig;
  setSimulationConfig: (config: SimulationConfig) => void;
}

const parseStrictNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const numericPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
  if (!numericPattern.test(trimmed)) return null;

  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
};

const extractStrictNumbersFromText = (text: string): number[] => (
  text
    .split(/[\n,;]+/)
    .map(token => parseStrictNumber(token))
    .filter((n): n is number => n !== null)
);

// --- Smart Input Component ---
// Allows typing "-", empty string, decimals without snapping back to 0 immediately
const SmartNumberInput = ({
  value,
  onChange,
  step = 1,
  min,
  className,
}: {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  className?: string;
}) => {
  const [text, setText] = useState(value.toString());

  // Sync with parent props (e.g. when a preset is loaded)
  useEffect(() => {
    // Only force update local text if the mathematical value actually changed
    // This prevents cursor jumping or resetting "1." to "1" while typing
    if (Number(text) !== value) {
      setText(value.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setText(newVal);

    const parsed = parseFloat(newVal);
    // Only push to parent if it's a valid number and not an incomplete state (like "-" or "1.")
    if (!isNaN(parsed)) {
      if (!newVal.endsWith('.') && newVal !== '-' && newVal !== '-0') {
        onChange(parsed);
      }
    } else if (newVal === '') {
      // Optional: Decide if empty should be 0 or keep as is. 
      // For this app, safer to treat as 0 in data but keep empty in UI until blur
      onChange(0);
    }
  };

  const handleBlur = () => {
    let parsed = parseFloat(text);
    if (isNaN(parsed)) parsed = 0;

    // Apply min constraint if defined (e.g. for count > 0)
    if (min !== undefined && parsed < min) parsed = min;

    setText(parsed.toString());
    onChange(parsed);
  };

  return (
    <input
      type="number"
      step={step}
      min={min}
      className={className}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};

const PRESETS = [
  {
    id: 'custom',
    name: '默认 / 自定义 (Default / Custom)',
    data: [
      { count: 5, rValue: -1 },
      { count: 3, rValue: 2 },
      { count: 2, rValue: 5 },
    ]
  },
  {
    id: 'lottery',
    name: '福利彩票 (Welfare Lottery)',
    data: [
      { count: 965, rValue: -1 },
      { count: 35, rValue: 50 }
    ]
  },
  {
    id: 'super-lottery',
    name: '赌狗彩票 (Gambling Dog Lottery)',
    data: [
      { count: 9985, rValue: -1 },
      { count: 15, rValue: 1000 }
    ]
  },
  {
    id: 'high-win-system',
    name: '高胜系统 (High-Win System)',
    data: [
      { count: 10, rValue: -3.5 },
      { count: 10, rValue: -2 },
      { count: 70, rValue: 1 },
      { count: 10, rValue: 2 }
    ]
  },
  {
    id: 'careful-system',
    name: '小心翼翼 (I\'m Afraid)',
    data: [
      { count: 10, rValue: -1 },
      { count: 10, rValue: 1.3 }
    ]
  },
  {
    id: 'leeks-system',
    name: '截断盈利-奔跑亏损 (I\'m a Bagholder)',
    data: [
      { count: 1, rValue: -10 },
      { count: 9, rValue: 1 }
    ]
  },
  {
    id: 'daoing-system',
    name: '频繁止损-悟道中 (Path to Wisdom)',
    data: [
      { count: 55, rValue: -1 },
      { count: 12, rValue: -2 },
      { count: 3, rValue: -5 },
      { count: 5, rValue: 1 },
      { count: 4, rValue: 5 },
      { count: 3, rValue: 10 },
      { count: 3, rValue: 25 }
    ]
  },
  {
    id: 'half-dao-system',
    name: '半步悟道 (Half in Wisdom)',
    data: [
      { count: 2, rValue: -10 },
      { count: 4, rValue: -5 },
      { count: 10, rValue: -1 },
      { count: 5, rValue: 3 },
      { count: 2, rValue: 15 },
      { count: 1, rValue: 30 }
    ]
  },
  {
    id: 'go-big-system',
    name: '只玩大的 (Go Big or Go Home)',
    data: [
      { count: 18, rValue: -1 },
      { count: 2, rValue: 50 }
    ]
  },
  {
    id: 'classic-sqn1-system',
    name: '经典SQN=1.0 (SQN 1.0 System)',
    data: [
      { count: 23, rValue: -5 },
      { count: 55, rValue: -1 },
      { count: 12, rValue: 3 },
      { count: 6, rValue: 15 },
      { count: 4, rValue: 30 }
    ]
  },
  {
    id: 'classic-sqn2-system',
    name: '经典SQN=2.0 (SQN 2.0 System)',
    data: [
      { count: 1, rValue: -5 },
      { count: 6, rValue: -3 },
      { count: 11, rValue: -2 },
      { count: 10, rValue: -1 },
      { count: 57, rValue: 1 },
      { count: 15, rValue: 2 }
    ]
  },
  {
    id: 'classic-sqn3-system',
    name: '经典SQN=3.0 (SQN 3.0 System)',
    data: [
      { count: 2, rValue: -5 },
      { count: 2, rValue: -1.5 },
      { count: 32, rValue: -1 },
      { count: 28, rValue: 1 },
      { count: 21, rValue: 1.5 },
      { count: 15, rValue: 2 }
    ]
  },
  {
    id: 'classic-sqn4-system',
    name: '经典SQN=4.0 (SQN 4.0 System)',
    data: [
      { count: 4, rValue: -5 },
      { count: 8, rValue: -2 },
      { count: 10, rValue: -1 },
      { count: 40, rValue: 1 },
      { count: 31, rValue: 2 },
      { count: 4, rValue: 5 },
      { count: 3, rValue: 10 }
    ]
  },
  {
    id: 'classic-sqn5-system',
    name: '经典SQN=5.0 (SQN 5.0 System)',
    data: [
      { count: 3, rValue: -5 },
      { count: 4, rValue: -2 },
      { count: 9, rValue: -1 },
      { count: 42, rValue: 1 },
      { count: 33, rValue: 2 },
      { count: 5, rValue: 5 },
      { count: 4, rValue: 10 }
    ]
  },
  {
    id: 'classic-sqn7-system',
    name: '经典SQN=7.0 (SQN 7.0 System)',
    data: [
      { count: 1, rValue: -5 },
      { count: 6, rValue: -2 },
      { count: 11, rValue: -1 },
      { count: 31, rValue: 1 },
      { count: 23, rValue: 2 },
      { count: 22, rValue: 5 },
      { count: 6, rValue: 10 }
    ]
  }
];

export const InputSection: React.FC<InputSectionProps> = ({
  mode,
  setMode,
  frequencyData,
  setFrequencyData,
  rawPnlText,
  setRawPnlText,
  onRun,
  isCalculating,
  onToggleSidebar,
  simulationConfig,
  setSimulationConfig
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFrequencyRow = () => {
    setFrequencyData([...frequencyData, { id: crypto.randomUUID(), count: 1, rValue: 0 }]);
  };

  const updateFrequencyRow = (id: string, field: 'count' | 'rValue', value: number) => {
    setFrequencyData(frequencyData.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const removeFrequencyRow = (id: string) => {
    setFrequencyData(frequencyData.filter(row => row.id !== id));
  };

  const handleExport = () => {
    if (mode === AppMode.FREQUENCY) {
      const data = frequencyData.map(r => ({ Count: r.count, R_Value: r.rValue }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "FrequencyData");
      XLSX.writeFile(wb, "van_tharp_frequency.xlsx");
    } else {
      const lines = extractStrictNumbersFromText(rawPnlText);
      const data = lines.map(v => ({ PnL: v }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "RawPnL");
      XLSX.writeFile(wb, "van_tharp_pnl.xlsx");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const arrayBuffer = evt.target?.result;
      if (!arrayBuffer) return;

      try {
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (mode === AppMode.FREQUENCY) {
          const newFreqData: FrequencyRow[] = data.map((row: any) => {
            // Flexible column matching
            const keys = Object.keys(row);
            const values = Object.values(row) as number[];

            let count = 1;
            let rValue = 0;

            const countKey = keys.find(k => k.toLowerCase().includes('count') || k.toLowerCase().includes('次数'));
            if (countKey) count = Number(row[countKey]);
            else if (values.length > 0) count = Number(values[0]);

            const rKey = keys.find(k => k.toLowerCase().includes('r') || k.toLowerCase().includes('value') || k.toLowerCase().includes('倍数'));
            if (rKey) rValue = Number(row[rKey]);
            else if (values.length > 1) rValue = Number(values[1]);

            return { id: crypto.randomUUID(), count: isNaN(count) ? 1 : count, rValue: isNaN(rValue) ? 0 : rValue };
          });

          if (newFreqData.length > 0) {
            setFrequencyData(newFreqData);
          } else {
            alert("未能识别有效数据，请检查 Excel 格式。\n建议格式：两列，第一列为次数，第二列为 R 值。");
          }
        } else {
          // Raw PnL Mode
          const nums: number[] = [];
          data.forEach(row => {
            const values = Object.values(row);
            values.forEach(v => {
              const n = parseStrictNumber(String(v));
              if (n !== null) nums.push(n);
            });
          });

          if (nums.length > 0) {
            setRawPnlText(nums.join('\n'));
          } else {
            alert("未能识别有效数字，请检查 Excel 格式。");
          }
        }
      } catch (err) {
        console.error(err);
        alert("文件读取失败，请确保是有效的 .xlsx 文件。");
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  // Determine which preset is currently selected by matching data
  const getCurrentPresetId = () => {
    if (mode !== AppMode.FREQUENCY) return 'custom';

    for (const preset of PRESETS) {
      if (preset.id === 'custom') continue;
      if (frequencyData.length !== preset.data.length) continue;

      const sortedCurrent = [...frequencyData].sort((a, b) => a.rValue - b.rValue);
      const sortedPreset = [...preset.data].sort((a, b) => a.rValue - b.rValue);

      const isMatch = sortedCurrent.every((row, i) =>
        row.count === sortedPreset[i].count &&
        Math.abs(row.rValue - sortedPreset[i].rValue) < 0.001
      );

      if (isMatch) return preset.id;
    }
    return 'custom';
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;

    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      const newData = preset.data.map(d => ({
        ...d,
        id: crypto.randomUUID()
      }));
      setFrequencyData(newData);
    }
  };

  // Helper to count valid pnl lines
  const getPnlCount = () => {
    return extractStrictNumbersFromText(rawPnlText).length;
  };

  const pnlCount = getPnlCount();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-800">Van Tharp Analyzer</h1>
            {/* Author Badge */}
            <span className="px-2 py-0.5 rounded bg-gradient-to-b from-gray-100 to-gray-300 text-gray-700 border border-gray-400 text-[10px] font-extrabold tracking-widest shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] select-none ml-2" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
              BY AIN
            </span>
          </div>
          <p className="text-xs text-gray-500">头寸规模与 R 倍数分析 (Position Sizing & R-Multiple)</p>
        </div>
        <button
          onClick={onToggleSidebar}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="折叠侧边栏 (Collapse)"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">输入模式 (Input Mode)</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode(AppMode.FREQUENCY)}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all ${mode === AppMode.FREQUENCY
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              频率分布 (Frequency)
            </button>
            <button
              onClick={() => setMode(AppMode.RAW_PNL)}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded-md transition-all ${mode === AppMode.RAW_PNL
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              原始盈亏 (Raw P&L)
            </button>
          </div>
        </div>

        {mode === AppMode.FREQUENCY && (
          <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <label className="flex items-center text-xs font-semibold text-indigo-700 mb-2">
              <Sparkles size={12} className="mr-1.5" />
              探索预设模型 (Presets)
            </label>
            <select
              value={getCurrentPresetId()}
              onChange={handlePresetChange}
              className="block w-full rounded-md border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-1.5 pl-2 pr-8"
            >
              {PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Import/Export Toolbar */}
        <div className="flex space-x-2 mb-4">
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={handleImportClick}
            className="flex-1 flex items-center justify-center py-1.5 px-3 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} className="mr-1.5" /> 导入 (Import)
          </button>
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center py-1.5 px-3 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={14} className="mr-1.5" /> 导出 (Export)
          </button>
        </div>

        {mode === AppMode.FREQUENCY ? (
          <div>
            <div className="grid grid-cols-6 gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase">
              <div className="col-span-2">次数 (Count)</div>
              <div className="col-span-3">R 倍数 (R-Multiple)</div>
              <div className="col-span-1"></div>
            </div>
            <div className="space-y-2">
              {frequencyData.map((row) => (
                <div key={row.id} className="grid grid-cols-6 gap-2 items-center">
                  <SmartNumberInput
                    min={1}
                    value={row.count}
                    onChange={(val) => updateFrequencyRow(row.id, 'count', val)}
                    className="col-span-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                  <SmartNumberInput
                    step={1}
                    value={row.rValue}
                    onChange={(val) => updateFrequencyRow(row.id, 'rValue', val)}
                    className="col-span-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                  <button
                    onClick={() => removeFrequencyRow(row.id)}
                    className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addFrequencyRow}
              className="mt-4 flex items-center justify-center w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
            >
              <Plus size={16} className="mr-2" /> 添加行 (Add Row)
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">盈亏列表 (每行一个金额) / P&L List</label>
            <textarea
              value={rawPnlText}
              onChange={(e) => setRawPnlText(e.target.value)}
              placeholder="-150&#10;300&#10;-100&#10;500..."
              className="w-full h-64 p-3 border rounded-md font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              提示 (Tip): 您可以直接粘贴 Excel 列数据，或者使用上方按钮导入文件。系统将自动计算 1R。(Paste Excel column data or Import. 1R is auto-calculated.)
            </p>
            <div className="mt-3">
              {pnlCount < 30 ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-600" />
                  <div className="leading-tight">
                    <span className="font-bold text-amber-800">注意:</span> 当前仅有 <span className="text-red-600 font-extrabold text-sm mx-0.5">{pnlCount}</span> 笔有效数据，必须提供至少 <span className="text-red-600 font-extrabold text-sm mx-0.5">30</span> 笔交易记录才能运行模拟。<br />
                    <span className="opacity-80 block mt-1">(Warning: Found <span className="text-red-600 font-bold">{pnlCount}</span> valid entries. At least <span className="text-red-600 font-bold">30</span> trades are required.)</span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <CheckCircle size={14} className="flex-shrink-0 mt-0.5 text-emerald-600" />
                  <div className="leading-tight">
                    <span className="font-bold text-emerald-800">就绪:</span> 已输入 <span className="text-emerald-700 font-extrabold text-sm mx-0.5">{pnlCount}</span> 笔有效数据，满足模拟要求。<br />
                    <span className="opacity-80 block mt-1">(Ready: Found <span className="text-emerald-700 font-bold">{pnlCount}</span> valid entries. Simulation can be run.)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">每轮模拟交易次数 (Trades/Sim)</label>
            <span className="text-xs font-mono text-indigo-600 font-bold">{simulationConfig.tradesPerSimulation}</span>
          </div>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={simulationConfig.tradesPerSimulation}
            onChange={(e) => setSimulationConfig({ ...simulationConfig, tradesPerSimulation: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>100</span>
            <span>1000</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">总模拟轮数 (Total Sims)</label>
            <span className="text-xs font-mono text-indigo-600 font-bold">{simulationConfig.totalSimulations.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="10000"
            max="100000"
            step="5000"
            value={simulationConfig.totalSimulations}
            onChange={(e) => setSimulationConfig({ ...simulationConfig, totalSimulations: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>10k</span>
            <span>100k</span>
          </div>
        </div>

        <button
          onClick={onRun}
          disabled={isCalculating}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating ? (
            <span className="flex items-center">计算中 (Calculating)...</span>
          ) : (
            <>
              <Play size={18} className="mr-2" /> 运行蒙特卡洛模拟 (Run)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
