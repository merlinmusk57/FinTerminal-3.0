

export enum BankName {
  HSBC = 'HSBC (Hong Kong)',
  BEA_HK = 'Bank of East Asia (HK)',
  SC_HK = 'Standard Chartered HK',
  BOC_HK = 'BOC Hong Kong',
  HANG_SENG = 'Hang Seng Bank',
}

export enum Frequency {
  QUARTERLY = 'Quarterly',
  SEMI_ANNUAL = 'Semi-Annual',
  ANNUAL = 'Annual',
}

export enum Currency {
  HKD = 'HKD',
  USD = 'USD',
  GBP = 'GBP',
}

export enum StandardizedSegment {
  GROUP = 'Group (Total)',
  RETAIL = 'Retail & Wealth',
  CORPORATE = 'Corporate & Commercial',
  MARKETS = 'Global Markets / Treasury'
}

export interface NormalizationStep {
  id: string;
  stepName: string;
  description: string;
  rawInput?: string;
  transformedOutput?: string;
  status: 'success' | 'warning';
}

export interface FinancialDataPoint {
  id: string; // Unique ID for the specific extraction (includes source)
  logicalId: string; // ID representing the business concept (Bank + Metric + Period + Segment)
  metric: string;
  value: number;
  unit: string; // e.g., 'm', 'bn', '%'
  currency: Currency;
  period: string; // e.g., '2023 1H'
  year: number;
  frequency: Frequency;
  bank: BankName;
  sourceDoc: string;
  docTypePriority: number; // 1 = Highest (Statutory), 2 = Data Pack, 3 = Other
  pageNumber: number;
  extractionContext?: string; // e.g., "Segment Reporting - HK", "Consolidated Income Statement"
  normalized: boolean;
  originalSegment?: string;
  standardizedSegment: StandardizedSegment;
  rawExtractSnippet?: string; // The actual text from the PDF
  normalizationTrace?: NormalizationStep[]; // The audit log of changes
}

export interface IngestedDocument {
  id: string;
  name: string;
  type: 'PDF' | 'EXCEL' | 'AUDIO' | 'IMAGE';
  size: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
  bank: BankName;
}

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
};

export interface FxRateConfig {
    usdToHkd: number;
    source: 'default' | 'custom';
    lastUpdated: string;
}

export interface ValidationStatus {
    isOverride: boolean;
    isValidated: boolean; // True means "Locked"
    isNA: boolean;
    isFlagged?: boolean; // True means "Marked/Flagged" (Red/Bold)
    comments?: string;
    originalValue: number;
    currentValue: number;
    lastModified: string;
}

export interface WaterfallConfig {
    bank: BankName;
    rules: {
        priority: number;
        docType: string; // e.g. "Interim Report", "Annual Report", "Data Pack"
        description: string;
    }[];
}