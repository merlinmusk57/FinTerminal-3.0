

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { FinancialDataPoint, IngestedDocument, BankName, FxRateConfig, ValidationStatus, WaterfallConfig } from '../types';
import { MOCK_DOCUMENTS, generateInitialData, generateDataForNewFile, generateLogicalId } from '../mockData';

interface DataContextType {
  documents: IngestedDocument[];
  financialData: FinancialDataPoint[]; // The "Active" set after waterfall resolution
  apiKey: string;
  setApiKey: (key: string) => void;
  fxRateConfig: FxRateConfig;
  setFxRateConfig: (config: FxRateConfig) => void;
  ingestDocument: (file: File) => Promise<void>;
  resetData: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAuditId: string | null;
  setSelectedAuditId: (id: string | null) => void;
  validationMap: Record<string, ValidationStatus>; // Keyed by Logical ID
  updateDataPointValue: (logicalId: string, newValue: number) => void;
  updateDataPointComment: (logicalId: string, comment: string) => void;
  toggleValidation: (logicalId: string) => void;
  toggleNA: (logicalId: string) => void;
  toggleFlag: (logicalId: string) => void;
  waterfallConfigs: WaterfallConfig[];
  setWaterfallConfigs: (configs: WaterfallConfig[]) => void;
  addManualEstimate: (points: FinancialDataPoint[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_FX_CONFIG: FxRateConfig = {
    usdToHkd: 7.82,
    source: 'default',
    lastUpdated: new Date().toISOString()
};

// Default Waterfall: 1. Statutory, 2. Data Pack, 3. Other, 4. Estimates
const DEFAULT_WATERFALLS: WaterfallConfig[] = Object.values(BankName).map(bank => {
    // Custom Waterfall for BOC HK: Data Pack (1) > Report (2)
    if (bank === BankName.BOC_HK) {
        return {
            bank,
            rules: [
                { priority: 1, docType: 'Data Pack', description: 'Structured Investor Data Pack (Highest Reliability)' },
                { priority: 2, docType: 'Interim/Annual Report', description: 'Statutory Filings' },
                { priority: 3, docType: 'Presentation/Other', description: 'Investor Presentations or Other Sources' },
                { priority: 4, docType: 'Internal Estimate', description: 'Calculated Proxies / Custom Models' }
            ]
        };
    }
    
    // Default for others
    return {
        bank,
        rules: [
            { priority: 1, docType: 'Interim/Annual Report', description: 'Statutory Filings (Highest Reliability)' },
            { priority: 2, docType: 'Data Pack', description: 'Investor Data Packs (Excel/PDF)' },
            { priority: 3, docType: 'Presentation/Other', description: 'Investor Presentations or Other Sources' },
            { priority: 4, docType: 'Internal Estimate', description: 'Calculated Proxies / Custom Models' }
        ]
    };
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<IngestedDocument[]>(MOCK_DOCUMENTS);
  const [rawFinancialData, setRawFinancialData] = useState<FinancialDataPoint[]>([]);
  const [apiKey, setApiKeyState] = useState('');
  const [fxRateConfig, setFxRateConfigState] = useState<FxRateConfig>(DEFAULT_FX_CONFIG);
  const [activeTab, setActiveTab] = useState('validation');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  
  // Validation Map now uses LOGICAL ID (Bank+Metric+Period+Segment) as key
  const [validationMap, setValidationMap] = useState<Record<string, ValidationStatus>>({});
  
  const [waterfallConfigs, setWaterfallConfigs] = useState<WaterfallConfig[]>(DEFAULT_WATERFALLS);

  // Initialize Data
  useEffect(() => {
    const initialData = generateInitialData();
    setRawFinancialData(initialData);
    
    // Load API Key
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKeyState(storedKey);

    // Load FX Config
    const storedFx = localStorage.getItem('fx_rate_config');
    if (storedFx) {
        try {
            setFxRateConfigState(JSON.parse(storedFx));
        } catch (e) {
            console.error("Failed to parse stored FX config");
        }
    }

    // Load Validation Map
    const storedValidation = localStorage.getItem('data_validation_map_v2'); // v2 for logical ID structure
    if (storedValidation) {
        try {
            setValidationMap(JSON.parse(storedValidation));
        } catch (e) {
            console.error("Failed to parse validation map");
        }
    } else {
        // Initialize map with default values from resolved data (will happen in resolve step)
    }
  }, []);

  // Persist Validation Map whenever it changes
  useEffect(() => {
      if (Object.keys(validationMap).length > 0) {
          localStorage.setItem('data_validation_map_v2', JSON.stringify(validationMap));
      }
  }, [validationMap]);

  // --- WATERFALL RESOLUTION LOGIC ---
  const financialData = useMemo(() => {
      // Group by Logical ID
      const grouped: Record<string, FinancialDataPoint[]> = {};
      rawFinancialData.forEach(p => {
          if (!grouped[p.logicalId]) grouped[p.logicalId] = [];
          grouped[p.logicalId].push(p);
      });

      // Select Best Candidate for each Logical ID
      const resolved: FinancialDataPoint[] = [];
      Object.keys(grouped).forEach(lid => {
          const candidates = grouped[lid];
          // Sort by priority (1 is best)
          candidates.sort((a, b) => a.docTypePriority - b.docTypePriority);
          // Pick the first one
          if (candidates.length > 0) {
              resolved.push(candidates[0]);
          }
      });
      return resolved;
  }, [rawFinancialData, waterfallConfigs]); // Recalculate if raw data or waterfall rules change

  // --- VALIDATION ACTIONS ---

  const updateDataPointValue = (logicalId: string, newValue: number) => {
      setValidationMap(prev => {
          // If the data point is Locked (isValidated), DO NOT allow update unless unlocked first.
          if (prev[logicalId]?.isValidated) return prev;

          const current = prev[logicalId] || {
            isOverride: false,
            isValidated: false,
            isNA: false,
            isFlagged: false,
            originalValue: newValue, // Fallback
            currentValue: newValue,
            lastModified: new Date().toISOString()
          };

          return {
              ...prev,
              [logicalId]: {
                  ...current,
                  isOverride: true,
                  currentValue: newValue,
                  isNA: false, // Reset N/A if updating value
                  lastModified: new Date().toISOString()
              }
          };
      });
  };

  const updateDataPointComment = (logicalId: string, comment: string) => {
      const dataPoint = financialData.find(d => d.logicalId === logicalId);
      const val = dataPoint ? dataPoint.value : 0;

      setValidationMap(prev => {
          const current = prev[logicalId] || {
            isOverride: false,
            isValidated: false,
            isNA: false,
            isFlagged: false,
            originalValue: val,
            currentValue: val,
            lastModified: new Date().toISOString()
          };

          return {
              ...prev,
              [logicalId]: {
                  ...current,
                  comments: comment,
                  lastModified: new Date().toISOString()
              }
          };
      });
  };

  const toggleValidation = (logicalId: string) => {
      // Find the current value to initialize map if missing
      const dataPoint = financialData.find(d => d.logicalId === logicalId);
      const val = dataPoint ? dataPoint.value : 0;

      setValidationMap(prev => {
          const current = prev[logicalId] || {
              isOverride: false,
              isValidated: false,
              isNA: false,
              isFlagged: false,
              originalValue: val,
              currentValue: val,
              lastModified: new Date().toISOString()
          };

          return {
              ...prev,
              [logicalId]: {
                  ...current,
                  isValidated: !current.isValidated, // Toggle Lock
                  lastModified: new Date().toISOString()
              }
          };
      });
  };

  const toggleNA = (logicalId: string) => {
    // Cannot toggle N/A if locked
    if (validationMap[logicalId]?.isValidated) return;

    const dataPoint = financialData.find(d => d.logicalId === logicalId);
    const val = dataPoint ? dataPoint.value : 0;

    setValidationMap(prev => {
        const current = prev[logicalId] || {
            isOverride: false,
            isValidated: false,
            isNA: false,
            isFlagged: false,
            originalValue: val,
            currentValue: val,
            lastModified: new Date().toISOString()
        };
        return {
            ...prev,
            [logicalId]: {
                ...current,
                isNA: !current.isNA,
                isOverride: !current.isNA, // Setting N/A counts as an override
                lastModified: new Date().toISOString()
            }
        };
    });
  };

  const toggleFlag = (logicalId: string) => {
    // Cannot toggle flag if locked
    if (validationMap[logicalId]?.isValidated) return;

    const dataPoint = financialData.find(d => d.logicalId === logicalId);
    const val = dataPoint ? dataPoint.value : 0;

    setValidationMap(prev => {
        const current = prev[logicalId] || {
            isOverride: false,
            isValidated: false,
            isNA: false,
            isFlagged: false,
            originalValue: val,
            currentValue: val,
            lastModified: new Date().toISOString()
        };
        return {
            ...prev,
            [logicalId]: {
                ...current,
                isFlagged: !current.isFlagged,
                isOverride: true, // Flagging counts as user modification
                lastModified: new Date().toISOString()
            }
        };
    });
  };

  const ingestDocument = async (file: File) => {
    // 1. Metadata detection
    const lowerName = file.name.toLowerCase();
    let bank = BankName.BEA_HK; 
    if (lowerName.includes('hsbc')) bank = BankName.HSBC;
    else if (lowerName.includes('sc') || lowerName.includes('standard chartered')) bank = BankName.SC_HK;
    else if (lowerName.includes('boc') || lowerName.includes('bank of china')) bank = BankName.BOC_HK;
    else if (lowerName.includes('hang seng')) bank = BankName.HANG_SENG;
    else if (lowerName.includes('bea')) bank = BankName.BEA_HK;

    const newDoc: IngestedDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.name.endsWith('pdf') ? 'PDF' : 'EXCEL',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'processing',
      bank
    };

    setDocuments(prev => [newDoc, ...prev]);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'ready' } : d));
    
    // 2. Generate new data points (candidates)
    const newData = generateDataForNewFile(file.name, bank);
    
    // 3. Add to raw data (do not remove old data, we want to keep candidates for waterfall)
    setRawFinancialData(prev => [...prev, ...newData]);
  };

  const addManualEstimate = (points: FinancialDataPoint[]) => {
      // 1. Add to raw data (Priority 4)
      setRawFinancialData(prev => {
          const logicalIds = new Set(points.map(p => p.logicalId));
          // Remove old estimates for these IDs to avoid duplicates
          const filtered = prev.filter(p => !(logicalIds.has(p.logicalId) && p.docTypePriority === 4));
          return [...filtered, ...points];
      });

      // 2. Force Propagate to Validation Map
      // Since Estimates are Priority 4, they would normally be hidden by Priority 1 (Report) data.
      // To "Activate" them, we must treat them as an active override in the validation layer.
      setValidationMap(prev => {
          const newMap = { ...prev };
          points.forEach(p => {
              newMap[p.logicalId] = {
                  isOverride: true,
                  isValidated: false, // Not "Locked" but "Modified" (Amber) to show it's an estimate
                  isNA: false,
                  isFlagged: false,
                  originalValue: 0, 
                  currentValue: p.value,
                  lastModified: new Date().toISOString()
              };
          });
          return newMap;
      });
  };

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const setFxRateConfig = (config: FxRateConfig) => {
      setFxRateConfigState(config);
      localStorage.setItem('fx_rate_config', JSON.stringify(config));
  };

  const resetData = () => {
    const initData = generateInitialData();
    setRawFinancialData(initData);
    setDocuments(MOCK_DOCUMENTS);
    setValidationMap({});
    localStorage.removeItem('data_validation_map_v2');
  };

  return (
    <DataContext.Provider value={{ 
      documents, 
      financialData, 
      apiKey, 
      setApiKey, 
      fxRateConfig, 
      setFxRateConfig,
      ingestDocument, 
      resetData,
      activeTab,
      setActiveTab,
      selectedAuditId,
      setSelectedAuditId,
      validationMap,
      updateDataPointValue,
      updateDataPointComment,
      toggleValidation,
      toggleNA,
      toggleFlag,
      waterfallConfigs,
      setWaterfallConfigs,
      addManualEstimate
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};