
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Database, Search, Plus, X, Download, Filter, ChevronDown, Check, DollarSign } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { BankName, Frequency, StandardizedSegment } from '../types';

export const DataQuery: React.FC = () => {
  const { financialData, fxRateConfig } = useData();
  
  // -- State --
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [selectedBanks, setSelectedBanks] = useState<BankName[]>(Object.values(BankName));
  const [selectedFrequency, setSelectedFrequency] = useState<string>('All');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('HKD');
  const [selectedSegment, setSelectedSegment] = useState<StandardizedSegment>(StandardizedSegment.GROUP); 
  const [startYear, setStartYear] = useState<number>(2025);
  const [endYear, setEndYear] = useState<number>(2025);

  // UI State
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // -- Derived Data --
  const availableMetrics = useMemo(() => 
    Array.from(new Set(financialData.map(d => d.metric))).sort(), 
  [financialData]);

  const availableYears = useMemo(() => 
    Array.from(new Set(financialData.map(d => d.year))).sort(), 
  [financialData]);

  // Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // -- Handlers --
  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  const toggleBank = (bank: BankName) => {
    setSelectedBanks(prev => {
      if (prev.includes(bank)) {
        return prev.length === 1 ? prev : prev.filter(b => b !== bank);
      }
      return [...prev, bank];
    });
  };

  // Proper Currency Conversion Logic
  const convertValue = (value: number, sourceCcy: string, targetCcy: string) => {
      if (sourceCcy === targetCcy) return value;
      
      const fxRate = fxRateConfig.usdToHkd;
      
      if (sourceCcy === 'USD' && targetCcy === 'HKD') return value * fxRate;
      if (sourceCcy === 'HKD' && targetCcy === 'USD') return value / fxRate;
      
      // Fallback / Simplified for demo (Assuming RMB similar to HKD for rough approx if not defined, or add logic)
      if (sourceCcy === 'RMB' && targetCcy === 'HKD') return value * 1.08; 
      
      return value;
  };

  // -- Filtering Logic --
  const filteredData = useMemo(() => {
    return financialData.filter(d => {
      if (!selectedBanks.includes(d.bank)) return false;
      if (d.year < startYear || d.year > endYear) return false;
      if (selectedFrequency !== 'All' && d.frequency !== selectedFrequency) return false;
      if (d.standardizedSegment !== selectedSegment) return false;
      return true;
    });
  }, [financialData, selectedBanks, startYear, endYear, selectedFrequency, selectedSegment]);

  // -- Pivot Logic for Table Display --
  const pivotTableData = useMemo(() => {
    if (selectedMetrics.length === 0) return [];

    const grouped = new Map<string, any>();
    const currencySymbol = selectedCurrency === 'USD' ? '$' : '';
    
    // Special handling for breakdown metrics that might be N/A (0)
    const breakdownMetrics = ['CASA Deposits', 'Time & Structured Deposits', 'Specific Provisions (Stage 3)', 'General Provisions (Stage 1 & 2)'];

    filteredData.forEach(d => {
      const key = `${d.bank}|${d.period}|${d.frequency}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          bank: d.bank,
          period: d.period,
          frequency: d.frequency,
          metrics: {}
        });
      }
      
      if (selectedMetrics.includes(d.metric)) {
        // N/A Check
        if (breakdownMetrics.includes(d.metric) && Math.abs(d.value) < 0.01) {
             grouped.get(key).metrics[d.metric] = 'N/A';
        } else {
            let displayValue = d.value;
            
            // Apply conversion if it's a monetary value
            if (d.unit !== '%') {
                displayValue = convertValue(d.value, d.currency, selectedCurrency);
            }

            let formattedValue = '';
            if (d.unit === '%') {
                formattedValue = `${displayValue.toFixed(2)}%`;
            } else {
                // Plain number formatting as requested
                formattedValue = `${displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
            }
            grouped.get(key).metrics[d.metric] = formattedValue;
        }
      }
    });

    return Array.from(grouped.values())
        .sort((a, b) => a.bank.localeCompare(b.bank) || b.period.localeCompare(a.period))
        .filter(row => Object.keys(row.metrics).length > 0);
  }, [filteredData, selectedMetrics, selectedCurrency, fxRateConfig]);


  // -- Export Logic (XLS) --
  const handleExport = () => {
    if (selectedMetrics.length === 0) return;

    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>FinTerminal Export</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          td { font-family: Arial, sans-serif; font-size: 11pt; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #333; }
          .num { mso-number-format:"#,##0"; }
          .pct { mso-number-format:"0.00%"; }
        </style>
      </head>
      <body>
      <table border="1">
        <thead>
          <tr>
            <th>Bank</th>
            <th>Period</th>
            <th>Frequency</th>
            <th>Segment</th>
            <th>Currency</th>
            ${selectedMetrics.map(m => `<th>${m}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    pivotTableData.forEach(row => {
      tableHTML += `<tr>
        <td>${row.bank}</td>
        <td>${row.period}</td>
        <td>${row.frequency}</td>
        <td>${selectedSegment}</td>
        <td>${selectedCurrency}</td>`;
      
      selectedMetrics.forEach(m => {
        const val = row.metrics[m];
        const isPct = val && val.includes('%');
        // If val is 'N/A', just render it.
        tableHTML += `<td class="${isPct ? 'pct' : 'num'}">${val || ''}</td>`;
      });
      
      tableHTML += `</tr>`;
    });

    tableHTML += `</tbody></table></body></html>`;

    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finterm_export_${selectedSegment}_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full">
      {/* Field Selector Sidebar */}
      <div className="w-72 border-r border-gray-800 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Field Browser</h3>
          <div className="relative">
            <Search className="absolute left-2 top-2 text-gray-600" size={14} />
            <input 
              type="text" 
              placeholder="Search data fields..." 
              className="w-full bg-gray-800 text-gray-200 text-xs rounded border border-gray-700 pl-8 p-2 outline-none focus:border-amber-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
            <div className="mb-4">
                <div className="flex justify-between items-center px-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Available Metrics ({availableMetrics.length})</span>
                    {selectedMetrics.length > 0 && (
                        <button onClick={() => setSelectedMetrics([])} className="text-[10px] text-amber-500 hover:text-amber-400">Clear All</button>
                    )}
                </div>
                {availableMetrics
                    .filter(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(m => {
                        const isSelected = selectedMetrics.includes(m);
                        return (
                            <div 
                                key={m} 
                                onClick={() => toggleMetric(m)}
                                className={`px-2 py-1.5 mb-0.5 text-xs rounded flex justify-between items-center cursor-pointer group transition-colors ${
                                    isSelected ? 'bg-amber-900/30 text-amber-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                }`}
                            >
                                <span className="truncate pr-2">{m}</span> 
                                {isSelected ? (
                                    <Check size={12} className="text-amber-500 flex-shrink-0" />
                                ) : (
                                    <Plus size={12} className="opacity-0 group-hover:opacity-100 text-gray-500 flex-shrink-0"/>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
      </div>

      {/* Main Query Area */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* Top Toolbar */}
        <div className="p-3 border-b border-gray-800 bg-slate-900 flex flex-wrap items-center gap-3 shadow-sm z-20">
            <div className="flex items-center gap-2 px-2 border-r border-gray-800 pr-4">
                <Filter size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-300 uppercase">Filters</span>
            </div>

            {/* Bank Selector */}
            <div className="relative" ref={bankDropdownRef}>
                <button 
                    onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                    className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-3 py-1.5 hover:border-amber-500 transition-colors"
                >
                   Banks: <span className="text-white">{selectedBanks.length === Object.keys(BankName).length ? 'All' : selectedBanks.length}</span> <ChevronDown size={12} />
                </button>
                {isBankDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-gray-900 border border-gray-700 rounded shadow-xl z-50 p-1">
                        {Object.values(BankName).map(bank => (
                            <div 
                                key={bank}
                                onClick={() => toggleBank(bank)}
                                className="flex items-center gap-2 p-2 hover:bg-gray-800 cursor-pointer rounded text-xs text-gray-300"
                            >
                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${selectedBanks.includes(bank) ? 'bg-amber-600 border-amber-600' : 'border-gray-600'}`}>
                                    {selectedBanks.includes(bank) && <Check size={8} className="text-white" />}
                                </div>
                                {bank}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Segment Selector (Crucial for Data Consistency) */}
            <select 
                value={selectedSegment} 
                onChange={(e) => setSelectedSegment(e.target.value as StandardizedSegment)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1.5 outline-none focus:border-amber-500 max-w-[150px]"
            >
                {Object.values(StandardizedSegment).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
            </select>

            {/* Currency Selector */}
            <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5">
                <span className="text-xs text-gray-500 font-mono">CCY:</span>
                <select 
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="bg-transparent text-gray-300 text-xs outline-none cursor-pointer"
                >
                    <option value="HKD">HKD</option>
                    <option value="USD">USD</option>
                    <option value="RMB">RMB</option>
                </select>
            </div>

            {/* Year Range */}
            <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded px-2 py-1">
                <span className="text-xs text-gray-500 font-mono">YR:</span>
                <select 
                    value={startYear}
                    onChange={(e) => setStartYear(parseInt(e.target.value))}
                    className="bg-transparent text-gray-300 text-xs outline-none cursor-pointer"
                >
                    {availableYears.map(y => <option key={`start-${y}`} value={y}>{y}</option>)}
                </select>
                <span className="text-gray-500 text-xs">-</span>
                <select 
                    value={endYear}
                    onChange={(e) => setEndYear(parseInt(e.target.value))}
                    className="bg-transparent text-gray-300 text-xs outline-none cursor-pointer"
                >
                    {availableYears.map(y => <option key={`end-${y}`} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="flex-1"></div>

            <button 
                onClick={handleExport}
                disabled={selectedMetrics.length === 0}
                className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                    selectedMetrics.length > 0 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
                <Download size={14} /> Export Excel
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-0 overflow-auto relative bg-slate-950">
           {selectedMetrics.length === 0 ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                   <Database size={48} className="mb-4 opacity-20" />
                   <p className="font-mono text-sm">Select metrics from the sidebar to build your report.</p>
                   <div className="mt-8 flex gap-4 text-xs opacity-50">
                       <div className="flex items-center gap-2"><Filter size={12}/> Filter by Bank, Year, Frequency</div>
                       <div className="flex items-center gap-2"><DollarSign size={12}/> Convert Currency (HKD/USD/RMB)</div>
                   </div>
               </div>
           ) : (
               <div className="min-w-max">
                   <table className="w-full text-left border-collapse">
                       <thead className="sticky top-0 bg-slate-900 shadow-md z-10">
                           <tr>
                               <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 bg-slate-900 sticky left-0 w-32">Bank</th>
                               <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 w-24">Period</th>
                               <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 w-24">Freq</th>
                               {selectedMetrics.map(m => (
                                   <th key={m} className="p-3 text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-gray-700 text-right min-w-[120px]">
                                       <div className="flex items-center justify-end gap-1 group cursor-pointer" onClick={() => toggleMetric(m)}>
                                           {m} <X size={10} className="opacity-0 group-hover:opacity-100 text-red-400"/>
                                       </div>
                                   </th>
                               ))}
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-800">
                           {pivotTableData.length === 0 ? (
                               <tr>
                                   <td colSpan={3 + selectedMetrics.length} className="p-8 text-center text-gray-500 text-sm font-mono">
                                       No data matches current filters.
                                   </td>
                               </tr>
                           ) : (
                               pivotTableData.map((row, idx) => (
                                   <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                                       <td className="p-3 text-xs font-bold text-gray-300 border-r border-gray-800/50 sticky left-0 bg-slate-950/95">
                                           {row.bank}
                                       </td>
                                       <td className="p-3 text-xs text-gray-400 font-mono">
                                           {row.period}
                                       </td>
                                       <td className="p-3 text-xs text-gray-500">
                                           {row.frequency}
                                       </td>
                                       {selectedMetrics.map(m => (
                                           <td key={m} className="p-3 text-xs text-right font-mono text-gray-200">
                                               {row.metrics[m] !== undefined ? row.metrics[m] : '-'}
                                           </td>
                                       ))}
                                   </tr>
                               ))
                           )}
                       </tbody>
                   </table>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
