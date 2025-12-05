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

  return { monthlyPayment, grossIncome, operatingExpenses, netOperatingIncome, cashFlow, cashOnCashReturn };
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

  const maintenanceCost = monthlyRent * ((maintenanceRate || 0) / 100);
  const capexCost = monthlyRent * ((capexRate || 0) / 100);
  const managementCost = monthlyRent * ((managementRate || 0) / 100);

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