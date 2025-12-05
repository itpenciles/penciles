
export type Strategy = 'Rental' | 'Wholesale' | 'Subject-To' | 'Seller Financing' | 'BRRRR';

export interface Unit {
  bedrooms: number;
  bathrooms: number;
}

export interface Property {
  id: string;
  address: string;
  propertyType: string;
  imageUrl: string;
  dateAnalyzed: string;
  deletedAt?: string; // New field for Soft Delete audit trail
  createdAt?: string; // Reliable timestamp from backend DB

  coordinates?: {
    lat: number;
    lon: number;
  };

  details: {
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    yearBuilt: number;
    numberOfUnits: number;
    unitDetails: Unit[];
    lastSoldDate?: string;
  };

  financials: Financials;

  marketAnalysis: {
    safetyScore: number;
    areaAverageRents: number[];
    investmentScore: number;
  };

  recommendation: Recommendation;

  calculations: CalculatedMetrics;

  // New analysis types for different strategies
  wholesaleAnalysis?: {
    inputs: WholesaleInputs;
    calculations: WholesaleCalculations;
  };
  subjectToAnalysis?: {
    inputs: SubjectToInputs;
    calculations: SubjectToCalculations;
  };
  sellerFinancingAnalysis?: {
    inputs: SellerFinancingInputs;
    calculations: SellerFinancingCalculations;
  };
  brrrrAnalysis?: {
    inputs: BrrrrInputs;
    calculations: BrrrrCalculations;
  };
  comparables?: Comparable[];
  marketComparables?: AttomComparable[];
}

export interface Financials {
  listPrice: number;
  estimatedValue: number;
  purchasePrice: number;
  rehabCost: number;
  downPaymentPercent: number;
  monthlyRents: number[];
  otherMonthlyIncome?: number;
  vacancyRate: number;
  maintenanceRate: number;
  managementRate: number;
  capexRate: number;
  monthlyTaxes: number;
  monthlyInsurance: number;

  monthlyWaterSewer: number;
  monthlyStreetLights: number;
  monthlyGas: number;
  monthlyElectric: number;
  monthlyLandscaping: number;

  // New Operating Expenses
  monthlyHoaFee: number;
  operatingMiscFee: number;

  loanInterestRate: number;
  loanTermYears: number;
  originationFeePercent: number;
  closingFee: number;
  processingFee: number;
  appraisalFee: number;
  titleFee: number;

  // New Closing Costs
  brokerAgentFee: number;
  homeWarrantyFee: number;
  attorneyFee: number;
  closingMiscFee: number;

  // Seller Credits
  sellerCreditTax: number;
  sellerCreditSewer: number;
  sellerCreditOrigination: number;
  sellerCreditClosing: number;
  sellerCreditRents: number;
  sellerCreditSecurityDeposit: number;
  sellerCreditMisc: number;
}

export interface Recommendation {
  level: 'Worth Pursuing' | 'Moderate Risk' | 'High Risk' | 'Avoid';
  summary: string;
  keyFactors: string[];
  additionalNotes: string;
  strategyAnalyzed?: Strategy;
}

export interface CalculatedMetrics {
  downPaymentAmount: number;
  totalCashToClose: number;
  totalInvestment: number;
  loanAmount: number;
  monthlyDebtService: number; // Assuming fixed for simplicity

  grossAnnualRent: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;

  maintenanceCost: number;
  managementCost: number;
  capexCost: number;
  totalOperatingExpenses: number;
  netOperatingIncome: number;

  capRate: number;
  allInCapRate: number;
  cashOnCashReturn: number;
  monthlyCashFlowNoDebt: number;
  monthlyCashFlowWithDebt: number;
  totalClosingCosts: number;
  dscr: number;
}

// --- Wholesale Strategy ---
export interface WholesaleInputs {
  arv: number;
  estimatedRehab: number;
  maoPercentOfArv: number;
  closingCost: number;
  wholesaleFeeGoal: number;
  sellerAsk: number;
  isAssignable: boolean;
}

export interface WholesaleCalculations {
  mao: number;
  potentialFees: number;
  isEligible: boolean;
}

// --- Subject-To Strategy ---
// --- Subject-To Strategy ---
export interface SubjectToInputs {
  // Loan & Seller Inputs
  existingLoanBalance: number;
  existingLoanRate: number;
  monthlyPITI: number;
  reinstatementNeeded: number;
  sellerCashNeeded: number;
  sellerSecondNoteAmount: number;
  sellerSecondNoteRate: number;
  sellerSecondNoteTerm: number;
  closingCosts: number;
  liensJudgments: number;
  hoaFees: number;
  pastDueTaxes: number;
  escrowShortage: number;

  // Income
  marketRent: number;
  otherMonthlyIncome: number;
  vacancyRate: number;

  // Expenses
  monthlyTaxes: number;
  monthlyInsurance: number;
  maintenanceRate: number;
  managementRate: number;
  capexRate: number;
  monthlyUtilities: number;

  // Rehab & Value
  asIsValue: number;
  arv: number;
  rehabCost: number;

  // Investor Capital
  privateMoneyAmount: number;
  privateMoneyRate: number;
  wholesaleFee: number;

  // Exit Strategy
  exitPlanType: 'Rental' | 'Wrap' | 'Flip' | 'Wholesale';
  salePrice: number; // if flipping
  resaleCostsPercent: number;
  agentFeesPercent: number;

  // Legal & Risk
  dueOnSaleRisk: 'Low' | 'Medium' | 'High';
  trustSetupFees: number;
}

export interface SubjectToCalculations {
  // Upfront
  totalEntryFee: number; // Cash needed to close
  totalInvestment: number; // Entry fee + Rehab

  // Monthly
  grossIncome: number;
  vacancyLoss: number;
  effectiveIncome: number;
  totalExpenses: number;
  netOperatingIncome: number;

  // Debt Service
  existingLoanPayment: number; // PITI
  sellerSecondPayment: number;
  privateMoneyPayment: number;
  totalDebtService: number;

  // Cash Flow
  monthlyCashFlow: number;
  cashOnCashReturn: number;

  // Flip/Exit Metrics (if applicable)
  projectedProfit: number;
  roi: number;
}

// --- Seller Financing Strategy ---
export interface SellerFinancingExpenses {
  vacancyRate: number;
  maintenanceRate: number;
  managementRate: number;
  capexRate: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  monthlyWaterSewer: number;
  monthlyStreetLights: number;
  monthlyGas: number;
  monthlyElectric: number;
  monthlyLandscaping: number;
  monthlyMiscFees: number;
}

export interface SellerFinancingInputs {
  purchasePrice: number;
  downPayment: number;
  sellerLoanRate: number;
  loanTerm: number; // in years
  balloonYears: number; // 0 if none
  paymentType: 'Amortization' | 'Interest Only';
  marketRent: number;
  otherMonthlyIncome: number;
  rehabCost: number;
  expenses: SellerFinancingExpenses;
}

export interface SellerFinancingCalculations {
  monthlyPayment: number;
  grossIncome: number;
  vacancyLoss: number;
  effectiveIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  cashFlow: number;
  cashOnCashReturn: number;
}

export interface BrrrrPurchaseCosts {
  points: number;
  prepaidHazardInsurance: number;
  prepaidFloodInsurance: number;
  prepaidPropertyTax: number;
  annualAssessments: number;
  titleEscrowFees: number;
  attorneyFees: number;
  inspectionCost: number;
  recordingFees: number;
  appraisalFees: number;
  brokerFees: number;
  otherFees: number;
}

export interface BrrrrRehabCosts {
  exterior: {
    roof: number;
    gutters: number;
    garage: number;
    siding: number;
    landscaping: number;
    painting: number;
    septic: number;
    decks: number;
    foundation: number;
    electrical: number;
    other: number;
  };
  interior: {
    demo: number;
    sheetrock: number;
    plumbing: number;
    carpentry: number;
    windows: number;
    doors: number;
    electrical: number;
    painting: number;
    hvac: number;
    cabinets: number;
    framing: number;
    flooring: number;
    basement: number;
    other: number;
  };
  general: {
    permits: number;
    termites: number;
    mold: number;
    misc: number;
  };
}

export interface BrrrrFinancing {
  isCash: boolean;
  points: number;
  otherCharges: number;
  wrapFeesIntoLoan: boolean;
  interestOnly: boolean;
  includePmi: boolean;
  pmiAmount: number;
  refinanceTimelineMonths: number;
  rehabTimelineMonths: number;
  loanAmount: number;
  interestRate: number;
}

export interface BrrrrRefinance {
  loanLtv: number;
  interestRate: number;
  closingCosts: number;
}

export interface BrrrrOperatingExpenses {
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  monthlyWaterSewer: number;
  monthlyStreetLights: number;
  monthlyGas: number;
  monthlyElectric: number;
  monthlyLandscaping: number;
  monthlyMiscFees: number;

  vacancyRate: number; // %
  maintenanceRate: number; // %
  capexRate: number; // %
  managementRate: number; // %

  otherMonthlyIncome: number;
}

export interface BrrrrInputs {
  purchasePrice: number;
  arv: number;
  purchaseCosts: BrrrrPurchaseCosts;
  rehabCosts: BrrrrRehabCosts;
  financing: BrrrrFinancing;
  refinance: BrrrrRefinance;
  expenses: BrrrrOperatingExpenses;
  monthlyRent: number;
  holdingCostsMonthly: number; // Keep for backward compat or general holding
}

export interface Comparable {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  distanceMiles?: number;
  notes?: string;
  included: boolean;
}

export interface BrrrrCalculations {
  totalProjectCost: number; // Purchase + Rehab + Initial Closing + Holding
  totalRehabCost: number;
  totalPurchaseClosingCosts: number;
  totalHoldingCosts: number;
  totalFinancingCosts: number;

  refinanceLoanAmount: number;
  refiClosingCosts: number;
  netRefiProceeds: number; // Refi Loan - Refi Closing Costs
  cashOutAmount: number; // Refi Loan - Initial Loan (payoff) - Refi Closing Costs. Wait, usually it's Refi Loan - (Initial Loan + Holding + Rehab if self-funded).
  // Let's simplify: Cash Out = Refi Loan - Payoff of Initial Loan.
  // Cash Left In Deal = Total Project Cost - Refi Loan Amount.
  cashLeftInDeal: number;
  roi: number; // Annual Cash Flow / Cash Left In Deal
  monthlyCashFlowPostRefi: number;
  monthlyRevenue: number;
  monthlyExpenses: number;

  breakdown: {
    revenue: {
      grossRent: number;
      otherIncome: number;
      vacancyLoss: number;
      effectiveIncome: number;
    };
    expenses: {
      propertyTaxes: number;
      insurance: number;
      hoa: number;
      utilities: number;
      repairsMaintenance: number;
      capex: number;
      management: number;
      debtService: number;
      misc: number;
      totalOperatingExpenses: number;
      totalExpenses: number;
    };
  };

  isInfiniteReturn: boolean;
}


export interface AttomComparable {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  distanceMiles: number;
  yearBuilt?: number;
  lotSize?: number;
  propertyType?: string;
  latitude?: number;
  longitude?: number;
}

export interface AttomFilters {
  distance: number;
  recency: string;
  sqft: string;
  bedrooms: string;
  bathrooms: string;
  condition: string;
  yearBuilt: string;
  lotSize: string;
  propertyType: string;
  garage: string;
  buildType: string;
}

export type PropertyAction =
  | { type: 'ADD_PROPERTY'; payload: Property }
  | { type: 'ADD_MULTIPLE_PROPERTIES'; payload: Property[] }
  | { type: 'UPDATE_PROPERTY'; payload: Property }
  | { type: 'DELETE_PROPERTY'; payload: string }; // id

export type SubscriptionTier = 'Free' | 'Starter' | 'Experienced' | 'Pro' | 'Team' | 'PayAsYouGo' | string;

export interface User {
  id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  subscriptionTier?: SubscriptionTier | null;
  analysisCount: number;
  analysisLimitResetAt?: string | null;
  credits: number; // Amount in USD for PayAsYouGo
  role?: 'user' | 'admin';
  lastLoginAt?: string;
  loginCount?: number;
  csvExportCount?: number;
  reportDownloadCount?: number;
  createdAt?: string;
  propertyCount?: number; // Computed field for lists
  status?: 'Active' | 'Cancelled'; // Computed field for lists
  tierLimit?: number; // Dynamic limit from plan
}

export interface AdminStats {
  today: {
    newSubscribers: number;
    revenue: number;
    upgrades: number;
    downgrades: number;
    cancellations: number;
  };
  subscribersByTier: {
    Free: number;
    Starter: number;
    Pro: number;
    Team: number;
  };
  subscriberGraph: {
    date: string;
    count: number;
  }[];
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  billingType: 'Monthly' | 'Annually' | 'Credits';
  cardType: string;
  last4: string;
  status: 'Paid' | 'Refunded' | 'Failed';
}

export interface BillingSummary {
  status: 'Active' | 'Cancelled' | 'Past Due';
  plan: string;
  billingType: 'Monthly' | 'Annually';
  startDate: string;
  nextBillingDate?: string;
  cancellationDate?: string;
  cancellationReason?: string;
}

export interface UserDetailStats {
  strategyUsage: { name: string; count: number }[];
  activity: {
    logins: number;
    lastLogin: string;
    exports: number;
    downloads: number;
  };
  billingSummary?: BillingSummary;
  billingHistory?: BillingHistoryItem[];
  properties: Property[];
}

export interface Plan {
  key: string; // e.g., 'Free', 'Starter'
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  analysisLimit: number; // -1 for unlimited
  features: string[];
  isPopular: boolean;
  canCompare: boolean;
  canExportCsv: boolean;
  canUseAdvancedStrategies: boolean; // Deprecated, kept for backward compatibility
  canWholesale: boolean;
  canSubjectTo: boolean;
  canSellerFinance: boolean;
  canBrrrr: boolean;
  canAccessComparables: boolean;
  canAccessProjections: boolean;
}// Force update
