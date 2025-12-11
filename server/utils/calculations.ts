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
  const grossMonthlyIncome = totalMonthlyRent + (financials.otherMonthlyIncome || 0);
  const grossAnnualIncome = grossMonthlyIncome * 12;

  const vacancyLoss = grossAnnualIncome * (vacancyRate / 100);
  const effectiveGrossIncome = grossAnnualIncome - vacancyLoss;

  const maintenanceCost = grossAnnualIncome * (maintenanceRate / 100);
  const managementCost = grossAnnualIncome * (managementRate / 100);
  const capexCost = grossAnnualIncome * (capexRate / 100);
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
  const {
    existingLoanBalance, monthlyPITI,
    reinstatementNeeded, sellerCashNeeded, sellerSecondNoteAmount, sellerSecondNoteRate, sellerSecondNoteTerm,
    closingCosts, liensJudgments, hoaFees, pastDueTaxes, escrowShortage,
    marketRent, otherMonthlyIncome, vacancyRate,
    monthlyTaxes, monthlyInsurance, maintenanceRate, managementRate, capexRate, monthlyUtilities,
    rehabCost,
    privateMoneyAmount, privateMoneyRate, wholesaleFee,
    exitPlanType, salePrice, resaleCostsPercent, agentFeesPercent,
    trustSetupFees
  } = inputs;

  // 1. Upfront Costs (Entry Fee)
  const totalEntryFee = reinstatementNeeded + sellerCashNeeded + closingCosts + liensJudgments + hoaFees + pastDueTaxes + escrowShortage + wholesaleFee + trustSetupFees;
  const totalInvestment = totalEntryFee + rehabCost;

  // 2. Monthly Income
  const grossIncome = marketRent + (otherMonthlyIncome || 0);
  const vacancyLoss = grossIncome * ((vacancyRate || 0) / 100);
  const effectiveIncome = grossIncome - vacancyLoss;

  // 3. Monthly Expenses
  const maintenanceCost = grossIncome * ((maintenanceRate || 0) / 100);
  const managementCost = grossIncome * ((managementRate || 0) / 100);
  const capexCost = grossIncome * ((capexRate || 0) / 100);
  const totalExpenses = (monthlyTaxes || 0) + (monthlyInsurance || 0) + (monthlyUtilities || 0) + maintenanceCost + managementCost + capexCost;

  const netOperatingIncome = effectiveIncome - totalExpenses;

  // 4. Debt Service
  const existingLoanPayment = monthlyPITI;

  // Seller Second Note (Amortized or Interest Only? Assuming Amortized for now, or simple interest if term is short? Let's assume Amortized)
  let sellerSecondPayment = 0;
  if (sellerSecondNoteAmount > 0 && sellerSecondNoteRate > 0 && sellerSecondNoteTerm > 0) {
    const r = (sellerSecondNoteRate / 100) / 12;
    const n = sellerSecondNoteTerm * 12;
    sellerSecondPayment = (sellerSecondNoteAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  // Private Money (Interest Only usually)
  let privateMoneyPayment = 0;
  if (privateMoneyAmount > 0 && privateMoneyRate > 0) {
    privateMoneyPayment = (privateMoneyAmount * (privateMoneyRate / 100)) / 12;
  }

  const totalDebtService = existingLoanPayment + sellerSecondPayment + privateMoneyPayment;

  // 5. Cash Flow
  const monthlyCashFlow = netOperatingIncome - totalDebtService;
  const cashOnCashReturn = totalInvestment > 0 ? ((monthlyCashFlow * 12) / totalInvestment) * 100 : 0;

  // 6. Exit Strategy Metrics
  let projectedProfit = 0;
  let roi = 0;

  if (exitPlanType === 'Flip') {
    const saleProceeds = salePrice * (1 - ((resaleCostsPercent + agentFeesPercent) / 100));
    const totalPayoff = existingLoanBalance + sellerSecondNoteAmount + privateMoneyAmount;
    projectedProfit = saleProceeds - totalPayoff - totalInvestment; // Simplified flip profit
    roi = totalInvestment > 0 ? (projectedProfit / totalInvestment) * 100 : 0;
  } else {
    // For Rental/Wrap, ROI is typically CoC or IRR. We'll use CoC for now.
    projectedProfit = monthlyCashFlow * 12; // Annual Cash Flow
    roi = cashOnCashReturn;
  }

  return {
    totalEntryFee, totalInvestment,
    grossIncome, vacancyLoss, effectiveIncome, totalExpenses, netOperatingIncome,
    existingLoanPayment, sellerSecondPayment, privateMoneyPayment, totalDebtService,
    monthlyCashFlow, cashOnCashReturn,
    projectedProfit, roi
  };
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
  // Income
  const grossIncome = marketRent + (inputs.otherMonthlyIncome || 0);
  const vacancyLoss = grossIncome * ((inputs.expenses?.vacancyRate || 0) / 100);
  const effectiveIncome = grossIncome - vacancyLoss;

  // Expenses
  const maintenanceCost = grossIncome * ((inputs.expenses?.maintenanceRate || 0) / 100);
  const managementCost = grossIncome * ((inputs.expenses?.managementRate || 0) / 100);
  const capexCost = grossIncome * ((inputs.expenses?.capexRate || 0) / 100);

  const fixedExpenses = (inputs.expenses?.monthlyTaxes || 0) + (inputs.expenses?.monthlyInsurance || 0) + (inputs.expenses?.monthlyHoa || 0) +
    (inputs.expenses?.monthlyWaterSewer || 0) + (inputs.expenses?.monthlyStreetLights || 0) + (inputs.expenses?.monthlyGas || 0) +
    (inputs.expenses?.monthlyElectric || 0) + (inputs.expenses?.monthlyLandscaping || 0) + (inputs.expenses?.monthlyMiscFees || 0);

  const operatingExpenses = fixedExpenses + maintenanceCost + managementCost + capexCost;

  // NOI & Cash Flow
  const netOperatingIncome = effectiveIncome - operatingExpenses;
  const cashFlow = netOperatingIncome - monthlyPayment;

  // Returns
  const totalCashInvested = downPayment + (inputs.rehabCost || 0);
  const cashOnCashReturn = totalCashInvested > 0 ? ((cashFlow * 12) / totalCashInvested) * 100 : 0;

  return { monthlyPayment, grossIncome, vacancyLoss, effectiveIncome, operatingExpenses, netOperatingIncome, cashFlow, cashOnCashReturn };
};

export const calculateBrrrrMetrics = (inputs: BrrrrInputs): BrrrrCalculations => {
  const {
    purchasePrice, arv,
    purchaseCosts, rehabCosts, financing, refinance, expenses,
    monthlyRent, holdingCostsMonthly
  } = inputs;

  // Helper to sum object values
  const sumValues = (obj: any) => Object.values(obj || {}).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0) as number;

  // 1. Calculate Total Costs
  const totalPurchaseClosingCosts = sumValues(purchaseCosts);

  const totalExteriorRehab = sumValues(rehabCosts?.exterior);
  const totalInteriorRehab = sumValues(rehabCosts?.interior);
  const totalGeneralRehab = sumValues(rehabCosts?.general);
  const totalRehabCost = totalExteriorRehab + totalInteriorRehab + totalGeneralRehab;

  const rehabDurationMonths = financing?.rehabTimelineMonths || 0;
  const totalHoldingCosts = (holdingCostsMonthly || 0) * rehabDurationMonths;

  // Financing Costs (Phase 1)
  let initialLoanAmount = 0;
  let totalInitialLoanInterest = 0;
  let initialLoanPointsAmount = 0;
  let otherLenderCharges = financing?.otherCharges || 0;

  if (!financing?.isCash) {
    initialLoanAmount = financing?.loanAmount || 0;
    const rate = financing?.interestRate || 0;

    // Interest during rehab
    if (financing?.interestOnly) {
      const monthlyInterest = (initialLoanAmount * (rate / 100)) / 12;
      totalInitialLoanInterest = monthlyInterest * rehabDurationMonths;
    } else {
      // Simple approximation for amortized loan interest during rehab if not interest only
      const monthlyInterest = (initialLoanAmount * (rate / 100)) / 12;
      totalInitialLoanInterest = monthlyInterest * rehabDurationMonths;
    }

    initialLoanPointsAmount = initialLoanAmount * ((financing?.points || 0) / 100);
  }

  const totalFinancingCosts = initialLoanPointsAmount + otherLenderCharges + totalInitialLoanInterest;

  const totalProjectCost = purchasePrice + totalRehabCost + totalPurchaseClosingCosts + totalHoldingCosts + totalFinancingCosts;

  // 2. Refinance
  const refinanceLoanAmount = arv * ((refinance?.loanLtv || 75) / 100);
  const refiClosingCosts = refinance?.closingCosts || 0;

  // 3. Cash Out / Cash Left
  // Cash Left = Total Project Cost - (Refi Loan - Refi Costs)
  const cashLeftInDeal = totalProjectCost - (refinanceLoanAmount - refiClosingCosts);

  // 4. Post-Refi Cash Flow
  const r = (refinance?.interestRate || 0) / 100 / 12;
  const n = 30 * 12; // Assume 30 year fixed
  let refiMonthlyPayment = 0;
  if (r > 0) {
    refiMonthlyPayment = refinanceLoanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  // Operating Expenses
  const {
    monthlyTaxes, monthlyInsurance, monthlyHoa,
    monthlyWaterSewer, monthlyStreetLights, monthlyGas, monthlyElectric, monthlyLandscaping, monthlyMiscFees,
    vacancyRate, maintenanceRate, capexRate, managementRate,
    otherMonthlyIncome
  } = expenses || {};

  const grossMonthlyIncome = monthlyRent + (otherMonthlyIncome || 0);

  const vacancyLoss = monthlyRent * ((vacancyRate || 0) / 100);
  const effectiveIncome = grossMonthlyIncome - vacancyLoss;

  const maintenanceCost = grossMonthlyIncome * ((maintenanceRate || 0) / 100);
  const capexCost = grossMonthlyIncome * ((capexRate || 0) / 100);
  const managementCost = grossMonthlyIncome * ((managementRate || 0) / 100);

  const totalFixedExpenses = (monthlyTaxes || 0) + (monthlyInsurance || 0) + (monthlyHoa || 0) +
    (monthlyWaterSewer || 0) + (monthlyStreetLights || 0) + (monthlyGas || 0) +
    (monthlyElectric || 0) + (monthlyLandscaping || 0) + (monthlyMiscFees || 0);

  const totalMonthlyExpenses = totalFixedExpenses + maintenanceCost + capexCost + managementCost;

  const monthlyCashFlowPostRefi = effectiveIncome - totalMonthlyExpenses - refiMonthlyPayment;

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
    totalRehabCost,
    totalPurchaseClosingCosts,
    totalHoldingCosts,
    totalFinancingCosts,
    refinanceLoanAmount,
    refiClosingCosts,
    netRefiProceeds: refinanceLoanAmount - refiClosingCosts,
    cashOutAmount: -cashLeftInDeal,
    cashLeftInDeal,
    roi,
    monthlyCashFlowPostRefi,
    monthlyRevenue: effectiveIncome,
    monthlyExpenses: totalMonthlyExpenses + refiMonthlyPayment,
    breakdown: {
      revenue: {
        grossRent: monthlyRent,
        otherIncome: otherMonthlyIncome || 0,
        vacancyLoss: vacancyLoss,
        effectiveIncome: effectiveIncome
      },
      expenses: {
        propertyTaxes: monthlyTaxes || 0,
        insurance: monthlyInsurance || 0,
        hoa: monthlyHoa || 0,
        utilities: (monthlyWaterSewer || 0) + (monthlyStreetLights || 0) + (monthlyGas || 0) + (monthlyElectric || 0) + (monthlyLandscaping || 0),
        repairsMaintenance: maintenanceCost,
        capex: capexCost,
        management: managementCost,
        debtService: refiMonthlyPayment,
        misc: monthlyMiscFees || 0,
        totalOperatingExpenses: totalMonthlyExpenses,
        totalExpenses: totalMonthlyExpenses + refiMonthlyPayment
      }
    },
    isInfiniteReturn
  } as any;
};

// --- HELPER METRICS ---

/**
 * Calculates a simplified 5-Year Internal Rate of Return (IRR).
 * Assumptions:
 * - 5 Year Hold Period
 * - 3% Annual Appreciation
 * - 3% Annual Rent/Expense Increase
 * - Sale at end of Year 5
 */
export const calculateIRR = (
  initialInvestment: number,
  year1CashFlow: number,
  initialPropertyValue: number,
  sellingCostsPercent: number = 6,
  annualGrowthRate: number = 0.03
): { irr: number; totalProfit: number; equityMultiple: number } => {

  if (initialInvestment <= 0) return { irr: Infinity, totalProfit: 0, equityMultiple: Infinity };

  const cashFlows: number[] = [-initialInvestment]; // Year 0
  let totalCashFlow = 0;

  // Simulate Years 1-5
  let currentCashFlow = year1CashFlow;
  for (let i = 1; i <= 5; i++) {
    cashFlows.push(currentCashFlow);
    totalCashFlow += currentCashFlow;
    currentCashFlow *= (1 + annualGrowthRate); // Grow NOI/CashFlow
  }

  // Sale Event at Year 5
  const projectedSalePrice = initialPropertyValue * Math.pow(1 + annualGrowthRate, 5);
  // Net Sale Proceeds = Initial Investment + Appreciation - Selling Costs
  // We approximate the equity return as:
  // (Sale Price - Init Value) + Init Investment - Selling Costs
  // This assumes interest-only or that principal paydown is negligible/bonus for this simple metric.
  const netSaleProceeds = initialInvestment + (projectedSalePrice - initialPropertyValue) - (projectedSalePrice * (sellingCostsPercent / 100));

  // Add reversion to Year 5
  cashFlows[5] += netSaleProceeds;
  totalCashFlow += netSaleProceeds - initialInvestment; // Profit only

  // IRR Calculation (Newton-Raphson approximation)
  let guess = 0.1; // 10%
  for (let i = 0; i < 20; i++) {
    const npv = cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + guess, t), 0);
    const derivative = cashFlows.reduce((acc, cf, t) => acc - (t * cf) / Math.pow(1 + guess, t + 1), 0);
    if (Math.abs(derivative) < 1e-6) break;
    const nextGuess = guess - npv / derivative;
    if (Math.abs(nextGuess - guess) < 1e-6) {
      guess = nextGuess;
      break;
    }
    guess = nextGuess;
  }

  return {
    irr: guess * 100,
    totalProfit: totalCashFlow,
    equityMultiple: (totalCashFlow + initialInvestment) / initialInvestment
  };
};