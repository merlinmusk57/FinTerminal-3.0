import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { BankName, StandardizedSegment, FinancialDataPoint } from '../types';
import { ChevronDown, ChevronRight, CornerDownRight, Check, X, Lock, Unlock, AlertCircle, Filter, CheckCircle, XCircle, BookOpen, Flag, Download, MessageSquare } from 'lucide-react';

interface ValidationCellProps {
  metric: string;
  bank: BankName;
  selectedPeriod: string;
  selectedSegment: StandardizedSegment;
  selectedCurrency: string;
  fxRate: number;
  dataPoints: FinancialDataPoint[];
}

const ValidationCell: React.FC<ValidationCellProps> = ({ metric, bank, selectedPeriod, selectedSegment, selectedCurrency, fxRate, dataPoints }) => {
  const { validationMap, updateDataPointValue, updateDataPointComment, toggleValidation, toggleNA, toggleFlag, setActiveTab, setSelectedAuditId } = useData();
  
  const data = dataPoints.find(d => 
    d.metric === metric && 
    d.bank === bank && 
    d.period === selectedPeriod &&
    d.standardizedSegment === selectedSegment
  );

  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const commentRef = useRef<HTMLDivElement>(null);
  const commentTextRef = useRef('');

  const status = data ? validationMap[data.logicalId] : undefined;
  const currentStatus = status || { 
      isOverride: false, 
      isValidated: false, 
      isNA: false,
      isFlagged: false,
      comments: '',
      currentValue: data ? data.value : 0
  };
  const savedComment = currentStatus.comments || '';

  useEffect(() => {
      commentTextRef.current = savedComment;
  }, [savedComment]);

  const saveComment = () => {
    if (data && commentTextRef.current !== savedComment) {
        updateDataPointComment(data.logicalId, commentTextRef.current);
    }
    setIsCommentOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (isCommentOpen && commentRef.current && !commentRef.current.contains(event.target as Node)) {
        saveComment();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCommentOpen, data, savedComment]);

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveComment();
    }
  };

  if (!data) return <td className="p-3 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-950/50"></td>;

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

  const isImplicitNA = ((breakdownMetrics.includes(metric) || ratioMetrics.includes(metric)) && Math.abs(currentStatus.currentValue) < 0.0001);
  const showNA = currentStatus.isNA || isImplicitNA;

  let displayVal = currentStatus.currentValue;
  const targetUSD = selectedCurrency === 'USD';
  const unit = data.unit;

  if (!showNA && unit !== '%') {
      if (data.currency === 'HKD' && targetUSD) {
          displayVal = displayVal / fxRate; 
      } else if (data.currency === 'USD' && !targetUSD) {
          displayVal = displayVal * fxRate; 
      }
  }

  const handleStartEdit = () => {
      if (currentStatus.isValidated) return; 
      setLocalValue(showNA ? '0' : displayVal.toFixed(2));
      setIsEditing(true);
  };

  const handleCommitEdit = () => {
      let numVal = parseFloat(localValue);
      if (isNaN(numVal)) numVal = 0;

      let storageVal = numVal;
      if (unit !== '%') {
          if (data.currency === 'HKD' && targetUSD) {
             storageVal = numVal * fxRate;
          } else if (data.currency === 'USD' && !targetUSD) {
             storageVal = numVal / fxRate;
          }
      }

      updateDataPointValue(data.logicalId, storageVal);
      setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCommitEdit();
      if (e.key === 'Escape') setIsEditing(false);
  };

  const onToggleValidation = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleValidation(data.logicalId);
  };

  const onToggleFlag = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFlag(data.logicalId);
  };

  const onSetNA = () => {
      toggleNA(data.logicalId);
      setIsDropdownOpen(false);
  }

  const onCitationClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedAuditId(data.id);
      setActiveTab('mapping');
  };

  const isLocked = currentStatus.isValidated;
  const isModified = currentStatus.isOverride && !currentStatus.isValidated;
  const isFlagged = currentStatus.isFlagged;
  const hasComment = savedComment && savedComment.trim().length > 0;

  return (
    <td className={`p-3 border-l border-gray-200 dark:border-gray-800 transition-colors relative group min-w-[140px] ${isLocked ? 'bg-green-50 dark:bg-green-900/10' : (isModified ? 'bg-amber-50 dark:bg-amber-900/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800/30')}`}>
      <div className="flex items-center justify-between gap-2 h-6">
        
        <div className="flex items-center gap-1">
             <div className="w-5 flex items-center justify-center">
                {!isLocked && (
                    <button 
                        onClick={onToggleFlag}
                        type="button"
                        className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100 ${isFlagged ? 'text-red-500 bg-red-50 dark:bg-red-900/10 opacity-100' : 'text-gray-400 dark:text-gray-600 hover:text-red-500'}`}
                        title={isFlagged ? "Include Data" : "Exclude Data"}
                    >
                        <X size={12} strokeWidth={3} className={isFlagged ? "text-red-600 dark:text-red-500" : ""} />
                    </button>
                )}
             </div>
             
             <div className="relative" ref={commentRef}>
                <button 
                    onClick={() => setIsCommentOpen(!isCommentOpen)}
                    type="button"
                    className={`p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors ${hasComment ? 'text-blue-500 dark:text-blue-400 opacity-100' : 'text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-blue-500'}`}
                    title="Add/Edit Comment"
                >
                    <MessageSquare size={12} fill={hasComment ? "currentColor" : "none"} />
                </button>
                {isCommentOpen && (
                    <div className="absolute top-full left-0 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded shadow-xl w-64 mt-2">
                        <textarea 
                            className="w-full bg-gray-50 dark:bg-black text-xs text-gray-800 dark:text-gray-300 p-2 rounded border border-gray-300 dark:border-gray-800 focus:border-blue-500 outline-none"
                            rows={3}
                            defaultValue={savedComment || ''}
                            onChange={(e) => commentTextRef.current = e.target.value}
                            onKeyDown={handleCommentKeyDown}
                            placeholder="Add a comment about this figure..."
                            autoFocus
                        />
                        <div className="text-[9px] text-gray-500 mt-1 text-right">Press Enter to save</div>
                    </div>
                )}
             </div>
        </div>

        <div className="flex-1 text-right flex items-center justify-end gap-1 relative">
            <button 
                onClick={onCitationClick}
                className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-600 hover:text-amber-500 transition-all transform hover:scale-110 mr-1"
                title="View Source Citation"
            >
                <BookOpen size={10} />
            </button>

            {isEditing ? (
                <input 
                    autoFocus
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleCommitEdit}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white dark:bg-slate-900 border border-amber-500 text-right text-gray-900 dark:text-white text-sm px-1 py-0.5 rounded outline-none font-mono shadow-inner"
                />
            ) : (
                <div 
                    onClick={handleStartEdit}
                    className={`text-sm font-mono flex justify-end items-center gap-1 ${!isLocked ? 'cursor-text hover:text-gray-900 dark:hover:text-white' : 'cursor-default'} ${showNA ? 'text-gray-400 dark:text-gray-500' : (isLocked ? 'text-green-600 dark:text-green-400 font-bold' : (isFlagged ? 'text-red-600 dark:text-red-500 font-extrabold' : (isModified ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300')))}`}
                >
                    {showNA ? "N/A" : displayVal.toLocaleString(undefined, { maximumFractionDigits: unit === '%' ? 2 : 0 })}
                    {!showNA && unit === '%' && '%'}
                </div>
            )}

            {!isLocked && !isEditing && (
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }}
                        className={`p-0.5 ml-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors ${isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                        <ChevronDown size={10} />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-28 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-xl z-50 overflow-hidden">
                             <button 
                                onClick={onSetNA}
                                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                             >
                                 {currentStatus.isNA ? 'Unset N/A' : 'Set as N/A'}
                             </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="w-5 flex items-center justify-center">
            {isLocked ? (
                <button 
                    onClick={onToggleValidation}
                    type="button"
                    className="p-1 rounded bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                    title="Unlock Value"
                >
                    <Lock size={12} />
                </button>
            ) : (
                 <button 
                    onClick={onToggleValidation}
                    type="button"
                    className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-400 dark:text-gray-600 hover:text-green-600 dark:hover:text-green-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Validate & Lock"
                >
                    <Check size={12} />
                </button>
            )}
        </div>

      </div>
    </td>
  );
};

export const DataValidation: React.FC = () => {
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
  const bankDropdownRef = useRef<HTMLDivElement>(null);

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

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
      'non_nii': true, 
      'provisions': true,
      'deposits': true
  });
  
  const periods = Array.from(new Set(financialData.map(d => d.period))).sort().reverse();
  const segments = Object.values(StandardizedSegment);

  const toggleRow = (rowKey: string) => {
    setExpandedRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

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
     const table = document.getElementById('validation-table');
     if (!table) return;
     
     const html = table.outerHTML;
     const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `data_validation_export_${selectedPeriod}.xls`;
     a.click();
     window.URL.revokeObjectURL(url);
  };

  const Row = ({ label, isChild = false, hasChildren = false, rowKey = '', isTotal = false }: any) => (
    <tr className={`border-b border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800/20 transition-colors ${isTotal ? 'bg-gray-50 dark:bg-gray-900/60' : ''}`}>
      <td className={`p-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-800 sticky left-0 z-20 ${isTotal ? 'bg-white dark:bg-slate-900' : 'bg-white dark:bg-slate-950'}`}>
         <div className={`flex items-center w-full ${isChild ? 'pl-12' : 'pl-2'}`}>
            {hasChildren ? (
                <button onClick={() => toggleRow(rowKey)} className="mr-2 text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 focus:outline-none p-0.5 rounded border border-amber-900/20 dark:border-amber-900/50">
                    {expandedRows[rowKey] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                </button>
            ) : (
               !isChild && <div className="w-5"></div>
            )}
            {isChild && <CornerDownRight size={10} className="mr-2 text-gray-500 dark:text-gray-600" />}
            <span className={`${isTotal ? 'text-amber-600 dark:text-amber-500 font-bold' : 'text-gray-700 dark:text-gray-300'} ${hasChildren ? 'font-bold' : ''}`}>{label}</span>
         </div>
      </td>
      {selectedBanks.map(bank => (
        <ValidationCell 
            key={bank} 
            metric={label} 
            bank={bank} 
            selectedPeriod={selectedPeriod} 
            selectedSegment={selectedSegment} 
            selectedCurrency={selectedCurrency}
            fxRate={fxRateConfig.usdToHkd}
            dataPoints={financialData} 
        />
      ))}
    </tr>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <tr className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky z-10">
      <td className="p-2 pl-4 text-[10px] font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest border-l-4 border-blue-600 sticky left-0 bg-gray-100 dark:bg-gray-900 z-20">{title}</td>
      {selectedBanks.map(b => <td key={b} className="bg-gray-100 dark:bg-gray-900"></td>)}
    </tr>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-4 z-50 relative shadow-sm">
             <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-700 pr-4">
                 <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">Data Validation</h2>
                    <span className="text-[10px] text-gray-500">Review, Override & Lock extracted figures.</span>
                 </div>
             </div>

             <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-mono">Period:</span>
                <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded px-2 py-1 outline-none focus:border-amber-500">
                    {periods.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-mono">Currency:</span>
                <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded px-2 py-1 outline-none focus:border-amber-500">
                    <option value="HKD">HKD</option>
                    <option value="USD">USD</option>
                </select>
            </div>

            <div className="relative" ref={bankDropdownRef}>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase font-mono">Banks:</span>
                    <button onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded px-3 py-1 hover:border-amber-500 transition-colors">
                        {selectedBanks.length} Selected <ChevronDown size={12} />
                    </button>
                </div>
                {isBankDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-xl z-50 p-1">
                        {Object.values(BankName).map(bank => (
                            <div key={bank} onClick={() => toggleBank(bank)} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded text-xs text-gray-700 dark:text-gray-300">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedBanks.includes(bank) ? 'bg-amber-600 border-amber-600' : 'border-gray-400 dark:border-gray-600'}`}>
                                    {selectedBanks.includes(bank) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                </div>
                                {bank}
                            </div>
                        ))}
                        <div className="border-t border-gray-200 dark:border-gray-800 mt-1 pt-1"><div onClick={() => setIsBankDropdownOpen(false)} className="text-center p-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer">Close</div></div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 pl-4 border-l border-gray-300 dark:border-gray-700">
                <span className="text-xs text-amber-600 dark:text-amber-500 uppercase font-mono font-bold">Scope:</span>
                <select value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value as StandardizedSegment)} className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-xs rounded px-2 py-1 outline-none focus:border-amber-500 w-48">
                    {segments.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

             <div className="flex-1"></div>
             
             <div className="flex gap-4 text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded border border-gray-200 dark:border-gray-800">
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Locked</div>
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Modified</div>
                 <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Excluded</div>
             </div>
             <button onClick={handleExport} className="flex items-center gap-2 px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded uppercase tracking-wider transition-colors shadow-sm"><Download size={14} /> Export Excel</button>
        </div>

        <div className="flex-1 overflow-auto relative">
            <div className="min-w-max">
                <table id="validation-table" className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-30 shadow-lg">
                        <tr className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                             <th className="p-4 text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-wider w-1/3 pl-10 border-r border-gray-200 dark:border-gray-800 sticky left-0 top-0 z-40 bg-gray-100 dark:bg-gray-900">Line Item</th>
                             {selectedBanks.map(bank => (
                                 <th key={bank} className="p-4 text-right text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border-l border-gray-200 dark:border-gray-800 min-w-[140px] bg-gray-100 dark:bg-gray-900">{bank}</th>
                             ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900/30">
                        <SectionHeader title="Profit & Loss" />
                        <Row label="Net Interest Income" />
                        <Row label="Non-Interest Income" hasChildren rowKey="non_nii" />
                        {expandedRows['non_nii'] && (
                            <>
                                <Row label="Fee Income" isChild />
                                <Row label="Trading & Other Income" isChild />
                            </>
                        )}
                        <Row label="Total Income" isTotal />
                        <Row label="Operating Expenses" />
                        <Row label="Operating Profit" isTotal />
                        <Row label="Provisions" />
                        <Row label="Pretax Earnings" isTotal />
                        
                        {selectedSegment === StandardizedSegment.GROUP && (
                            <>
                                <SectionHeader title="Balance Sheet" />
                                <Row label="Total Loans" />
                                <Row label="Total Deposits" hasChildren rowKey="deposits" />
                                {expandedRows['deposits'] && (
                                    <>
                                        <Row label="CASA Deposits" isChild />
                                        <Row label="Time & Structured Deposits" isChild />
                                    </>
                                )}
                                <SectionHeader title="Key Ratios" />
                                <Row label="Net Interest Margin" />
                                <Row label="Non-NII Ratio" />
                                <Row label="Cost-to-Income Ratio" />
                                <Row label="Loan-to-Deposit Ratio" />
                                <Row label="CASA Ratio" />
                                <Row label="NPL Ratio" />
                            </>
                        )}

                        {selectedSegment !== StandardizedSegment.GROUP && (
                            <>
                                <SectionHeader title="Balance Sheet (Segment Allocated)" />
                                <Row label="Total Loans" />
                                <Row label="Total Deposits" />
                                <SectionHeader title="Key Ratios (Segment)" />
                                <Row label="Net Interest Margin" />
                                <Row label="Cost-to-Income Ratio" />
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};