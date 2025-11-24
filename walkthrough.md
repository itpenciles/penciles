# Walkthrough: Projections, BRRRR, and Sales Comps

This walkthrough details the new features added to the Property Analyzer: Long-Term Projections, BRRRR Calculator, and Manual Sales Comparables.

## 1. Long-Term Projections

A new **"Projections"** tab has been added to the Property Detail view.

### Features
-   **30-Year Forecast**: Visualizes Equity Buildup, Loan Paydown, and Cash Flow over 30 years.
-   **Interactive Charts**: Uses `recharts` to display:
    -   Equity vs. Loan Balance (Area Chart)
    -   Annual Cash Flow & NOI (Bar/Line Chart)
-   **Adjustable Assumptions**: Users can modify:
    -   Appreciation Rate (Default: 3%)
    -   Rent Growth Rate (Default: 3%)
    -   Expense Inflation Rate (Default: 2%)
-   **Detailed Table**: A tabular view of the data for every 5th year.

### Verification
-   Navigate to any property.
-   Click the "Projections" tab.
-   Adjust the sliders and observe the charts updating in real-time.

## 2. BRRRR Calculator

A dedicated **BRRRR** (Buy, Rehab, Rent, Refinance, Repeat) strategy has been added.

### Features
-   **Strategy Selector**: "BRRRR" is now a selectable strategy.
-   **Two-Phase Analysis**:
    -   **Phase 1 (Buy & Rehab)**: Inputs for Purchase Price, Rehab Cost, Rehab Duration, and Initial Loan (Hard Money/Bridge).
    -   **Phase 2 (Refinance)**: Inputs for ARV, Refinance LTV, Refinance Rate, and Post-Refi Expenses.
-   **Key Metrics**:
    -   **Cash Left in Deal**: Calculates how much capital is trapped after refinancing.
    -   **ROI (Infinite Return)**: Detects if you have pulled out all your cash (Infinite Return).
    -   **Post-Refi Cash Flow**: Monthly cash flow after the refinance loan is in place.

### Verification
-   Select "BRRRR" from the strategy dropdown.
-   Go to the "Parameters" tab to input your loan and rehab details.
-   View the "Metrics" tab to see your Cash Left in Deal and ROI.

## 3. Manual Sales Comparables

A new **"Comparables"** tab allows for manual entry and tracking of sales comps.

### Features
-   **Add Comps**: Manually enter address, price, date, sqft, beds/baths, and distance.
-   **Valuation Analysis**:
    -   Calculates **Average Price** of selected comps.
    -   Calculates **Weighted Average Price per SqFt**.
    -   **Indicated Value**: Estimates the subject property's value based on its SqFt and the comps' Avg $/SqFt.
-   **Apply to ARV**: One-click button to update the property's Estimated Value / ARV with the Indicated Value.

### Verification
-   Click the "Comparables" tab.
-   Click "Add Comp" and enter a few test comparables.
-   Check the "Indicated Value" calculation.
-   Click "Apply" to update the property's ARV.

## Technical Changes
-   **Refactoring**: `AdjustTab` and form fields were extracted to separate files for better maintainability.
-   **Type Safety**: Enhanced `types.ts` to support new strategies and data structures.
-   **Backend Support**: Updated `geminiService.ts` and `calculations.ts` to handle BRRRR logic server-side.
