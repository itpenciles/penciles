
import { calculateMetrics } from './contexts/PropertyContext';
import { Financials } from './types';

const mockFinancials: Financials = {
    listPrice: 100000,
    estimatedValue: 110000,
    purchasePrice: 100000,
    rehabCost: 0,
    downPaymentPercent: 20,
    monthlyRents: [1000],
    vacancyRate: 5,
    maintenanceRate: 5,
    managementRate: 10,
    capexRate: 5,
    monthlyTaxes: 100,
    monthlyInsurance: 50,
    monthlyWaterSewer: 0,
    monthlyStreetLights: 0,
    monthlyGas: 0,
    monthlyElectric: 0,
    monthlyLandscaping: 0,
    monthlyHoaFee: 0,
    operatingMiscFee: 0,
    loanInterestRate: 5,
    loanTermYears: 30,
    originationFeePercent: 0,
    closingFee: 0,
    processingFee: 0,
    appraisalFee: 0,
    titleFee: 0,
    brokerAgentFee: 0,
    homeWarrantyFee: 0,
    attorneyFee: 0,
    closingMiscFee: 0,
    sellerCreditTax: 0,
    sellerCreditSewer: 0,
    sellerCreditOrigination: 0,
    sellerCreditClosing: 0,
    sellerCreditRents: 1000,
    sellerCreditSecurityDeposit: 500,
    sellerCreditMisc: 200,
};

const result = calculateMetrics(mockFinancials);

console.log('Total Cash To Close:', result.totalCashToClose);
console.log('Expected Total Cash To Close:', 20000 - (1000 + 500 + 200));

if (result.totalCashToClose === 20000 - (1000 + 500 + 200)) {
    console.log('Verification PASSED');
} else {
    console.log('Verification FAILED');
}
