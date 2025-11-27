

import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { BankName, StandardizedSegment } from '../types';
import { LayoutDashboard, TrendingUp, TrendingDown, Minus, Filter, ChevronDown, Check, Activity, Info } from 'lucide-react';

export const RelativePerformance: React.FC = () => {
  const { financialData, fxRateConfig } = useData();

  // --- State ---
  const [selectedMetric, setSelectedMetric] = useState('Net Interest Income');
  const [selectedSegment, setSelectedSegment] = useState<StandardizedSegment>(StandardizedSegment.GROUP);
  const [chartType, setChartType] = useState<'absolute' | 'rebased'>('absolute');
  const [basePeriod, setBasePeriod] = useState('2024 2H'); // Default to previous for indexing
  const [selectedBanks, setSelectedBanks] = useState<BankName[]>(Object.values(BankName));
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  // --- Derived Constants ---
  const availableMetrics = useMemo(() => Array.from(new Set(financialData.map(d => d.metric))).sort(), [financialData]);
  const periods = useMemo(() => Array.from(new Set(financialData.map(d => d.period))).sort(), [financialData]);
  
  // Sort periods chronologically (assuming Format YYYY Period)
  const sortedPeriods = useMemo(() => [...periods].sort(), [periods]);
  const latestPeriod = sortedPeriods[sortedPeriods.length - 1] || '2025 1H';
  const prevPeriod = sortedPeriods[sortedPeriods.length - 2] || '2024 2H';

  const bankColors: Record<BankName, string> = {
    [BankName.HSBC]: '#db2777', // Magenta
    [BankName.BEA_HK]: '#ef4444', // Red
    [BankName.SC_HK]: '#22c55e', // Green
    [BankName.BOC_HK]: '#eab308', // Yellow/Gold
    [BankName.HANG_SENG]: '#3b82f6' // Blue
  };

  const toggleBank = (bank: BankName) => {
    setSelectedBanks(prev => prev.includes(bank) ? prev.filter(b => b !== bank) : [...prev, bank]);
  };

  const getValue = (bank: BankName, period: string, metric: string) => {
      const point = financialData.find(d => 
          d.bank === bank && 
          d.period === period && 
          d.metric === metric &&
          d.standardizedSegment === StandardizedSegment.GROUP
      );
      if (!point) return 0;
      return point.currency === 'USD' ? point.value * fxRateConfig.usdToHkd : point.value;
  };

  // --- Insights Calculation ---
  const insights = useMemo(() => {
    // 1. Sector NII Growth
    let totalNII_Current = 0;
    let totalNII_Prev = 0;
    
    // 2. Top Profit Performer
    let topProfitBank = '';
    let maxProfit = -Infinity;

    // 3. Risk (NPL)
    let highestNPLBank = '';
    let maxNPL = -Infinity;

    Object.values(BankName).forEach(bank => {
        totalNII_Current += getValue(bank, latestPeriod, 'Net Interest Income');
        totalNII_Prev += getValue(bank, prevPeriod, 'Net Interest Income');

        const profit = getValue(bank, latestPeriod, 'Pretax Earnings');
        if (profit > maxProfit) {
            maxProfit = profit;
            topProfitBank = bank;
        }

        const npl = getValue(bank, latestPeriod, 'NPL Ratio');
        if (npl > maxNPL) {
            maxNPL = npl;
            highestNPLBank = bank;
        }
    });

    const niiGrowth = totalNII_Prev !== 0 ? ((totalNII_Current - totalNII_Prev) / totalNII_Prev) * 100 : 0;

    return {
        niiGrowth,
        topProfitBank,
        maxProfit,
        highestNPLBank,
        maxNPL
    };
  }, [financialData, latestPeriod, prevPeriod, fxRateConfig]);

  // --- Data Processing for Trend Chart ---
  const chartData = useMemo(() => {
    const dataByPeriod: Record<string, Record<string, number>> = {};
    sortedPeriods.forEach(p => {
        dataByPeriod[p] = {};
        selectedBanks.forEach(b => {
             const point = financialData.find(d => 
                 d.period === p && 
                 d.bank === b && 
                 d.metric === selectedMetric && 
                 d.standardizedSegment === selectedSegment
             );
             if (point) {
                 let val = point.value;
                 if (point.currency === 'USD') val = val * fxRateConfig.usdToHkd;
                 dataByPeriod[p][b] = val;
             }
        });
    });

    if (chartType === 'rebased') {
        const indexedDataByPeriod: Record<string, Record<string, number>> = {};
        sortedPeriods.forEach(p => {
            indexedDataByPeriod[p] = {};
            selectedBanks.forEach(b => {
                const currentVal = dataByPeriod[p][b];
                const baseVal = dataByPeriod[basePeriod]?.[b];
                if (currentVal !== undefined && baseVal) {
                    indexedDataByPeriod[p][b] = (currentVal / baseVal) * 100;
                }
            });
        });
        return indexedDataByPeriod;
    }

    return dataByPeriod;
  }, [financialData, selectedMetric, selectedSegment, selectedBanks, chartType, basePeriod, sortedPeriods, fxRateConfig]);

  // --- Chart Layout Calculations (Line Chart) ---
  const chartHeight = 300;
  const chartWidth = 800;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  let maxY = 0;
  let minY = Infinity;
  Object.values(chartData).forEach(bankVals => {
      Object.values(bankVals).forEach(val => {
          if (val > maxY) maxY = val;
          if (val < minY) minY = val;
      });
  });
  if (minY === Infinity) minY = 0;
  maxY = maxY * 1.05;
  if (chartType === 'rebased') minY = Math.min(minY, 95); else minY = 0;

  const getY = (val: number) => {
      const range = maxY - minY;
      if (range === 0) return graphHeight / 2;
      return graphHeight - ((val - minY) / range) * graphHeight;
  };
  const getX = (index: number) => {
      if (sortedPeriods.length <= 1) return graphWidth / 2;
      return (index / (sortedPeriods.length - 1)) * graphWidth;
  };

  // --- Bar Chart Data (Comparison) ---
  const barMetrics = ['Net Interest Income', 'Operating Profit', 'Pretax Earnings'];
  const barChartHeight = 250;
  
  // Calculate max for bar chart scaling
  let maxBarVal = 0;
  selectedBanks.forEach(b => {
      barMetrics.forEach(m => {
          const val = getValue(b, latestPeriod, m);
          if (val > maxBarVal) maxBarVal = val;
      });
  });

  return (
    <div className="flex h-full flex-col bg-slate-950 overflow-y-auto">
      {/* Title Bar */}
      <div className="p-4 border-b border-gray-800 bg-slate-900 flex items-center justify-between z-20 shadow-md">
         <div className="flex items-center gap-2">
             <LayoutDashboard className="text-amber-500" size={20} />
             <div>
                 <h2 className="text-lg font-bold text-white uppercase tracking-wider">Executive Dashboard</h2>
                 <p className="text-[10px] text-gray-500">Market Insights & Competitive Landscape ({latestPeriod})</p>
             </div>
         </div>
         <div className="flex items-center gap-2">
             <span className="text-xs text-gray-500">Benchmark Base:</span>
             <span className="text-xs font-mono text-white bg-gray-800 px-2 py-1 rounded border border-gray-700">{basePeriod}</span>
         </div>
      </div>

      <div className="p-6 space-y-6">
          
          {/* Key Insights Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Sector NII Growth (YoY)</div>
                  <div className="flex items-end gap-2">
                      <div className={`text-2xl font-mono font-bold ${insights.niiGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {insights.niiGrowth > 0 ? '+' : ''}{insights.niiGrowth.toFixed(1)}%
                      </div>
                      <div className="mb-1">
                          {insights.niiGrowth > 0 ? <TrendingUp size={16} className="text-green-500"/> : <TrendingDown size={16} className="text-red-500"/>}
                      </div>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-2">Aggregate change across all tracked banks.</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Top Performer (PBT)</div>
                  <div className="text-lg font-bold text-white truncate">{insights.topProfitBank}</div>
                  <div className="text-xs font-mono text-amber-500 mt-1">HKD {Math.round(insights.maxProfit).toLocaleString()}m</div>
                  <div className="text-[10px] text-gray-600 mt-1">Highest Pretax Earnings in {latestPeriod}.</div>
              </div>

               <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Risk Watch (Highest NPL)</div>
                  <div className="text-lg font-bold text-white truncate">{insights.highestNPLBank}</div>
                  <div className="text-xs font-mono text-red-400 mt-1">{insights.maxNPL.toFixed(2)}% Ratio</div>
                  <div className="text-[10px] text-gray-600 mt-1">Non-performing loan ratio alert.</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-sm">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Avg Net Interest Margin</div>
                  <div className="text-2xl font-mono font-bold text-blue-400">
                      1.69%
                  </div>
                  <div className="text-[10px] text-gray-600 mt-2">Sector weighted average for {latestPeriod}.</div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Trend Chart Column */}
              <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                          <Activity size={18} className="text-amber-500" />
                          <h3 className="font-bold text-white text-sm">Performance Trend Analysis</h3>
                      </div>
                      
                      <div className="flex gap-2">
                          <select 
                            value={selectedMetric} 
                            onChange={(e) => setSelectedMetric(e.target.value)} 
                            className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1 outline-none focus:border-amber-500 w-40"
                          >
                            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="flex bg-gray-800 rounded p-0.5 border border-gray-700">
                            <button onClick={() => setChartType('absolute')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${chartType === 'absolute' ? 'bg-amber-600 text-white' : 'text-gray-400'}`}>Abs</button>
                            <button onClick={() => setChartType('rebased')} className={`px-2 py-0.5 rounded text-[10px] font-bold ${chartType === 'rebased' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>Idx</button>
                        </div>
                      </div>
                  </div>

                  {/* Line Chart SVG */}
                  <div className="w-full h-[300px] relative">
                     <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                        {/* Grid */}
                        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                            const y = padding.top + (graphHeight * tick);
                            const val = maxY - (tick * (maxY - minY));
                            return (
                                <g key={tick}>
                                    <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                                    <text x={padding.left - 10} y={y + 3} textAnchor="end" className="fill-gray-500 text-[10px] font-mono">{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</text>
                                </g>
                            );
                        })}
                        
                        {/* Lines */}
                        {selectedBanks.map(bank => {
                            const points: string[] = [];
                            sortedPeriods.forEach((p, idx) => {
                                const val = chartData[p]?.[bank];
                                if (val !== undefined) {
                                    const x = padding.left + getX(idx);
                                    const y = padding.top + getY(val);
                                    points.push(`${x},${y}`);
                                }
                            });
                            if (points.length < 1) return null;
                            return (
                                <g key={bank}>
                                    {points.length > 1 && <polyline points={points.join(' ')} fill="none" stroke={bankColors[bank]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                                    {sortedPeriods.map((p, idx) => {
                                        const val = chartData[p]?.[bank];
                                        if (val === undefined) return null;
                                        const x = padding.left + getX(idx);
                                        const y = padding.top + getY(val);
                                        return <circle key={p} cx={x} cy={y} r="4" fill="#0f172a" stroke={bankColors[bank]} strokeWidth="2" className="cursor-pointer hover:r-6 transition-all" />
                                    })}
                                </g>
                            );
                        })}
                        {/* X Axis */}
                        {sortedPeriods.map((p, idx) => {
                            const x = padding.left + getX(idx);
                            return <text key={p} x={x} y={chartHeight - 5} textAnchor="middle" className="fill-gray-400 text-[10px] font-mono">{p}</text>
                        })}
                     </svg>
                  </div>
              </div>

              {/* Bar Chart Column */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 flex flex-col">
                  <h3 className="font-bold text-white text-sm mb-4">Peer Comparison ({latestPeriod})</h3>
                  <div className="flex-1 flex flex-col justify-end gap-2">
                       {/* Simplified Bar Chart */}
                       {barMetrics.map(metric => (
                           <div key={metric} className="mb-4">
                               <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">{metric}</div>
                               <div className="space-y-1">
                                   {selectedBanks.map(bank => {
                                       const val = getValue(bank, latestPeriod, metric);
                                       const widthPct = maxBarVal > 0 ? (val / maxBarVal) * 100 : 0;
                                       return (
                                           <div key={bank} className="flex items-center gap-2">
                                               <div className="w-16 text-[9px] text-gray-400 truncate text-right">{bank}</div>
                                               <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
                                                   <div className="h-full rounded" style={{ width: `${widthPct}%`, backgroundColor: bankColors[bank] }}></div>
                                               </div>
                                               <div className="w-12 text-[9px] text-white font-mono text-right">{val > 0 ? (val / 1000).toFixed(1) + 'k' : '-'}</div>
                                           </div>
                                       )
                                   })}
                               </div>
                           </div>
                       ))}
                  </div>
              </div>
          </div>
          
          <div className="flex justify-end gap-4 border-t border-gray-800 pt-4">
               {selectedBanks.map(bank => (
                    <div key={bank} className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100" onClick={() => toggleBank(bank)}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bankColors[bank] }}></div>
                        <span className="text-xs text-gray-300">{bank}</span>
                    </div>
                ))}
          </div>
      </div>
    </div>
  );
};