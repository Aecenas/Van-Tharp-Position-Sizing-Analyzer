import React, { useState } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';
import { AppMode, FrequencyRow, SimulationResults, SimulationConfig } from './types';
import { parseRawData, calculateBasicMetrics, runMonteCarloSimulation } from './utils/calculations';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.FREQUENCY);
  
  // State for Frequency Mode
  const [frequencyData, setFrequencyData] = useState<FrequencyRow[]>([
    { id: '1', count: 5, rValue: -1 },
    { id: '2', count: 3, rValue: 2 },
    { id: '3', count: 2, rValue: 5 },
  ]);

  // State for Raw PnL Mode
  const [rawPnlText, setRawPnlText] = useState<string>('');
  
  // Simulation Configuration
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
    totalSimulations: 10000,
    tradesPerSimulation: 100
  });

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Results State
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleRunSimulation = async () => {
    setIsCalculating(true);
    
    // Use setTimeout to allow UI to render the loading state before the heavy sync calculation blocks the thread
    setTimeout(() => {
      try {
        let rDistribution: number[] = [];
        let rUnitSize: number | undefined = undefined;
        let n = 100; // Default for Frequency mode

        if (mode === AppMode.FREQUENCY) {
          // Flatten distribution
          frequencyData.forEach(row => {
            const count = Math.max(0, Math.floor(row.count));
            for (let i = 0; i < count; i++) {
              rDistribution.push(row.rValue);
            }
          });
          
          if (rDistribution.length === 0) {
            alert("请至少添加一行数据，且次数大于 0。");
            setIsCalculating(false);
            return;
          }

        } else {
          // Mode B: Raw PnL
          const parsed = parseRawData(rawPnlText);
          if (parsed.error) {
            alert(parsed.error);
            setIsCalculating(false);
            return;
          }
          rDistribution = parsed.rMultiples;
          rUnitSize = parsed.rUnit;
          n = parsed.validCount;
        }

        // 1. Calculate Static Metrics
        const systemMetrics = calculateBasicMetrics(rDistribution, n, rUnitSize);

        // 2. Run Monte Carlo with dynamic config
        const simulationResults = runMonteCarloSimulation(rDistribution, systemMetrics, simulationConfig);

        setResults(simulationResults);

      } catch (error) {
        console.error("Simulation error", error);
        alert("模拟过程中发生错误，请检查您的输入数据。");
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-gray-900 relative">
      {/* Left Panel */}
      {isSidebarOpen && (
        <div className="w-[350px] lg:w-1/3 flex-shrink-0 z-10 h-full">
          <InputSection 
            mode={mode}
            setMode={setMode}
            frequencyData={frequencyData}
            setFrequencyData={setFrequencyData}
            rawPnlText={rawPnlText}
            setRawPnlText={setRawPnlText}
            onRun={handleRunSimulation}
            isCalculating={isCalculating}
            onToggleSidebar={() => setIsSidebarOpen(false)}
            simulationConfig={simulationConfig}
            setSimulationConfig={setSimulationConfig}
          />
        </div>
      )}

      {/* Floating Open Button (visible when sidebar is closed) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-3 left-4 z-50 p-2 bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-indigo-600 hover:shadow-md rounded-md transition-all"
          title="展开侧边栏"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* Right Panel: Remaining width */}
      <div className="flex-1 min-w-0 bg-white">
        <Dashboard results={results} isSidebarOpen={isSidebarOpen} />
      </div>
    </div>
  );
};

export default App;