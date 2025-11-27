

import React, { useState, useEffect } from 'react';
import { ArrowRight, FileText, Database, Map as MapIcon, BookOpen, AlertTriangle, ExternalLink, List, Search, X, Layers, ArrowDownCircle, Info, Table, Calculator, Save, RefreshCw, CheckCircle, Calendar, CheckSquare, Square } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { BankName, Currency, Frequency, StandardizedSegment, FinancialDataPoint, NormalizationStep } from '../types';
import { generateLogicalId, generateDataPointId } from '../mockData';

const LogicMap = () => (
    <div className="p-8 h-full overflow-y-auto">
        <div className="mb-8">
             <h2 className="text-2xl font-mono text-white mb-2">DATA NORMALIZATION LOGIC MAP</h2>
             <p className="text-gray-400 text-sm max-w-3xl">
                Visualizing how diverse bank reporting structures are harmonized into the "Standardized HK Framework".
             </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 relative">
            {/* Column 1: Sources */}
            <div className="space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">1. Diverse Sources</div>
                {['HSBC HK Interim Report (HKD)', 'SCB HK Interim Report (HKD)', 'BEA Interim Report (HKD)', 'BOC Data Pack (HKD)'].map((src, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 p-4 rounded-lg relative">
                        <div className="flex items-center gap-2 mb-2">
                             <FileText size={16} className="text-gray-400" />
                             <span className="text-sm font-bold text-gray-300">{src}</span>
                        </div>
                        <div className="text-[10px] text-gray-500">Formats: PDF, XLSX<br/>Entities: Consolidated, Subsidiary</div>
                        <div className="hidden xl:block absolute -right-6 top-1/2 w-6 h-px bg-gray-800"></div>
                    </div>
                ))}
            </div>
            {/* Column 2 */}
            <div className="space-y-4">
                <div className="text-xs font-bold text-amber-600 uppercase tracking-widest border-b border-gray-800 pb-2">2. Segment Mapping</div>
                <div className="bg-amber-950/10 border border-amber-900/50 p-4 rounded-lg h-full flex flex-col justify-center">
                    <div className="space-y-6">
                         <div className="bg-black/40 p-3 rounded border border-amber-900/30">
                            <div className="text-[10px] text-amber-500 uppercase mb-1">Taxonomy Rule #1</div>
                            <div className="flex items-center gap-2 text-xs text-gray-300"><span>Wealth & Personal Banking (HSBC)</span> <ArrowRight size={10} /> <span className="font-bold text-white">Retail & Wealth</span></div>
                         </div>
                         <div className="bg-black/40 p-3 rounded border border-amber-900/30">
                            <div className="text-[10px] text-amber-500 uppercase mb-1">Taxonomy Rule #2</div>
                            <div className="flex items-center gap-2 text-xs text-gray-300"><span>CPBB (Standard Chartered)</span> <ArrowRight size={10} /> <span className="font-bold text-white">Retail & Wealth</span></div>
                         </div>
                    </div>
                </div>
            </div>
            {/* Column 3 */}
            <div className="space-y-4">
                <div className="text-xs font-bold text-blue-500 uppercase tracking-widest border-b border-gray-800 pb-2">3. Geo Filtering</div>
                <div className="bg-blue-950/10 border border-blue-900/50 p-4 rounded-lg h-full relative">
                    <div className="h-full flex flex-col justify-center gap-4 text-center">
                        <div className="text-sm text-gray-300">Extract specific <span className="text-white font-bold">HK Operations</span> data from:</div>
                        <div className="flex flex-wrap justify-center gap-2">
                             <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-800">Reportable Segments: HK</span>
                             <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-800">SC Bank (HK) Ltd Entity</span>
                        </div>
                        <div className="h-px bg-gray-800 w-full my-2"></div>
                        <div className="text-xs text-gray-400">Assumption: SCB (HK) Ltd treated as HK proxy (includes CN/KR branches).</div>
                    </div>
                </div>
            </div>
            {/* Column 4 */}
            <div className="space-y-4">
                 <div className="text-xs font-bold text-green-500 uppercase tracking-widest border-b border-gray-800 pb-2">4. Standardized Output</div>
                 <div className="bg-gray-900 border-2 border-green-900 p-6 rounded-lg h-full flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(22,163,74,0.1)]">
                      <Database size={48} className="text-green-500 mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Vector Database</h3>
                      <p className="text-xs text-gray-400">Structured, comparable data points ready for Peer Analysis.</p>
                 </div>
            </div>
        </div>
    </div>
);

const RulesLogicTable = () => {
    // Define the specific extraction rules table
    const extractionRules = [
        {
            bank: BankName.HSBC,
            source: 'The Hongkong and Shanghai Banking Corporation Limited Interim Financial Report',
            methodology: 'Strict Geo-Filtering: Hong Kong',
            logic: 'Extracted directly from the "Segment Reporting" note, specifically the "Hong Kong" column. This isolates HK operations from the broader "The Hongkong and Shanghai Banking Corporation Limited" (HBAP) entity which includes Rest of APAC.',
            notes: 'Excludes Rest of Asia Pacific.'
        },
        {
            bank: BankName.HSBC,
            source: 'HSBC Presentation to Investors (2Q 2025)',
            methodology: 'Cross-Document Derivation',
            logic: 'The "CASA Ratio" (65%) is derived from the "Time Deposit Ratio" (35%) explicitly stated on Page 28 of the Presentation (Priority 3). This ratio is then applied to the "Total Deposits" figure validated from the Interim Report (Priority 1) to derive the CASA Balance.',
            notes: 'Formula: CASA Balance = Interim Report Total Deposits * (1 - 35%).'
        },
        {
            bank: BankName.SC_HK,
            source: 'Standard Chartered Bank (Hong Kong) Limited Interim Financial Report',
            methodology: 'Legal Entity Consolidated',
            logic: 'Data is taken from the "Standard Chartered Bank (Hong Kong) Limited" Interim Report. We ignore the Datapack when the Report is available.',
            notes: 'ASSUMPTION: This legal entity includes branches in China, Korea, and Japan. We treat this entire entity as the "Hong Kong" proxy for comparison purposes.'
        },
        {
            bank: BankName.BEA_HK,
            source: 'Bank of East Asia Interim Report',
            methodology: 'Segment Reporting: Hong Kong',
            logic: 'Direct extraction from Note on Segment Reporting where "Hong Kong" is explicitly broken out.',
            notes: ''
        },
        {
            bank: BankName.BOC_HK,
            source: 'BOC Hong Kong (Holdings) Data Pack',
            methodology: 'Group Consolidated',
            logic: 'BOCHK operates primarily in HK. Minor Southeast Asia operations included in Group figures are deemed immaterial for high-level comparison.',
            notes: ''
        },
        {
            bank: BankName.HANG_SENG,
            source: 'Hang Seng Bank Interim Report',
            methodology: 'Group Consolidated',
            logic: 'Primary operations are in HK. Mainland subsidiary data is included.',
            notes: ''
        }
    ];

    // Define the business line taxonomy table
    const taxonomyRules = [
        {
            standard: 'Retail & Wealth',
            hsbc: 'Wealth and Personal Banking (WPB)',
            sc: 'Consumer, Private & Business Banking (CPBB)',
            bea: 'Personal Banking',
            boc: 'Personal Banking',
            hangseng: 'Wealth and Personal Banking'
        },
        {
            standard: 'Corporate & Commercial',
            hsbc: 'Commercial Banking (CMB)',
            sc: 'Corporate, Commercial & Institutional Banking (CCIB)',
            bea: 'Corporate Banking',
            boc: 'Corporate Banking',
            hangseng: 'Commercial Banking'
        },
        {
            standard: 'Global Markets / Treasury',
            hsbc: 'Global Banking and Markets (GBM)',
            sc: 'Financial Markets (within CCIB)',
            bea: 'Treasury Markets',
            boc: 'Treasury',
            hangseng: 'Global Markets'
        }
    ];

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-950">
             <div className="mb-8">
                <h2 className="text-2xl font-mono text-white mb-2">EXTRACTION RULES & TAXONOMY</h2>
                <p className="text-gray-400 text-sm max-w-4xl">
                    Transparency on how we extract data from different reporting structures and map them to a standardized comparison framework.
                </p>
            </div>

            {/* Section 1: Extraction Logic Table */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="text-amber-500" size={18} />
                    <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Source Extraction Logic</h3>
                </div>
                <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-900 border-b border-gray-800">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Bank Entity</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-64">Target Source Document</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-48">Extraction Methodology</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Logic & Adjustments</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {extractionRules.map((rule, idx) => (
                                <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="p-4 align-top font-bold text-gray-300 text-sm">{rule.bank}</td>
                                    <td className="p-4 align-top text-gray-400 text-xs font-mono">
                                        {rule.source}
                                    </td>
                                    <td className="p-4 align-top text-amber-500 text-xs font-bold">
                                        {rule.methodology}
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="text-gray-300 text-sm mb-2 leading-relaxed">{rule.logic}</div>
                                        {rule.notes && (
                                            <div className="flex gap-2 p-2 bg-amber-900/20 border border-amber-900/30 rounded mt-2">
                                                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-xs text-amber-200/80 italic font-mono">{rule.notes}</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Business Line Taxonomy Table */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Table className="text-blue-500" size={18} />
                    <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Business Line Taxonomy (Apple-to-Apple Mapping)</h3>
                </div>
                <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-900 border-b border-gray-800">
                            <tr>
                                <th className="p-4 text-xs font-bold text-blue-400 uppercase tracking-wider w-48 border-r border-gray-800">Standardized Segment</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">HSBC Mapping</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Standard Chartered Mapping</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">BEA Mapping</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">BOC HK Mapping</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-xs">
                            {taxonomyRules.map((tax, idx) => (
                                <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="p-4 align-middle font-bold text-white border-r border-gray-800 bg-gray-900/30">
                                        {tax.standard}
                                    </td>
                                    <td className="p-4 align-middle text-gray-400 font-mono">{tax.hsbc}</td>
                                    <td className="p-4 align-middle text-gray-400 font-mono">{tax.sc}</td>
                                    <td className="p-4 align-middle text-gray-400 font-mono">{tax.bea}</td>
                                    <td className="p-4 align-middle text-gray-400 font-mono">{tax.boc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 text-[10px] text-gray-500 italic">
                    * Note: Private Banking is typically rolled into "Retail & Wealth" for standard comparison unless explicitly broken out by all peers.
                </div>
            </div>
        </div>
    );
};

const WaterfallView = () => {
    const { waterfallConfigs } = useData();

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-950 flex flex-col">
            <div className="mb-8">
                <h2 className="text-2xl font-mono text-white mb-2">DATA EXTRACTION WATERFALL</h2>
                <p className="text-gray-400 text-sm max-w-4xl">
                    Define the prioritization logic for data extraction when multiple source documents exist for the same bank/period.
                    The system attempts to extract data from the highest priority document first.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {waterfallConfigs.map((config) => (
                    <div key={config.bank} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                        <div className="bg-gray-800/50 p-4 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-white text-sm">{config.bank}</h3>
                            <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Priority Rules</span>
                        </div>
                        <div className="p-4 space-y-4">
                            {config.rules.map((rule, idx) => (
                                <div key={idx} className="relative flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${rule.priority === 4 ? 'bg-purple-900/50 border-purple-500 text-purple-200' : (idx === 0 ? 'bg-amber-600 border-amber-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400')}`}>
                                            {rule.priority}
                                        </div>
                                        {idx < config.rules.length - 1 && (
                                            <div className="w-0.5 h-8 bg-gray-800 my-1"></div>
                                        )}
                                    </div>
                                    <div className={`flex-1 p-3 rounded border ${idx === 0 ? 'bg-amber-900/10 border-amber-900/30' : 'bg-gray-950/50 border-gray-800'}`}>
                                        <div className={`text-xs font-bold mb-1 ${idx === 0 ? 'text-amber-500' : 'text-gray-300'}`}>{rule.docType}</div>
                                        <div className="text-[10px] text-gray-500">{rule.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DataEstimatesView = () => {
    const { addManualEstimate } = useData();
    
    // Period Selection State
    const [targetPeriods, setTargetPeriods] = useState<string[]>(['2025 1H']);
    const availablePeriods = ['2025 1H', '2024 FY', '2024 1H'];

    // UI Tab State
    const [activeModel, setActiveModel] = useState<'loans' | 'deposits'>('loans');

    // Loan Model Inputs (Asset Basis)
    const [loanInputs, setLoanInputs] = useState({
        personal: 124403,
        wholesale: 147833,
        wealth: 16480,
        totalHK: 551323,
        groupTotal: 534321
    });
    const [loanOverride, setLoanOverride] = useState({ active: false, value: 0 });

    // Deposit Model Inputs (Liability Basis)
    // Updated based on Note 27 Segment Reporting (Liabilities)
    const [depositInputs, setDepositInputs] = useState({
        personal: 358649, // Updated
        wholesale: 56403, // Updated
        wealth: 38361, // Updated
        totalHK: 490391, // Updated Total Liabilities
        groupTotal: 665226 // Group Total Deposits
    });
    const [depositOverride, setDepositOverride] = useState({ active: false, value: 0 });

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

    // --- Calculations ---

    // Loans (Asset Proxy)
    const sumLoanSegments = loanInputs.personal + loanInputs.wholesale + loanInputs.wealth;
    const computedLoanRatio = loanInputs.totalHK > 0 ? (sumLoanSegments / loanInputs.totalHK) * 100 : 0;
    const finalLoanRatio = loanOverride.active ? loanOverride.value : computedLoanRatio;
    const estimatedLoans = Math.round(loanInputs.groupTotal * (finalLoanRatio / 100));

    // Deposits (Liability Proxy)
    const sumDepositSegments = depositInputs.personal + depositInputs.wholesale + depositInputs.wealth;
    const computedDepositRatio = depositInputs.totalHK > 0 ? (sumDepositSegments / depositInputs.totalHK) * 100 : 0;
    const finalDepositRatio = depositOverride.active ? depositOverride.value : computedDepositRatio;
    const estimatedDeposits = Math.round(depositInputs.groupTotal * (finalDepositRatio / 100));

    // --- Handlers ---

    const togglePeriod = (p: string) => {
        setTargetPeriods(prev => {
            if (prev.includes(p)) return prev.filter(x => x !== p);
            return [...prev, p];
        });
    };

    const handleSave = () => {
        if (targetPeriods.length === 0) {
            alert("Please select at least one period to apply this logic.");
            return;
        }

        const bank = BankName.BEA_HK;
        const currency = Currency.HKD;
        const segment = StandardizedSegment.GROUP;

        const newPoints: FinancialDataPoint[] = [];

        targetPeriods.forEach(period => {
            // Logic for LOANS
            if (activeModel === 'loans') {
                const sourceDoc = `Internal Estimate: HK Asset Proxy (Period: ${period})`;
                const traceStep: NormalizationStep = {
                    id: Math.random().toString(36),
                    stepName: 'Allocation Logic (Assets)',
                    description: `Ratio: ${finalLoanRatio.toFixed(2)}%. Formula: (Personal+Wholesale+Wealth Assets) / Total HK Assets. Applied to Group Loans (${loanInputs.groupTotal.toLocaleString()}).`,
                    status: 'warning'
                };
                const lid = generateLogicalId(bank, period, 'Total Loans', segment);
                newPoints.push({
                    id: generateDataPointId(lid, sourceDoc),
                    logicalId: lid,
                    metric: 'Total Loans',
                    value: estimatedLoans,
                    unit: 'm',
                    currency,
                    period,
                    year: parseInt(period.slice(0, 4)),
                    frequency: Frequency.SEMI_ANNUAL,
                    bank,
                    sourceDoc,
                    docTypePriority: 4,
                    pageNumber: 32,
                    extractionContext: "Calculated via 'Data Estimates' Logic Engine (Asset Proxy)",
                    normalized: true,
                    standardizedSegment: segment,
                    rawExtractSnippet: `Est: ${estimatedLoans}`,
                    normalizationTrace: [traceStep]
                });
            }

            // Logic for DEPOSITS
            if (activeModel === 'deposits') {
                const sourceDoc = `Internal Estimate: HK Liability Proxy (Period: ${period})`;
                const traceStep: NormalizationStep = {
                    id: Math.random().toString(36),
                    stepName: 'Allocation Logic (Liabilities)',
                    description: `Ratio: ${finalDepositRatio.toFixed(2)}%. Formula: (Personal+Wholesale+Wealth Liabilities) / Total HK Liabilities. Applied to Group Deposits (${depositInputs.groupTotal.toLocaleString()}).`,
                    status: 'warning'
                };
                const lid = generateLogicalId(bank, period, 'Total Deposits', segment);
                newPoints.push({
                    id: generateDataPointId(lid, sourceDoc),
                    logicalId: lid,
                    metric: 'Total Deposits',
                    value: estimatedDeposits,
                    unit: 'm',
                    currency,
                    period,
                    year: parseInt(period.slice(0, 4)),
                    frequency: Frequency.SEMI_ANNUAL,
                    bank,
                    sourceDoc,
                    docTypePriority: 4,
                    pageNumber: 32,
                    extractionContext: "Calculated via 'Data Estimates' Logic Engine (Liability Proxy)",
                    normalized: true,
                    standardizedSegment: segment,
                    rawExtractSnippet: `Est: ${estimatedDeposits}`,
                    normalizationTrace: [traceStep]
                });
            }
        });

        addManualEstimate(newPoints);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-950 flex flex-col">
            <div className="mb-6">
                <h2 className="text-2xl font-mono text-white mb-2">DATA ESTIMATES ENGINE</h2>
                <p className="text-gray-400 text-sm max-w-4xl">
                    Create custom logic to proxy missing data points. These estimates are assigned <span className="text-purple-400 font-bold">Priority 4</span> in the data waterfall.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                {/* Sidebar: Active Models List */}
                <div className="lg:col-span-3 border-r border-gray-800 pr-6">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Logic Models</h3>
                    <div className="space-y-3">
                        <div 
                            onClick={() => setActiveModel('loans')}
                            className={`p-3 border rounded cursor-pointer transition-colors ${activeModel === 'loans' ? 'bg-purple-900/20 border-purple-500/50' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}
                        >
                            <div className={`text-sm font-bold mb-1 ${activeModel === 'loans' ? 'text-purple-300' : 'text-gray-300'}`}>BEA HK Loans Proxy</div>
                            <div className="text-[10px] text-gray-500">Asset-based allocation (P+W+WM) / Total Assets</div>
                        </div>
                        <div 
                            onClick={() => setActiveModel('deposits')}
                            className={`p-3 border rounded cursor-pointer transition-colors ${activeModel === 'deposits' ? 'bg-purple-900/20 border-purple-500/50' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}
                        >
                            <div className={`text-sm font-bold mb-1 ${activeModel === 'deposits' ? 'text-purple-300' : 'text-gray-300'}`}>BEA HK Deposits Proxy</div>
                            <div className="text-[10px] text-gray-500">Liability-based allocation (P+W+WM) / Total Liab</div>
                        </div>
                    </div>
                </div>

                {/* Main Calculator Area */}
                <div className="lg:col-span-9 flex flex-col">
                    
                    {/* Top Bar: Logic Scope */}
                    <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-800 flex items-center gap-6">
                         <div className="flex items-center gap-2">
                             <Calendar size={18} className="text-amber-500" />
                             <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Logic Scope</span>
                         </div>
                         <div className="flex items-center gap-3">
                             {availablePeriods.map(p => {
                                 const isSelected = targetPeriods.includes(p);
                                 return (
                                     <button 
                                        key={p} 
                                        onClick={() => togglePeriod(p)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${isSelected ? 'bg-amber-900/30 border-amber-500 text-amber-500' : 'bg-black border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                     >
                                         {isSelected ? <CheckSquare size={12}/> : <Square size={12}/>}
                                         {p}
                                     </button>
                                 );
                             })}
                         </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <Calculator className="text-purple-400" size={20} />
                        <span className="font-mono text-sm text-gray-300">
                            Model: <span className="text-white font-bold">{activeModel === 'loans' ? 'Loans Estimation (Asset Basis)' : 'Deposits Estimation (Liability Basis)'}</span>
                        </span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch relative">
                        {/* INPUTS COLUMN */}
                        <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-lg flex flex-col">
                            <div className="text-xs font-bold text-blue-400 uppercase mb-4 flex items-center gap-2">
                                <ArrowDownCircle size={14}/> 1. {activeModel === 'loans' ? 'Asset Variables (HK)' : 'Liability Variables (HK)'}
                            </div>
                            
                            <div className="space-y-4 flex-1">
                                {activeModel === 'loans' ? (
                                    <>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Personal Banking Assets</label>
                                            <input type="number" value={loanInputs.personal} onChange={e => setLoanInputs({...loanInputs, personal: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Wholesale Banking Assets</label>
                                            <input type="number" value={loanInputs.wholesale} onChange={e => setLoanInputs({...loanInputs, wholesale: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Wealth Management Assets</label>
                                            <input type="number" value={loanInputs.wealth} onChange={e => setLoanInputs({...loanInputs, wealth: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div className="pt-2 border-t border-gray-800 mt-2">
                                            <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1"><span>Sum (Numerator)</span> <span>{sumLoanSegments.toLocaleString()}</span></div>
                                        </div>
                                        <div className="pt-2">
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Total Assets (HK)</label>
                                            <input type="number" value={loanInputs.totalHK} onChange={e => setLoanInputs({...loanInputs, totalHK: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Personal Banking Liabilities</label>
                                            <input type="number" value={depositInputs.personal} onChange={e => setDepositInputs({...depositInputs, personal: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Wholesale Banking Liabilities</label>
                                            <input type="number" value={depositInputs.wholesale} onChange={e => setDepositInputs({...depositInputs, wholesale: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Wealth Management Liabilities</label>
                                            <input type="number" value={depositInputs.wealth} onChange={e => setDepositInputs({...depositInputs, wealth: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                        <div className="pt-2 border-t border-gray-800 mt-2">
                                            <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1"><span>Sum (Numerator)</span> <span>{sumDepositSegments.toLocaleString()}</span></div>
                                        </div>
                                        <div className="pt-2">
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Total Liabilities (HK)</label>
                                            <input type="number" value={depositInputs.totalHK} onChange={e => setDepositInputs({...depositInputs, totalHK: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-white focus:border-blue-500 outline-none" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* LOGIC COLUMN */}
                        <div className="flex flex-col items-center justify-center p-4">
                            <ArrowRight size={24} className="text-gray-600 mb-2 rotate-90 lg:rotate-0" />
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 w-full text-center">
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Calculated Allocation %</div>
                                <div className="text-3xl font-bold text-white font-mono mb-1">
                                    {activeModel === 'loans' ? computedLoanRatio.toFixed(2) : computedDepositRatio.toFixed(2)}%
                                </div>
                                <div className="text-[10px] text-gray-500 mb-4">(Numerator / Total {activeModel === 'loans' ? 'Assets' : 'Liabilities'})</div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-700 text-left">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] text-amber-500 uppercase font-bold">Manual Override</label>
                                        <button 
                                            onClick={() => activeModel === 'loans' ? setLoanOverride(p => ({...p, active: !p.active})) : setDepositOverride(p => ({...p, active: !p.active}))}
                                            className={`w-8 h-4 rounded-full relative transition-colors ${(activeModel === 'loans' ? loanOverride.active : depositOverride.active) ? 'bg-amber-600' : 'bg-gray-600'}`}
                                        >
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${(activeModel === 'loans' ? loanOverride.active : depositOverride.active) ? 'left-4.5' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>
                                    {(activeModel === 'loans' ? loanOverride.active : depositOverride.active) && (
                                        <input 
                                            type="number" 
                                            value={activeModel === 'loans' ? loanOverride.value : depositOverride.value} 
                                            onChange={e => activeModel === 'loans' ? setLoanOverride({...loanOverride, value: parseFloat(e.target.value)}) : setDepositOverride({...depositOverride, value: parseFloat(e.target.value)})}
                                            className="w-full bg-black border border-amber-500/50 rounded p-2 text-right text-sm text-amber-500 font-bold focus:outline-none" 
                                        />
                                    )}
                                </div>
                            </div>
                            <ArrowRight size={24} className="text-gray-600 mt-2 rotate-90 lg:rotate-0" />
                        </div>

                        {/* OUTPUT COLUMN */}
                        <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-lg flex flex-col">
                             <div className="text-xs font-bold text-green-400 uppercase mb-4 flex items-center gap-2">
                                 <ArrowDownCircle size={14}/> 2. Apply to {activeModel === 'loans' ? 'Group Loans' : 'Group Deposits'}
                             </div>
                             
                             <div className="space-y-4 flex-1">
                                {activeModel === 'loans' ? (
                                    <>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Group Total Loans</label>
                                            <input type="number" value={loanInputs.groupTotal} onChange={e => setLoanInputs({...loanInputs, groupTotal: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-gray-300 focus:border-green-500 outline-none" />
                                        </div>
                                        <div className="mt-8 p-4 bg-green-900/10 border border-green-900/50 rounded">
                                            <label className="text-[10px] text-green-500 uppercase font-bold block mb-1">Estimated HK Loans</label>
                                            <div className="text-3xl font-mono text-white text-right tracking-tight">{estimatedLoans.toLocaleString()}</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-mono block mb-1">Group Total Deposits</label>
                                            <input type="number" value={depositInputs.groupTotal} onChange={e => setDepositInputs({...depositInputs, groupTotal: parseInt(e.target.value)})} className="w-full bg-black border border-gray-700 rounded p-2 text-right text-sm text-gray-300 focus:border-green-500 outline-none" />
                                        </div>
                                        <div className="mt-8 p-4 bg-green-900/10 border border-green-900/50 rounded">
                                            <label className="text-[10px] text-green-500 uppercase font-bold block mb-1">Estimated HK Deposits</label>
                                            <div className="text-3xl font-mono text-white text-right tracking-tight">{estimatedDeposits.toLocaleString()}</div>
                                        </div>
                                    </>
                                )}
                             </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end pt-4 border-t border-gray-800">
                         <button 
                            onClick={handleSave}
                            className={`flex items-center gap-2 px-6 py-3 rounded text-sm font-bold uppercase tracking-wider transition-all transform active:scale-95 ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                        >
                            {saveStatus === 'saved' ? <CheckCircle size={18} /> : <Save size={18} />}
                            {saveStatus === 'saved' ? `Estimate Saved & Activated` : `Save & Activate ${activeModel === 'loans' ? 'Loan' : 'Deposit'} Model`}
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuditTrailView = () => {
    const { financialData, validationMap, selectedAuditId, setSelectedAuditId } = useData();
    const [auditSearch, setAuditSearch] = useState('');

    useEffect(() => {
        if (selectedAuditId) {
           setAuditSearch('');
        }
    }, [selectedAuditId]);

    const handleClearFilter = () => {
        setSelectedAuditId(null);
        setAuditSearch('');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAuditSearch(e.target.value);
        if (selectedAuditId) {
            setSelectedAuditId(null);
        }
    };

    // Filter logic
    const filteredAudit = financialData.filter(d => {
        if (selectedAuditId) {
            // Check against unique Data Point ID (e.g., from citation click)
            return d.id === selectedAuditId;
        }
        if (!auditSearch) return true;
        const searchLower = auditSearch.toLowerCase();
        return (
            d.metric.toLowerCase().includes(searchLower) || 
            d.bank.toLowerCase().includes(searchLower) ||
            d.sourceDoc.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="p-8 h-full overflow-y-auto bg-slate-950 flex flex-col">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-mono text-white mb-2">DATA AUDIT TRAIL & LINEAGE</h2>
                    <p className="text-gray-400 text-sm max-w-4xl">Trace every data point from its source document extraction through to user validation and final locking.</p>
                </div>
            </div>
            
            <div className="mb-6 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <input 
                        type="text" 
                        placeholder="Search by metric, bank, or document..." 
                        className="w-full bg-gray-900 border border-gray-800 rounded px-4 py-2 text-sm text-gray-300 focus:border-amber-500 outline-none pl-10"
                        value={auditSearch}
                        onChange={handleSearchChange}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                </div>
                
                {selectedAuditId && (
                     <button 
                        onClick={handleClearFilter}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-900/30 border border-amber-900/50 rounded text-amber-500 text-xs hover:bg-amber-900/50 transition-colors"
                     >
                        <X size={14} /> Clear Citation Filter
                     </button>
                )}
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-gray-800 bg-gray-900/30">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-900 sticky top-0 z-10">
                        <tr>
                             <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data Point</th>
                             <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source Context</th>
                             <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Extracted Value</th>
                             <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Current Value</th>
                             <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                             <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Lifecycle Log</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm">
                        {filteredAudit.map((item) => {
                            // Status is keyed by Logical ID now
                            const status = validationMap[item.logicalId] || { isValidated: false, isOverride: false, currentValue: item.value, lastModified: new Date().toISOString() };
                            const isModified = status.isOverride && !status.isValidated;
                            const isSelected = selectedAuditId === item.id;
                            
                            return (
                                <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-amber-900/20' : 'hover:bg-gray-800/40'}`}>
                                    <td className="p-4 align-top">
                                        <div className={`font-bold ${isSelected ? 'text-amber-400' : 'text-gray-200'}`}>{item.metric}</div>
                                        <div className="text-xs text-gray-500 mt-1">{item.bank}</div>
                                        <div className="text-[10px] text-gray-600 font-mono mt-0.5">{item.standardizedSegment}</div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="flex items-center gap-2 text-xs text-amber-500 mb-1">
                                            <FileText size={12} /> {item.sourceDoc}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${item.docTypePriority === 1 ? 'bg-green-900/30 text-green-400 border-green-900' : (item.docTypePriority === 4 ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-gray-800 text-gray-500 border-gray-700')}`}>
                                                Priority {item.docTypePriority}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            <span className="font-bold">Pg {item.pageNumber}:</span> {item.extractionContext}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right align-top font-mono text-gray-400">
                                        {item.value.toLocaleString()} <span className="text-[10px]">{item.currency}</span>
                                    </td>
                                    <td className="p-4 text-right align-top font-mono text-white">
                                        <span className={status.isOverride ? 'text-amber-400' : ''}>{status.currentValue.toLocaleString()}</span> <span className="text-[10px] text-gray-500">{item.currency}</span>
                                    </td>
                                    <td className="p-4 text-center align-top">
                                        {status.isValidated ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-900/30 text-green-500 text-[10px] font-bold uppercase border border-green-900/50">
                                                Locked
                                            </span>
                                        ) : isModified ? (
                                             <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-900/30 text-amber-500 text-[10px] font-bold uppercase border border-amber-900/50">
                                                Modified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-gray-500 text-[10px] font-bold uppercase border border-gray-700">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 align-top">
                                        <ul className="text-[10px] text-gray-500 space-y-1 font-mono border-l-2 border-gray-800 pl-2">
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                <span>System: Selected via Waterfall (P{item.docTypePriority})</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                                                <span>Extracted from Source</span>
                                            </li>
                                            {item.extractionContext?.includes("Assumption") && (
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                    <span className="text-amber-500/80">Assumption Applied: Check Scope</span>
                                                </li>
                                            )}
                                            {item.docTypePriority === 4 && (
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                                    <span className="text-purple-400">Estimate: Custom Logic Applied</span>
                                                </li>
                                            )}
                                            {status.isOverride && (
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                    <span>User: Value Overridden / Est. Activated</span>
                                                </li>
                                            )}
                                            {status.isValidated && (
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    <span>User: Validated & Locked</span>
                                                </li>
                                            )}
                                        </ul>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredAudit.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                                    No audit records found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const NormalizationMap: React.FC = () => {
  const { selectedAuditId } = useData();
  const [viewMode, setViewMode] = useState<'map' | 'rules' | 'waterfall' | 'audit' | 'estimates'>('map');

  useEffect(() => {
      if (selectedAuditId) {
          setViewMode('audit');
      }
  }, [selectedAuditId]);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="bg-slate-900 border-b border-gray-800 px-6 py-3 flex gap-4 z-20">
          <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'map' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><MapIcon size={14} /> Logic Map</button>
          <button onClick={() => setViewMode('rules')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'rules' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><BookOpen size={14} /> Rules & Logic</button>
          <button onClick={() => setViewMode('estimates')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'estimates' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Calculator size={14} /> Data Estimates</button>
          <button onClick={() => setViewMode('waterfall')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'waterfall' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Layers size={14} /> Data Waterfall</button>
          <button onClick={() => setViewMode('audit')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'audit' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><List size={14} /> Audit Trail</button>
      </div>
      <div className="flex-1 overflow-hidden relative">
         {viewMode === 'map' && <LogicMap />}
         {viewMode === 'rules' && <RulesLogicTable />} 
         {viewMode === 'estimates' && <DataEstimatesView />}
         {viewMode === 'waterfall' && <WaterfallView />}
         {viewMode === 'audit' && <AuditTrailView />}
      </div>
    </div>
  );
};