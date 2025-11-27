import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { BankName, StandardizedSegment, FinancialDataPoint } from '../types';
import { ChevronDown, ChevronRight, FileText, Download, CornerDownRight, AlertTriangle, MessageSquare } from 'lucide-react';

// --- Data Cell Component ---
interface CitationCellProps {
  metric: string;
  bank: BankName;
  selectedPeriod: string;
  selectedSegment: StandardizedSegment;
  selectedCurrency: string;
  fxRate: number;
  dataPoints: FinancialDataPoint[];
}

const CitationCell: React.FC<CitationCellProps> = ({ metric, bank, selectedPeriod, selectedSegment, selectedCurrency, fxRate, dataPoints }) => {
  const { validationMap, updateDataPointComment } = useData();
  
  const data = dataPoints.find(d => 
    d.metric === metric && 
    d.bank === bank && 
    d.period === selectedPeriod &&
    d.standardizedSegment === selectedSegment
  );
  
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);
  
  // Ref to store current text edits without triggering re-renders
  // This allows us to access the latest value inside event listeners (like click outside)
  const commentTextRef = useRef('');

  // Determine effective status safely
  const status = data ? validationMap[data.logicalId] : undefined;
  const comments = status ? status.comments : '';

  // Initialize ref with current saved comment when opening or when prop updates
  useEffect(() => {
      commentTextRef.current = comments || '';
  }, [comments]);

  const saveComment = () => {
    if (data && commentTextRef.current !== (comments || '')) {
        updateDataPointComment(data.logicalId, commentTextRef.current);
    }
    setIsCommentOpen(false);
  };

  // Handle Click Outside with Ref Data
  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (isCommentOpen && commentRef.current && !commentRef.current.contains(event.target as Node)) {
          // Save before closing
          saveComment();
        }
      }
      
      // Only attach listener when open
      if (isCommentOpen) {
          document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isCommentOpen, data, comments]); // Dependencies updated to ensure saveComment closure is fresh

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          saveComment();
      }
  };

  if (!data) return <td className="p-3 border-l border-gray-800 text-right">-</td>;

  const currentValue = status ? status.currentValue : data.value;
  const isNA = status ? status.isNA : false;
  const isValidated = status ? status.isValidated : false;
  const isOverride = status ? status.isOverride : false;
  const isFlagged = status ? status.isFlagged : false;

  // Requirement 1: If data is flagged (crossed out), DO NOT show it.
  if (isFlagged) {
      return <td className="p-3 text-right font-mono border-l border-gray-800 relative group min-w-[140px] text-gray-700">-</td>;
  }

  // Requirement 2: Show data if it is validated OR if it has been modified (overridden) by the user.
  const isVisible = isValidated || isOverride;

  if (!isVisible && !isNA) {
      return (
          <td className="p-3 text-right font-mono border-l border-gray-800 relative group min-w-[140px]">
              <span className="text-gray-600 text-xs italic">Pending</span>
          </td>
      );
  }

  // Logic for implicit N/A
  const breakdownMetrics = [
      'CASA Deposits', 
      'Time & Structured Deposits', 
      'Specific Provisions (Stage 3)', 
      'General Provisions (Stage 1 & 2)',
      'Fee Income',
      'Trading & Other Income'
  ];
  const ratioMetrics = [
      'Net Interest Margin',
      'NPL Ratio',
      'CASA Ratio',
      'Loan-to-Deposit Ratio',
      'Cost-to-Income Ratio',
      'Non-NII Ratio'
  ];
  const isImplicitNA = ((breakdownMetrics.includes(metric) || ratioMetrics.includes(metric)) && Math.abs(currentValue) < 0.0001);
  const showNA = isNA || isImplicitNA;

  // Currency Conversion
  let val = currentValue;
  const targetUSD = selectedCurrency === 'USD';
  const unit = data.unit;

  if (!showNA && unit !== '%') {
      if (data.currency === 'HKD' && targetUSD) {
          val = val / fxRate; 
      } else if (data.currency === 'USD' && !targetUSD) {
          val = val * fxRate; 
      }
  }

  const formatValue = (v: number) => {
    if (showNA) return <span className="text-gray-600 font-normal">N/A</span>;
    if (unit === '%') return `${v.toFixed(2)}%`;
    return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };
  
  const hasComment = comments && comments.trim().length > 0;

  return (
    <td className="p-3 text-right font-mono border-l border-gray-800 relative group min-w-[140px]">
      <div className="flex items-center justify-end gap-1">
        {/* Comment Indicator */}
        <div className="relative mr-auto" ref={commentRef}>
             <button 
                onClick={() => setIsCommentOpen(!isCommentOpen)}
                className={`transition-colors ${hasComment ? 'text-blue-400 opacity-100' : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-blue-400'}`}
                title="View/Add Comment"
             >
                 <MessageSquare size={12} fill={hasComment ? "currentColor" : "none"} />
             </button>
             {isCommentOpen && (
                <div className="absolute top-full left-0 z-50 bg-gray-900 border border-gray-700 p-2 rounded shadow-xl w-64 mt-1 text-left">
                    <textarea 
                        className="w-full bg-black text-xs text-gray-300 p-2 rounded border border-gray-800 focus:border-blue-500 outline-none"
                        rows={3}
                        defaultValue={comments || ''}
                        onChange={(e) => commentTextRef.current = e.target.value}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a note..."
                        autoFocus
                    />
                    <div className="text-[9px] text-gray-500 mt-1 text-right">Press Enter to save</div>
                </div>
            )}
        </div>

        <span className={`
            ${currentValue < 0 ? 'text-red-400' : 'text-gray-200'} 
            ${isValidated ? 'font-bold' : ''} 
            ${isFlagged ? 'text-red-500 font-extrabold' : ''}
            ${!isFlagged && isOverride && !isValidated ? 'text-amber-400' : ''}
        `}>
            {formatValue(val)}
        </span>
      </div>
    </td>
  );
};

export const Comparison: React.FC = () => {
  const { financialData, fxRateConfig } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState('2025 1H');
  const [selectedSegment, setSelectedSegment] = useState<StandardizedSegment>(StandardizedSegment.GROUP);
  const [selectedCurrency, setSelectedCurrency] = useState('HKD');
  const [selectedBanks, setSelectedBanks] = useState<BankName[]>([
    BankName.HSBC,
    BankName.BEA_HK,
    BankName.SC_HK, 
    BankName.BOC_HK,
    BankName.HANG_SENG
  ]);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
      'non_nii': true, 
      'provisions': true,
      'deposits': true
  });
  
  const toggleRow = (rowKey: string) => {
    setExpandedRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const periods = Array.from(new Set(financialData.map(d => d.period))).sort().reverse();
  const segments = Object.values(StandardizedSegment);

  const toggleBank = (bank: BankName) => {
    setSelectedBanks(prev => {
      if (prev.includes(bank)) {
        if (prev.length === 1) return prev;
        return prev.filter(b => b !== bank);
      } else {
        return [...prev, bank];
      }
    });
  };

  const handleExport = () => {
     // Simple HTML Table export logic
     const table = document.getElementById('peer-analysis-table');
     if (!table) return;
     
     const html = table.outerHTML;
     const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `peer_analysis_${selectedPeriod}.xls`;
     a.click();
     window.URL.revokeObjectURL(url);
  };

  const ComparisonRow = ({ label, isChild = false, hasChildren = false, rowKey = '', isTotal = false }: any) => (
    <tr className={`hover:bg-gray-800/30 border-b border-gray-800 last:border-0 transition-colors ${isTotal ? 'bg-gray-900/60 font-bold' : ''}`}>
      <td className={`p-3 text-sm text-gray-300 border-r border-gray-800 sticky left-0 z-20 ${isTotal ? 'bg-slate-900' : 'bg-slate-950'}`}>
         <div className={`flex items-center w-full ${isChild ? 'pl-12' : 'pl-2'}`}>
            {hasChildren ? (
                <button onClick={() => toggleRow(rowKey)} className="mr-2 text-amber-500 hover:text-amber-400 focus:outline-none p-0.5 rounded border border-amber-900/50">
                    {expandedRows[rowKey] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>
            ) : (
               !isChild && <div className="w-5"></div>
            )}
            {isChild && <CornerDownRight size={10} className="mr-2 text-gray-600" />}
            <span className={`${isTotal ? 'text-amber-500' : 'text-gray-300'} ${hasChildren ? 'font-bold' : ''}`}>{label}</span>
         </div>
      </td>
      {selectedBanks.map(bank => (
        <CitationCell key={bank} metric={label} bank={bank} selectedPeriod={selectedPeriod} selectedSegment={selectedSegment} selectedCurrency={selectedCurrency} fxRate={fxRateConfig.usdToHkd} dataPoints={financialData} />
      ))}
    </tr>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <tr className="bg-gray-900 border-b border-gray-800 sticky z-10">
      <td className="p-2 pl-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-l-4 border-amber-600 sticky left-0 bg-gray-900 z-20">{title}</td>
      {selectedBanks.map(b => <td key={b} className="bg-gray-900"></td>)}
    </tr>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 bg-slate-900 flex flex-wrap items-center gap-4 z-50 relative shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase font-mono">Period:</span>
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 outline-none focus:border-amber-500">
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase font-mono">Currency:</span>
          <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 outline-none focus:border-amber-500">
            <option value="HKD">HKD</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div className="relative">
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-mono">Banks:</span>
                <button onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)} className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-white text-sm rounded px-3 py-1 hover:border-amber-500 transition-colors">
                    {selectedBanks.length} Selected <ChevronDown size={12} />
                </button>
            </div>
            {isBankDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 border border-gray-700 rounded shadow-xl z-50 p-1">
                    {Object.values(BankName).map(bank => (
                        <div key={bank} onClick={() => toggleBank(bank)} className="flex items-center gap-2 p-2 hover:bg-gray-800 cursor-pointer rounded text-sm text-gray-300">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedBanks.includes(bank) ? 'bg-amber-600 border-amber-600' : 'border-gray-600'}`}>
                                {selectedBanks.includes(bank) && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </div>
                            {bank}
                        </div>
                    ))}
                    <div className="border-t border-gray-800 mt-1 pt-1"><div onClick={() => setIsBankDropdownOpen(false)} className="text-center p-1 text-xs text-gray-500 hover:text-white cursor-pointer">Close</div></div>
                </div>
            )}
        </div>
        <div className="flex items-center gap-2 pl-4 border-l border-gray-700">
          <span className="text-xs text-amber-500 uppercase font-mono font-bold">Scope:</span>
          <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value as StandardizedSegment)} className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 outline-none focus:border-amber-500 w-48">
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1"></div>
        <div className="text-[10px] text-gray-500 font-mono italic flex items-center gap-1 mr-4">
            <AlertTriangle size={12} /> Showing Validated or Modified Data
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded uppercase tracking-wider transition-colors shadow-sm"><Download size={14} /> Export Excel</button>
      </div>
      <div className="flex-1 overflow-auto bg-slate-950 relative">
        <div className="min-w-max">
          <table id="peer-analysis-table" className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-30 shadow-lg">
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3 pl-10 border-r border-gray-800 sticky left-0 top-0 z-40 bg-gray-900">Line Item</th>
                {selectedBanks.map(bank => (
                  <th key={bank} className="p-4 text-right text-xs font-bold text-white uppercase tracking-wider border-l border-gray-800 min-w-[140px] bg-gray-900">{bank}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-900/50">
              <SectionHeader title="Profit & Loss" />
              <ComparisonRow label="Net Interest Income" />
              <ComparisonRow label="Non-Interest Income" hasChildren rowKey="non_nii" />
              {expandedRows['non_nii'] && (
                  <>
                    <ComparisonRow label="Fee Income" isChild />
                    <ComparisonRow label="Trading & Other Income" isChild />
                  </>
              )}
              <ComparisonRow label="Total Income" isTotal />
              <ComparisonRow label="Operating Expenses" />
              <ComparisonRow label="Operating Profit" isTotal />
              <ComparisonRow label="Provisions" />
              <ComparisonRow label="Pretax Earnings" isTotal />
              {selectedSegment === StandardizedSegment.GROUP && (
                  <>
                    <SectionHeader title="Balance Sheet" />
                    <ComparisonRow label="Total Loans" />
                    <ComparisonRow label="Total Deposits" hasChildren rowKey="deposits" />
                    {expandedRows['deposits'] && (
                        <>
                            <ComparisonRow label="CASA Deposits" isChild />
                            <ComparisonRow label="Time & Structured Deposits" isChild />
                        </>
                    )}
                    <SectionHeader title="Key Ratios" />
                    <ComparisonRow label="Net Interest Margin" />
                    <ComparisonRow label="Non-NII Ratio" />
                    <ComparisonRow label="Cost-to-Income Ratio" />
                    <ComparisonRow label="Loan-to-Deposit Ratio" />
                    <ComparisonRow label="CASA Ratio" />
                    <ComparisonRow label="NPL Ratio" />
                  </>
              )}
               {selectedSegment !== StandardizedSegment.GROUP && (
                  <>
                     <SectionHeader title="Balance Sheet (Segment Allocated)" />
                     <ComparisonRow label="Total Loans" />
                     <ComparisonRow label="Total Deposits" />
                     <SectionHeader title="Key Ratios (Segment)" />
                     <ComparisonRow label="Net Interest Margin" />
                     <ComparisonRow label="Cost-to-Income Ratio" />
                  </>
              )}
            </tbody>
          </table>
        </div>
      </div>
        <div className="p-2 border-t border-gray-800 bg-gray-900/50 flex flex-col gap-1 text-[10px] text-gray-500 font-mono z-30">
            <div className="flex items-center gap-1">
                <FileText size={10} className="text-amber-500" />
                <span>All figures in millions ({selectedCurrency}) unless otherwise stated. Only validated figures are displayed.</span>
            </div>
        </div>
    </div>
  );
};