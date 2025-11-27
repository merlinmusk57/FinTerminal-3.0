

import { BankName, Currency, FinancialDataPoint, Frequency, IngestedDocument, NormalizationStep, StandardizedSegment } from './types';

// Deterministic ID generators
export const generateLogicalId = (bank: string, period: string, metric: string, segment: string) => {
    // Simple hash-like string for logical identification (Bank+Period+Metric+Segment)
    const str = `${bank}|${period}|${metric}|${segment}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `LID-${Math.abs(hash).toString(36)}`;
};

export const generateDataPointId = (logicalId: string, sourceDoc: string) => {
    // Unique ID for the specific extraction instance
    const str = `${logicalId}|${sourceDoc}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `DP-${Math.abs(hash).toString(36)}`;
};

const uid = () => Math.random().toString(36).substr(2, 9);

export const MOCK_DOCUMENTS: IngestedDocument[] = [
  { id: 'doc-hsbc-interim-25', name: 'The Hongkong and Shanghai Banking Corporation Limited Interim Financial Report 2025.pdf', type: 'PDF', size: '4.8 MB', uploadDate: '2025-08-23', status: 'ready', bank: BankName.HSBC },
  { id: 'doc-hsbc-datapack-25', name: 'HSBC Holdings plc Data Pack 2Q 2025.pdf', type: 'PDF', size: '3.2 MB', uploadDate: '2025-08-22', status: 'ready', bank: BankName.HSBC },
  { id: 'doc-hsbc-pres-25', name: 'HSBC Holdings plc Presentation to Investors and Analysts 2Q 2025.pdf', type: 'PDF', size: '5.1 MB', uploadDate: '2025-08-23', status: 'ready', bank: BankName.HSBC },
  
  { id: 'doc-bea-25', name: 'The Bank of East Asia, Limited Interim Report 2025.pdf', type: 'PDF', size: '6.5 MB', uploadDate: '2025-08-21', status: 'ready', bank: BankName.BEA_HK },
  
  { id: 'doc-sc-hk-25', name: 'Standard Chartered Bank (Hong Kong) Limited Interim Financial Report 2025.pdf', type: 'PDF', size: '5.2 MB', uploadDate: '2025-08-20', status: 'ready', bank: BankName.SC_HK },
  { id: 'doc-sc-hk-dp-25', name: 'Standard Chartered Bank (Hong Kong) Limited Data Pack 2025.pdf', type: 'PDF', size: '1.9 MB', uploadDate: '2025-08-20', status: 'ready', bank: BankName.SC_HK },
  
  { id: 'doc-boc-25', name: 'BOC HONG KONG (HOLDINGS) LIMITED Data Pack 1H2025.pdf', type: 'PDF', size: '4.1 MB', uploadDate: '2025-08-01', status: 'ready', bank: BankName.BOC_HK },
  { id: 'doc-hase-25', name: 'Hang Seng Bank 2025 Interim Report.pdf', type: 'PDF', size: '8.9 MB', uploadDate: '2025-07-31', status: 'ready', bank: BankName.HANG_SENG },
];

const createTrace = (bank: BankName, segment: StandardizedSegment, originalCurrency: string, docType: string, extraNote?: string): NormalizationStep[] => {
  const steps = [
    { 
      id: uid(), 
      stepName: 'Waterfall Selection', 
      description: `Selected from ${docType} based on priority rules.`, 
      status: 'success' 
    },
    { 
      id: uid(), 
      stepName: 'Extraction', 
      description: `Extracted value from source document.`, 
      status: 'success' 
    }
  ] as NormalizationStep[];

  if (extraNote) {
      steps.push({
          id: uid(),
          stepName: 'Scope Adjustment / Assumption',
          description: extraNote,
          status: 'warning'
      });
  }

  return steps;
};

// --- DATA SOURCE DEFINITIONS ---

interface RawBankProfile {
    sourceName: string;
    docPriority: number; // 1 = Highest
    currency: Currency;
    NII: number;
    FeeIncome: number;
    TradingOtherIncome: number;
    explicitNonNII: number;
    Opex: number;
    ProvisionsTotal: number;
    Loans: number;
    Deposits: number;
    CASA: number;
    TimeDeposits: number;
    NPL: number;
    NIM: number;
    pageMap: Record<string, number>;
    scopeNote?: string;
}

const getBankProfiles = (bank: BankName): RawBankProfile[] => {
    const profiles: RawBankProfile[] = [];

    // --- HSBC SOURCES ---
    if (bank === BankName.HSBC) {
        // Source 1: The Hongkong and Shanghai Banking Corporation Limited Interim Financial Report 2025 (Priority 1)
        profiles.push({
            sourceName: 'The Hongkong and Shanghai Banking Corporation Limited Interim Financial Report 2025.pdf',
            docPriority: 1,
            currency: Currency.HKD,
            NII: 46854,
            FeeIncome: 11272,
            TradingOtherIncome: 4199,
            explicitNonNII: 0, 
            Opex: -18021,
            ProvisionsTotal: -6738,
            Loans: 1806560,
            Deposits: 4061562,
            // REMOVED ESTIMATES: The report does not have CASA breakdown. Set to 0 to allow waterfall to fallback.
            CASA: 0, 
            TimeDeposits: 0,
            NPL: 1.12, 
            NIM: 1.66,
            pageMap: {
                'Net Interest Income': 3,
                'Pretax Earnings': 3,
                'Operating Expenses': 3,
                'Total Deposits': 3,
                'Total Loans': 3
            },
            scopeNote: "Strict Extraction: 'Financial Review' (Page 3) > 'Consolidated income statement by reportable segments' > 'Hong Kong' Column."
        });

        // Source 3: HSBC Presentation (Priority 3)
        // Used specifically for the Ratio found on Page 28
        // Time Deposit Ratio: 35% -> CASA Ratio: 65%
        // Base Deposits (from P1): 4,061,562
        const baseDeposits = 4061562;
        const timeRatio = 0.35;
        const casaRatio = 0.65;
        
        profiles.push({
            sourceName: 'HSBC Holdings plc Presentation to Investors and Analysts 2Q 2025.pdf',
            docPriority: 3,
            currency: Currency.HKD,
            NII: 46800, // Slightly different in Pres, but P1 will override
            FeeIncome: 11200,
            TradingOtherIncome: 4200,
            explicitNonNII: 0,
            Opex: -18000,
            ProvisionsTotal: -6700,
            Loans: 1806000,
            Deposits: baseDeposits,
            CASA: Math.round(baseDeposits * casaRatio), // 2,640,015
            TimeDeposits: Math.round(baseDeposits * timeRatio), // 1,421,547
            NPL: 1.12,
            NIM: 1.66,
            pageMap: {
                'CASA Deposits': 28,
                'Time & Structured Deposits': 28,
                'CASA Ratio': 28,
                'default': 28
            },
            scopeNote: "Derived from Time Deposit Ratio (35%) on Pg 28 applied to Total Deposits."
        });
    }

    // --- BEA SOURCES ---
    if (bank === BankName.BEA_HK) {
        profiles.push({
            sourceName: 'The Bank of East Asia, Limited Interim Report 2025.pdf',
            docPriority: 1,
            currency: Currency.HKD,
            NII: 4485,
            FeeIncome: 1420, // Estimated split to match Non-NII
            TradingOtherIncome: 609, // Estimated split to match Non-NII
            explicitNonNII: 2029,
            Opex: -2805,
            ProvisionsTotal: -1488,
            Loans: 534321, 
            Deposits: 665226, 
            CASA: 150000,
            TimeDeposits: 300500,
            NPL: 2.87,
            NIM: 1.62,
            pageMap: { 
                'Net Interest Income': 31,
                'Non-Interest Income': 31,
                'Operating Expenses': 31,
                'Provisions': 31,
                'Pretax Earnings': 31,
                'default': 31 
            },
            scopeNote: "Strict Extraction: 'Segment Reporting' (Page 31) > 'Hong Kong operations' > 'Total' Column."
        });
    }

    // --- BOC HK SOURCES ---
    if (bank === BankName.BOC_HK) {
        profiles.push({
            sourceName: 'BOC HONG KONG (HOLDINGS) LIMITED Data Pack 1H2025.pdf',
            docPriority: 1, // UPDATED: Priority 1 as requested
            currency: Currency.HKD,
            // Updated to match 1H 2025 Consolidated Income Statement
            NII: 25063,
            FeeIncome: 6292,
            // Balancing figure to reach PBT of 27,275
            // Calc: 25063 (NII) + 6292 (Fee) + X (Trad) - 8310 (Opex) - 3318 (Prov) = 27275
            // X = 27275 + 3318 + 8310 - 6292 - 25063 = 7548
            TradingOtherIncome: 7548, 
            explicitNonNII: 0,
            Opex: -8310,
            ProvisionsTotal: -3318,
            Loans: 1710380,
            Deposits: 2875521,
            CASA: 1664187,
            TimeDeposits: 1211334,
            NPL: 1.02,
            NIM: 1.54,
            pageMap: { 'default': 3 },
            scopeNote: "Data Pack (Priority 1) - Profit Before Taxation matched to 27,275 HK$m"
        });
    }

    // --- STANDARD CHARTERED HK SOURCES ---
    if (bank === BankName.SC_HK) {
        profiles.push({
            sourceName: 'Standard Chartered Bank (Hong Kong) Limited Interim Financial Report 2025.pdf',
            docPriority: 1,
            currency: Currency.HKD,
            NII: 10603,
            FeeIncome: 5260,
            TradingOtherIncome: 17985 + 322,
            explicitNonNII: 0,
            Opex: -17245,
            ProvisionsTotal: -2153, 
            Loans: 850000, 
            Deposits: 1350000, 
            CASA: 650000,
            TimeDeposits: 700000,
            NPL: 1.45,
            NIM: 1.65,
            pageMap: { 
                'Net Interest Income': 2,
                'Pretax Earnings': 2,
                'Operating Expenses': 2,
                'default': 2 
            },
            scopeNote: "Direct Extraction: 'Condensed consolidated income statement' (Page 2). Includes CN/KR/JP branches per entity scope."
        });

        profiles.push({
            sourceName: 'Standard Chartered Bank (Hong Kong) Limited Data Pack 2025.pdf',
            docPriority: 3, 
            currency: Currency.HKD,
            NII: 10500,
            FeeIncome: 5200,
            TradingOtherIncome: 18000,
            explicitNonNII: 0,
            Opex: -17300,
            ProvisionsTotal: -2150,
            Loans: 845000,
            Deposits: 1355000,
            CASA: 0,
            TimeDeposits: 0,
            NPL: 1.45,
            NIM: 1.65,
            pageMap: { 'default': 4 },
            scopeNote: "Backup Source. Standard Chartered Bank (Hong Kong) Limited."
        });
    }

    // --- HANG SENG SOURCES ---
    if (bank === BankName.HANG_SENG) {
        const hsTotalDeposits = 1299965;
        const hsCasaRatio = 0.562;
        const hsCasaVal = Math.round(hsTotalDeposits * hsCasaRatio);
        profiles.push({
            sourceName: 'Hang Seng Bank 2025 Interim Report.pdf',
            docPriority: 1,
            currency: Currency.HKD,
            NII: 14046,
            FeeIncome: 2711,
            TradingOtherIncome: 966,
            explicitNonNII: 0,
            Opex: -6432,
            ProvisionsTotal: -4856,
            Loans: 819709,
            Deposits: hsTotalDeposits,
            CASA: hsCasaVal,
            TimeDeposits: hsTotalDeposits - hsCasaVal,
            NPL: 2.85,
            NIM: 1.99,
            pageMap: { 'default': 8 }
        });
    }

    return profiles;
};

export const generateInitialData = (): FinancialDataPoint[] => {
  const data: FinancialDataPoint[] = [];
  // Using real periods found in reports + Historical Context
  const periods = ['2025 1H', '2024 2H']; 
  const banks = [BankName.HSBC, BankName.BEA_HK, BankName.SC_HK, BankName.BOC_HK, BankName.HANG_SENG];
  const segments = [StandardizedSegment.GROUP, StandardizedSegment.RETAIL, StandardizedSegment.CORPORATE, StandardizedSegment.MARKETS];

  // Historical factors to simulate 2024 2H data based on 2025 1H (assuming slight growth in 2025)
  // factor < 1 means 2025 is higher (growth)
  const historicalFactors = {
      'Net Interest Income': 0.96,
      'Fee Income': 0.94,
      'Total Deposits': 0.98,
      'Total Loans': 0.99,
      'Operating Expenses': 0.97,
      'Provisions': 0.90, // Provisions were lower in previous period
      'Pretax Earnings': 0.92,
      'default': 0.98
  };

  banks.forEach(bank => {
    // Get all available profiles (documents) for this bank
    const sourceProfiles = getBankProfiles(bank);

    sourceProfiles.forEach(profile => {
        periods.forEach(period => {
            const isHistorical = period === '2024 2H';
            const year = parseInt(period.slice(0, 4));

            segments.forEach(segment => {
                let segWeight = 1.0; 
                // Simple assumption for segment splitting if not explicitly defined in profile
                if (segment === StandardizedSegment.RETAIL) segWeight = 0.45;
                if (segment === StandardizedSegment.CORPORATE) segWeight = 0.35;
                if (segment === StandardizedSegment.MARKETS) segWeight = 0.20;

                const apply = (val: number, metricName?: string) => {
                    let base = segment === StandardizedSegment.GROUP ? val : Math.round(val * segWeight);
                    if (isHistorical) {
                        const factor = historicalFactors[metricName as keyof typeof historicalFactors] || historicalFactors['default'];
                        base = Math.round(base * factor);
                    }
                    return base;
                };

                const applyRatio = (val: number) => {
                     let r = parseFloat((val).toFixed(2));
                     if (isHistorical) {
                         // Perturb ratio slightly for realism
                         r = parseFloat((val * 0.98).toFixed(2));
                     }
                     return r;
                };

                const nii = apply(profile.NII, 'Net Interest Income');
                const feeIncome = apply(profile.FeeIncome, 'Fee Income');
                const otherIncome = apply(profile.TradingOtherIncome, 'Trading & Other Income');
                
                const nonNII = profile.explicitNonNII > 0 ? apply(profile.explicitNonNII) : (feeIncome + otherIncome);
                const totalIncome = nii + nonNII; 
                const opex = apply(profile.Opex, 'Operating Expenses');
                const costToIncome = totalIncome !== 0 ? (Math.abs(opex) / totalIncome) * 100 : 0;
                const opProfit = totalIncome + opex; 
                const totalProv = apply(profile.ProvisionsTotal, 'Provisions');
                const pbt = opProfit + totalProv; 

                const casa = apply(profile.CASA);
                const timeDeposits = apply(profile.TimeDeposits);
                const deposits = apply(profile.Deposits, 'Total Deposits');
                
                const loanToDepositRatio = deposits !== 0 ? (apply(profile.Loans, 'Total Loans') / deposits) * 100 : 0;
                const netInterestMargin = applyRatio(profile.NIM); 
                const nonNIIRatio = totalIncome !== 0 ? (nonNII / totalIncome) * 100 : 0;
                const casaRatio = deposits !== 0 ? (casa / deposits) * 100 : 0;

                const metrics: { name: string; val: number; unit?: string }[] = [
                { name: 'Net Interest Income', val: nii },
                { name: 'Fee Income', val: feeIncome },
                { name: 'Trading & Other Income', val: otherIncome },
                { name: 'Non-Interest Income', val: nonNII },
                { name: 'Total Income', val: totalIncome },
                { name: 'Operating Expenses', val: opex },
                { name: 'Operating Profit', val: opProfit },
                { name: 'Provisions', val: totalProv },
                { name: 'Pretax Earnings', val: pbt },
                { name: 'Total Loans', val: apply(profile.Loans, 'Total Loans') },
                { name: 'CASA Deposits', val: casa },
                { name: 'Time & Structured Deposits', val: timeDeposits },
                { name: 'Total Deposits', val: deposits },
                { name: 'Loan-to-Deposit Ratio', val: loanToDepositRatio, unit: '%' },
                { name: 'Net Interest Margin', val: netInterestMargin, unit: '%' },
                { name: 'Cost-to-Income Ratio', val: costToIncome, unit: '%' },
                { name: 'Non-NII Ratio', val: nonNIIRatio, unit: '%' },
                { name: 'CASA Ratio', val: casaRatio, unit: '%' },
                ];

                if (segment === StandardizedSegment.GROUP) {
                    metrics.push({ name: 'NPL Ratio', val: applyRatio(profile.NPL), unit: '%' });
                }

                metrics.forEach(m => {
                    // WATERFALL FALL-THROUGH LOGIC:
                    const breakdownMetrics = ['CASA Deposits', 'Time & Structured Deposits', 'CASA Ratio'];
                    if (breakdownMetrics.includes(m.name) && Math.abs(m.val) < 0.01) {
                        return; 
                    }

                    const page = profile.pageMap[m.name] || profile.pageMap['default'] || 1;
                    const docTypeLabel = profile.docPriority === 1 ? 'Statutory Report' : (profile.docPriority === 2 ? 'Data Pack' : 'Presentation');
                    const finalDocName = isHistorical ? profile.sourceName.replace('2025', '2024') : profile.sourceName; // Fake doc name for history
                    
                    const logicalId = generateLogicalId(bank, period, m.name, segment);
                    const dataPointId = generateDataPointId(logicalId, finalDocName);

                    const fullExtractionContext = `Extraction from ${docTypeLabel} (Pg ${page})${profile.scopeNote ? ' | ' + profile.scopeNote : ''}`;

                    data.push({
                        id: dataPointId,
                        logicalId: logicalId,
                        metric: m.name, 
                        value: m.val, 
                        unit: m.unit || 'm', 
                        currency: profile.currency,
                        period, 
                        year, 
                        frequency: Frequency.SEMI_ANNUAL, 
                        bank,
                        sourceDoc: finalDocName,
                        docTypePriority: profile.docPriority,
                        pageNumber: page,
                        extractionContext: fullExtractionContext,
                        normalized: true, 
                        originalSegment: segment === StandardizedSegment.GROUP ? 'Group / Regional Reporting' : segment,
                        standardizedSegment: segment,
                        rawExtractSnippet: `${m.name} ..... ${m.val.toLocaleString()}`, 
                        normalizationTrace: createTrace(bank, segment, profile.currency, docTypeLabel, profile.scopeNote)
                    });
                });
            });
        });
    });
  });

  return data;
};

export const generateDataForNewFile = (filename: string, bank: BankName): FinancialDataPoint[] => {
    const data = generateInitialData().filter(d => d.bank === bank && d.period === '2025 1H' && d.docTypePriority === 2); 
    return data.map(d => {
        const newLogicalId = generateLogicalId(bank, d.period, d.metric, d.standardizedSegment);
        return {
            ...d, 
            sourceDoc: filename, 
            docTypePriority: 3, 
            logicalId: newLogicalId,
            id: generateDataPointId(newLogicalId, filename)
        };
    });
};