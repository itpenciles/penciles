import { Financials } from '../types';

export interface ProjectionYear {
    year: number;
    propertyValue: number;
    loanBalance: number;
    equity: number;
    grossIncome: number;
    operatingExpenses: number;
    netOperatingIncome: number;
    debtService: number;
    cashFlow: number;
    cumulativeCashFlow: number;
    cumulativeAppreciation: number;
    cumulativePrincipalPaydown: number;
    totalReturn: number; // Cash Flow + Principal Paydown + Appreciation
}

export interface ProjectionAssumptions {
    appreciationRate: number; // Percentage (e.g., 3 for 3%)
    incomeGrowthRate: number; // Percentage
    expenseGrowthRate: number; // Percentage
}

export const calculateProjections = (financials: Financials, assumptions: ProjectionAssumptions): ProjectionYear[] => {
    const projections: ProjectionYear[] = [];

    // Initial Values
    let currentValue = financials.purchasePrice || financials.listPrice;
    let currentLoanBalance = financials.purchasePrice ? financials.purchasePrice * (1 - (financials.downPaymentPercent / 100)) : 0;

    // Calculate Monthly Principal & Interest (Fixed for 30 years usually)
    const monthlyRate = (financials.loanInterestRate / 100) / 12;
    const numberOfPayments = financials.loanTermYears * 12;
    const monthlyPI = currentLoanBalance * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    const annualDebtService = monthlyPI * 12;

    // Initial Annual Income/Expenses
    let currentAnnualIncome = financials.monthlyRents.reduce((a, b) => a + b, 0) * 12;

    // Calculate initial annual operating expenses (excluding debt service)
    const monthlyExpenses =
        financials.monthlyTaxes +
        financials.monthlyInsurance +
        financials.monthlyWaterSewer +
        financials.monthlyStreetLights +
        financials.monthlyGas +
        financials.monthlyElectric +
        financials.monthlyLandscaping +
        financials.monthlyHoaFee +
        financials.operatingMiscFee +
        (currentAnnualIncome / 12 * (financials.vacancyRate / 100)) +
        (currentAnnualIncome / 12 * (financials.maintenanceRate / 100)) +
        (currentAnnualIncome / 12 * (financials.managementRate / 100)) +
        (currentAnnualIncome / 12 * (financials.capexRate / 100));

    let currentAnnualExpenses = monthlyExpenses * 12;

    let cumulativeCashFlow = 0;
    const initialValue = currentValue;
    const initialLoan = currentLoanBalance;

    for (let year = 1; year <= 30; year++) {
        // 1. Appreciation
        const appreciationAmount = currentValue * (assumptions.appreciationRate / 100);
        currentValue += appreciationAmount;

        // 2. Income Growth
        if (year > 1) {
            currentAnnualIncome *= (1 + (assumptions.incomeGrowthRate / 100));
        }

        // 3. Expense Growth
        if (year > 1) {
            currentAnnualExpenses *= (1 + (assumptions.expenseGrowthRate / 100));
        }

        // 4. Loan Amortization (Principal Paydown)
        // We need to calculate how much principal was paid this year
        // Simple approach: Calculate remaining balance at end of year
        const paymentsMade = year * 12;
        const remainingPayments = numberOfPayments - paymentsMade;

        let newLoanBalance = 0;
        if (remainingPayments > 0) {
            // Formula for remaining balance
            newLoanBalance = currentLoanBalance * (Math.pow(1 + monthlyRate, 12) - (Math.pow(1 + monthlyRate, 12) - 1) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1) * (Math.pow(1 + monthlyRate, numberOfPayments) - Math.pow(1 + monthlyRate, (year - 1) * 12)));
            // Actually simpler: standard amortization formula for remaining balance
            newLoanBalance = (monthlyPI / monthlyRate) * (1 - Math.pow(1 + monthlyRate, -remainingPayments));
        } else {
            newLoanBalance = 0;
        }

        // Fix for JS float precision or slight formula mismatch at end of term
        if (newLoanBalance < 0) newLoanBalance = 0;

        const principalPaidThisYear = currentLoanBalance - newLoanBalance;
        currentLoanBalance = newLoanBalance;

        // 5. Metrics
        const noi = currentAnnualIncome - currentAnnualExpenses;
        const cashFlow = noi - annualDebtService;
        cumulativeCashFlow += cashFlow;

        const equity = currentValue - currentLoanBalance;
        const cumulativeAppreciation = currentValue - initialValue;
        const cumulativePrincipalPaydown = initialLoan - currentLoanBalance;
        const totalReturn = cumulativeCashFlow + cumulativePrincipalPaydown + cumulativeAppreciation;

        projections.push({
            year,
            propertyValue: Math.round(currentValue),
            loanBalance: Math.round(currentLoanBalance),
            equity: Math.round(equity),
            grossIncome: Math.round(currentAnnualIncome),
            operatingExpenses: Math.round(currentAnnualExpenses),
            netOperatingIncome: Math.round(noi),
            debtService: Math.round(annualDebtService),
            cashFlow: Math.round(cashFlow),
            cumulativeCashFlow: Math.round(cumulativeCashFlow),
            cumulativeAppreciation: Math.round(cumulativeAppreciation),
            cumulativePrincipalPaydown: Math.round(cumulativePrincipalPaydown),
            totalReturn: Math.round(totalReturn)
        });
    }

    return projections;
};
