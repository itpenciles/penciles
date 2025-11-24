
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

  details: {
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    yearBuilt: number;
    numberOfUnits: number;
    unitDetails: Unit[];
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
}

export interface Financials {
  listPrice: number;
  estimatedValue: number;
  purchasePrice: number;
  rehabCost: number;
  downPaymentPercent: number;
  monthlyRents: number[];
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
export interface SubjectToInputs {
  existingLoanBalance: number;
  existingLoanRate: number;
  monthlyPITI: number;
  reinstatementNeeded: number;
  sellerCashNeeded: number;
  closingCosts: number;
  marketRent: number;
}

export interface SubjectToCalculations {
  monthlySpread: number;
  cashNeeded: number;
  cashOnCashReturn: number;
}

// --- Seller Financing Strategy ---
export interface SellerFinancingInputs {
  purchasePrice: number;
  downPayment: number;
  sellerLoanRate: number;
  loanTerm: number; // in years
  balloonYears: number; // 0 if none
  paymentType: 'Amortization' | 'Interest Only';
  marketRent: number;
}

export interface SellerFinancingCalculations {
  monthlyPayment: number;
  spreadVsMarketRent: number;
  returnOnDp: number;
}

export interface BrrrrInputs {
  purchasePrice: number;
  rehabCost: number;
  rehabDurationMonths: number;
  arv: number;
  initialLoanAmount: number;
  initialLoanRate: number;
  initialLoanClosingCosts: number;
  refinanceLoanLtv: number;
  refinanceLoanRate: number;
  refinanceClosingCosts: number;
  holdingCostsMonthly: number; // Utilities, taxes, insurance during rehab
  monthlyRentPostRefi: number;
  monthlyExpensesPostRefi: number; // Taxes, insurance, maintenance, etc.
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
  refinanceLoanAmount: number;
  cashOutAmount: number; // Refi Loan - Initial Loan (payoff) - Refi Closing Costs. Wait, usually it's Refi Loan - (Initial Loan + Holding + Rehab if self-funded).
  // Let's simplify: Cash Out = Refi Loan - Payoff of Initial Loan.
  // Cash Left In Deal = Total Project Cost - Refi Loan Amount.
  cashLeftInDeal: number;
  roi: number; // Annual Cash Flow / Cash Left In Deal
  monthlyCashFlowPostRefi: number;
  isInfiniteReturn: boolean;
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
}