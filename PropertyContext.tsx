import React, { createContext, useState, Dispatch, ReactNode, SetStateAction, useEffect, useCallback } from 'react';
import { Property, Financials, CalculatedMetrics, WholesaleInputs, WholesaleCalculations, SubjectToInputs, SubjectToCalculations, SellerFinancingInputs, SellerFinancingCalculations } from '../types';
import apiClient from '../services/apiClient';
import { localPropertyService } from '../services/localPropertyService';
import { useAuth } from './AuthContext';


// --- CALCULATIONS (These remain on the frontend for real-time adjustments) ---
export const calculateMetrics = (financials: Financials): CalculatedMetrics => {
  const { 
    purchasePrice, rehabCost, downPaymentPercent, monthlyRents, vacancyRate, 
    maintenanceRate, managementRate, capexRate, monthlyTaxes, monthlyInsurance,
    monthlyWaterSewer, monthlyStreetLights, monthlyGas, monthlyElectric, monthlyLandscaping,
    monthlyHoaFee, operatingMiscFee,
    loanInterestRate, loanTermYears, originationFeePercent, closingFee, 
    processingFee, appraisalFee, titleFee,
    brokerAgentFee, homeWarrantyFee, attorneyFee, closingMiscFee,
    sellerCreditTax, sellerCreditSewer, sellerCreditOrigination, sellerCreditClosing
  } = financials;

  const downPaymentAmount = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPaymentAmount;

  const originationFeeAmount = loanAmount * (originationFeePercent / 100);
  const otherClosingFees = (closingFee || 0) + (processingFee || 0) + (appraisalFee || 0) + (titleFee || 0) + (brokerAgentFee || 0) + (homeWarrantyFee || 0) + (attorneyFee || 0) + (closingMiscFee || 0);
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


export const PropertyContext = createContext<{
  properties: Property[];
  setProperties: Dispatch<SetStateAction<Property[]>>;
  addProperty: (propertyData: Omit<Property, 'id'>) => Promise<Property>;
  updateProperty: (id: string, propertyData: Property) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}>({
  properties: [],
  setProperties: () => {},
  addProperty: async () => ({} as Property),
  updateProperty: async () => ({} as Property),
  deleteProperty: async () => {},
  loading: true,
  error: null,
});

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if user should use local storage
  const shouldUseLocalStorage = useCallback(() => {
    if (!user || !user.subscriptionTier) return true; // Default to local if unknown
    return ['Free', 'Starter'].includes(user.subscriptionTier);
  }, [user]);

  const fetchProperties = useCallback(async () => {
    if (!user) {
        setProperties([]);
        setLoading(false);
        return;
    };
    setLoading(true);
    setError(null);
    try {
      let fetchedProperties: Property[];
      
      if (shouldUseLocalStorage()) {
        // Use Local Storage Service
        fetchedProperties = await localPropertyService.getProperties(user.id);
      } else {
        // Use Backend API
        fetchedProperties = await apiClient.get('/properties');
      }
      
      setProperties(fetchedProperties);
    } catch (err) {
      setError('Failed to fetch properties.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, shouldUseLocalStorage]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const addProperty = async (propertyData: Omit<Property, 'id'>): Promise<Property> => {
    if (!user) throw new Error("User not authenticated");
    
    let newProperty: Property;
    
    if (shouldUseLocalStorage()) {
       newProperty = await localPropertyService.addProperty(user.id, propertyData);
    } else {
       newProperty = await apiClient.post('/properties', propertyData);
    }

    setProperties(prev => [newProperty, ...prev]);
    return newProperty;
  };

  const updateProperty = async (id: string, propertyData: Property): Promise<Property> => {
    if (!user) throw new Error("User not authenticated");
    
    let updatedProperty: Property;

    if (shouldUseLocalStorage()) {
        updatedProperty = await localPropertyService.updateProperty(user.id, id, propertyData);
        
        // Local storage service doesn't auto-recalculate via AI like the backend does on update.
        // We might want to simulate that or trigger an AI call, but for now, we'll just save the data.
        // If AI re-eval is critical for local updates, we'd need to call '/analyze' endpoint explicitly here
        // passing the updated data, but '/analyze' is built for raw inputs (url/address), not full JSON re-eval.
        // Re-eval via backend is handled in the 'updateProperty' controller. 
        
        // IMPORTANT: The backend `updateProperty` does a full AI re-evaluation. 
        // The local service update is just a data save. 
        // To maintain feature parity, we should probably hit the backend for re-evaluation 
        // even for local storage users, but save the RESULT locally.
        
        // However, to keep it simple and fast for Free/Starter as requested: 
        // We will just save the data locally. They miss out on the auto-AI-re-evaluation on edit
        // unless we specifically build a "Re-evaluate" button that calls the AI endpoint.
        // Given the prompt asked to "store in browser", we stick to storage logic.
        
    } else {
        updatedProperty = await apiClient.put(`/properties/${id}`, propertyData);
    }

    setProperties(prev => prev.map(p => (p.id === id ? updatedProperty : p)));
    return updatedProperty;
  };

  const deleteProperty = async (id: string) => {
    if (!user) throw new Error("User not authenticated");

    if (shouldUseLocalStorage()) {
        await localPropertyService.deleteProperty(user.id, id);
    } else {
        await apiClient.delete(`/properties/${id}`);
    }
    
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  return (
    <PropertyContext.Provider value={{ properties, setProperties, addProperty, updateProperty, deleteProperty, loading, error }}>
      {children}
    </PropertyContext.Provider>
  );
};