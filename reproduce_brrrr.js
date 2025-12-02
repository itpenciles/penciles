
// Mock types
interface BrrrrInputs {
    purchasePrice: number;
    arv: number;
    purchaseCosts: any;
    rehabCosts: any;
    financing: any;
    refinance: any;
    expenses: any;
    monthlyRent: number;
    holdingCostsMonthly: number;
}

// Paste the function
const calculateBrrrrMetrics = (inputs: BrrrrInputs) => {
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
        monthlyTaxes, monthlyInsurance,
        vacancyRate, maintenanceRate, capexRate, managementRate,
        otherMonthlyIncome
    } = expenses || {};

    const grossMonthlyIncome = monthlyRent + (otherMonthlyIncome || 0);

    const vacancyLoss = monthlyRent * ((vacancyRate || 0) / 100);
    const effectiveIncome = grossMonthlyIncome - vacancyLoss;

    const maintenanceCost = monthlyRent * ((maintenanceRate || 0) / 100);
    const capexCost = monthlyRent * ((capexRate || 0) / 100);
    const managementCost = monthlyRent * ((managementRate || 0) / 100);

    const totalFixedExpenses = (monthlyTaxes || 0) + (monthlyInsurance || 0); // Simplified for repro

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
        refinanceLoanAmount,
        cashOutAmount: -cashLeftInDeal,
        cashLeftInDeal,
        roi,
        monthlyCashFlowPostRefi,
        isInfiniteReturn
    };
};

// User Inputs
const inputs: BrrrrInputs = {
    purchasePrice: 40000,
    arv: 147000,
    purchaseCosts: {
        points: 2, // This field in UI is "Points/Origination ($)" but logic treats it as cost? 
        // Wait, in UI screenshot "Points/Origination ($)" has value "2". 
        // But in code `purchaseCosts` are summed. 
        // AND `financing.points` is a percentage.
        // Let's check the UI screenshot again.
        // "Purchase Closing Costs" -> "Points/Origination ($)" = 2.
        // "Financing" -> "Points Charged (%)" = 1.
        // So purchaseCosts.points = 2.
        points: 2,
        attorneyFees: 4000,
        inspectionCost: 370,
        appraisalFees: 800,
        brokerFees: 1500
    },
    rehabCosts: {
        exterior: { roof: 7000 },
        interior: { demo: 5000, windows: 3000, hvac: 3000, cabinets: 2500, flooring: 4500 }
    },
    financing: {
        isCash: false,
        loanAmount: 100000,
        interestRate: 5.5,
        points: 1,
        interestOnly: false, // Toggle is OFF in screenshot?
        // Screenshot 3: "Interest Only?" toggle is OFF (grey).
        // "Wrap Fees into Loan?" toggle is ON (blue).
        wrapFeesIntoLoan: true,
        rehabTimelineMonths: 4,
        otherCharges: 0
    },
    refinance: {
        loanLtv: 70,
        interestRate: 6.5,
        closingCosts: 5000
    },
    expenses: {
        monthlyRent: 1295,
        monthlyTaxes: 131,
        monthlyInsurance: 90.88,
        vacancyRate: 8,
        maintenanceRate: 8,
        managementRate: 10.5,
        capexRate: 8
    },
    monthlyRent: 1295,
    holdingCostsMonthly: 500
};

console.log("--- With Loan ---");
console.log(calculateBrrrrMetrics(inputs));

console.log("\n--- With All Cash ---");
const cashInputs = { ...inputs, financing: { ...inputs.financing, isCash: true } };
console.log(calculateBrrrrMetrics(cashInputs));
