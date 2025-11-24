import { Financials, CalculatedMetrics, WholesaleInputs, WholesaleCalculations, SubjectToInputs, SubjectToCalculations, SellerFinancingInputs, SellerFinancingCalculations, BrrrrInputs, BrrrrCalculations } from '../../types';

// --- CALCULATIONS ---
export const calculateMetrics = (financials: Financials): CalculatedMetrics => {
  const {
    purchasePrice, rehabCost, downPaymentPercent, monthlyRents, vacancyRate,
    maintenanceRate, managementRate, capexRate, monthlyTaxes, monthlyInsurance,
    monthlyWaterSewer, monthlyStreetLights, monthlyGas, monthlyElectric, monthlyLandscaping,
    monthlyHoaFee, operatingMiscFee,
    loanInterestRate, loanTermYears, originationFeePercent, closingFee,
    processingFee, appraisalFee, titleFee,
    brokerAgentFee, homeWarrantyFee, attorneyFee, closingMiscFee,
    sellerCreditTax, sellerCreditSewer, sellerCreditOrigination, sellerCreditClosing,
    sellerCreditRents, sellerCreditSecurityDeposit, sellerCreditMisc
  } = financials;

  const downPaymentAmount = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPaymentAmount;

  const originationFeeAmount = loanAmount * (originationFeePercent / 100);
  const otherClosingFees = (closingFee || 0) + (processingFee || 0) + (appraisalFee || 0) + (titleFee || 0) + (brokerAgentFee || 0) + (homeWarrantyFee || 0) + (attorneyFee || 0) + (closingMiscFee || 0);
  const totalClosingCosts = otherClosingFees + originationFeeAmount;

  const totalSellerCredits = (sellerCreditTax || 0) + (sellerCreditSewer || 0) + (sellerCreditOrigination || 0) + (sellerCreditClosing || 0) + (sellerCreditRents || 0) + (sellerCreditSecurityDeposit || 0) + (sellerCreditMisc || 0);
  const totalCashToClose = downPaymentAmount + rehabCost + totalClosingCosts - totalSellerCredits;
  const totalInvestment = purchasePrice + rehabCost; // For "All-in Cap Rate"

  // Simple mortgage calculation
  const monthlyInterestRate = (loanInterestRate / 100) / 12;
  const numberOfPayments = loanTermYears * 12;
  const monthlyDebtService = loanAmount > 0 && loanInterestRate > 0 ? (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1) : 0;

  const annualDebtService = monthlyDebtService * 12;

  const totalMonthlyRent = monthlyRents.reduce((acc, rent) => acc + rent, 0);
  const grossAnnualRent = totalMonthlyRent * 12;
  const vacancyLoss = grossAnnualRent * (vacancyRate / 100);
  const effectiveGrossIncome = grossAnnualRent - vacancyLoss;

  const maintenanceCost = grossAnnualRent * (maintenanceRate / 100);
  const managementCost = grossAnnualRent * (managementRate / 100);
  const capexCost = grossAnnualRent * (capexRate / 100);
  const annualUtilities = ((monthlyWaterSewer || 0) + (monthlyStreetLights || 0) + (monthlyGas || 0) + (monthlyElectric || 0) + (monthlyLandscaping || 0)) * 12;
  const totalOperatingExpensesAnnual = maintenanceCost + managementCost + capexCost + (monthlyTaxes * 12) + (monthlyInsurance * 12) + annualUtilities + ((monthlyHoaFee || 0) * 12) + ((operatingMiscFee || 0) * 12);

  const netOperatingIncomeAnnual = effectiveGrossIncome - totalOperatingExpensesAnnual;

  const monthlyCashFlowNoDebt = netOperatingIncomeAnnual / 12;
  const monthlyCashFlowWithDebt = monthlyCashFlowNoDebt - monthlyDebtService;

  const capRate = purchasePrice > 0 ? (netOperatingIncomeAnnual / purchasePrice) * 100 : 0;
  const allInCapRate = totalInvestment > 0 ? (netOperatingIncomeAnnual / totalInvestment) * 100 : 0;
  const cashOnCashReturn = totalCashToClose > 0 ? ((monthlyCashFlowWithDebt * 12) / totalCashToClose) * 100 : 0;
  const dscr = annualDebtService > 0 ? netOperatingIncomeAnnual / annualDebtService : 0;

  return {
    downPaymentAmount, totalCashToClose, totalInvestment, loanAmount, monthlyDebtService,
    grossAnnualRent, vacancyLoss, effectiveGrossIncome,
    maintenanceCost: maintenanceCost / 12, managementCost: managementCost / 12, capexCost: capexCost / 12,
    totalOperatingExpenses: totalOperatingExpensesAnnual / 12, netOperatingIncome: netOperatingIncomeAnnual / 12,
    capRate, allInCapRate,
    cashOnCashReturn, monthlyCashFlowNoDebt, monthlyCashFlowWithDebt, totalClosingCosts, dscr
  };
};

export const calculateWholesaleMetrics = (inputs: WholesaleInputs): WholesaleCalculations => {
  const { arv, maoPercentOfArv, estimatedRehab, closingCost, wholesaleFeeGoal, sellerAsk } = inputs;
  const mao = (arv * (maoPercentOfArv / 100)) - estimatedRehab - closingCost - wholesaleFeeGoal;
  const potentialFees = mao - sellerAsk;
  const isEligible = potentialFees > 0;
  return { mao, potentialFees, isEligible };
};

export const calculateSubjectToMetrics = (inputs: SubjectToInputs): SubjectToCalculations => {
  const { marketRent, monthlyPITI, reinstatementNeeded, sellerCashNeeded, closingCosts } = inputs;
  const monthlySpread = marketRent - monthlyPITI;
  const cashNeeded = reinstatementNeeded + sellerCashNeeded + closingCosts;
  const cashOnCashReturn = cashNeeded > 0 ? ((monthlySpread * 12) / cashNeeded) * 100 : 0;
  return { monthlySpread, cashNeeded, cashOnCashReturn };
};

export const calculateSellerFinancingMetrics = (inputs: SellerFinancingInputs): SellerFinancingCalculations => {
  const { purchasePrice, downPayment, sellerLoanRate, loanTerm, paymentType, marketRent } = inputs;
  const loanAmount = purchasePrice - downPayment;
  let monthlyPayment = 0;
  if (loanAmount > 0 && sellerLoanRate > 0 && loanTerm > 0) {
    if (paymentType === 'Amortization') {
      const monthlyInterestRate = (sellerLoanRate / 100) / 12;
      const numberOfPayments = loanTerm * 12;
      if (monthlyInterestRate > 0) {
        monthlyPayment = (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
      } else {
        monthlyPayment = loanAmount / numberOfPayments;
      }
    } else if (paymentType === 'Interest Only') {
      monthlyPayment = (loanAmount * (sellerLoanRate / 100)) / 12;
    }
  }
  const spreadVsMarketRent = marketRent - monthlyPayment;
  const returnOnDp = downPayment > 0 ? ((spreadVsMarketRent * 12) / downPayment) * 100 : 0;
  return { monthlyPayment, spreadVsMarketRent, returnOnDp };
};

export const calculateBrrrrMetrics = (inputs: BrrrrInputs): BrrrrCalculations => {
  const {
    purchasePrice, rehabCost, rehabDurationMonths, arv,
    initialLoanAmount, initialLoanRate, initialLoanClosingCosts,
    refinanceLoanLtv, refinanceLoanRate, refinanceClosingCosts,
    holdingCostsMonthly, monthlyRentPostRefi, monthlyExpensesPostRefi
  } = inputs;

  // 1. Total Project Cost
  const totalHoldingCosts = holdingCostsMonthly * rehabDurationMonths;
  // Interest on initial loan during rehab (simple interest approximation)
  const initialLoanInterestMonthly = (initialLoanAmount * (initialLoanRate / 100)) / 12;
  const totalInitialLoanInterest = initialLoanInterestMonthly * rehabDurationMonths;

  const totalProjectCost = purchasePrice + rehabCost + initialLoanClosingCosts + totalHoldingCosts + totalInitialLoanInterest;

  // 2. Refinance
  const refinanceLoanAmount = arv * (refinanceLoanLtv / 100);

  // 3. Cash Out / Cash Left
  // Cash Left = Total Project Cost - (Refinance Loan Amount - Refinance Closing Costs)
  const cashLeftInDeal = totalProjectCost - (refinanceLoanAmount - refinanceClosingCosts);

  // 4. Post-Refi Cash Flow
  const r = refinanceLoanRate / 100 / 12;
  const n = 30 * 12; // Assume 30 year fixed for refi
  const refiMonthlyPayment = refinanceLoanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const monthlyCashFlowPostRefi = monthlyRentPostRefi - monthlyExpensesPostRefi - refiMonthlyPayment;

  // 5. ROI
  const annualCashFlow = monthlyCashFlowPostRefi * 12;
  let roi = 0;
  let isInfiniteReturn = false;

  if (cashLeftInDeal <= 0) {
    roi = Infinity;
    isInfiniteReturn = true;
  } else {
    roi = (annualCashFlow / cashLeftInDeal) * 100;
  }

  return {
    totalProjectCost,
    refinanceLoanAmount,
    cashOutAmount: -cashLeftInDeal,
    cashLeftInDeal,
    roi,
    monthlyCashFlowPostRefi,
    isInfiniteReturn
  };
};