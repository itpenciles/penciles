import React, { createContext, useReducer, Dispatch, ReactNode } from 'react';
import { Property, PropertyAction, Financials, CalculatedMetrics, WholesaleInputs, WholesaleCalculations, SubjectToInputs, SubjectToCalculations, SellerFinancingInputs, SellerFinancingCalculations } from '../types';
import { initialProperties } from '../data/initialProperties';

// --- CALCULATIONS ---
export const calculateMetrics = (financials: Financials): CalculatedMetrics => {
  const { 
    purchasePrice, rehabCost, downPaymentPercent, monthlyRents, vacancyRate, 
    maintenanceRate, managementRate, capexRate, monthlyTaxes, monthlyInsurance,
    monthlyWaterSewer, monthlyStreetLights, monthlyGas, monthlyElectric, monthlyLandscaping,
    loanInterestRate, loanTermYears, originationFeePercent, closingFee, 
    processingFee, appraisalFee, titleFee,
    sellerCreditTax, sellerCreditSewer, sellerCreditOrigination, sellerCreditClosing
  } = financials;

  const downPaymentAmount = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPaymentAmount;

  const originationFeeAmount = loanAmount * (originationFeePercent / 100);
  const otherClosingFees = closingFee + processingFee + appraisalFee + titleFee;
  const totalClosingCosts = otherClosingFees + originationFeeAmount;
  
  const totalSellerCredits = (sellerCreditTax || 0) + (sellerCreditSewer || 0) + (sellerCreditOrigination || 0) + (sellerCreditClosing || 0);
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
  const annualUtilities = (monthlyWaterSewer + monthlyStreetLights + monthlyGas + monthlyElectric + monthlyLandscaping) * 12;
  const totalOperatingExpensesAnnual = maintenanceCost + managementCost + capexCost + (monthlyTaxes * 12) + (monthlyInsurance * 12) + annualUtilities;
  
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


const propertyReducer = (state: Property[], action: PropertyAction): Property[] => {
  switch (action.type) {
    case 'ADD_PROPERTY':
      return [action.payload, ...state];
    case 'ADD_MULTIPLE_PROPERTIES':
      return [...action.payload, ...state];
    case 'UPDATE_PROPERTY':
      return state.map(p => p.id === action.payload.id ? action.payload : p);
    case 'DELETE_PROPERTY':
      return state.filter(p => p.id !== action.payload);
    default:
      return state;
  }
};

const LOCAL_STORAGE_KEY = 'itPencilsData';

const initializeState = (): Property[] => {
  try {
    const storedProperties = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedProperties) {
      const parsedProperties = JSON.parse(storedProperties);
      if (Array.isArray(parsedProperties)) {
        return parsedProperties;
      }
    }
  } catch (error) {
    console.error("Failed to parse properties from localStorage", error);
  }
  return initialProperties;
};

export const PropertyContext = createContext<{
  properties: Property[];
  dispatch: Dispatch<PropertyAction>;
  saveProperties: () => void;
}>({
  properties: [],
  dispatch: () => null,
  saveProperties: () => {},
});

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, dispatch] = useReducer(propertyReducer, undefined, initializeState);

  const saveProperties = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(properties));
    } catch (error) {
      console.error("Failed to save properties to localStorage", error);
    }
  };

  return (
    <PropertyContext.Provider value={{ properties, dispatch, saveProperties }}>
      {children}
    </PropertyContext.Provider>
  );
};