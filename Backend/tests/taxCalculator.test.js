const {
  calcWithholdingTax,
  calcTaxableIncome,
  calcSemiMonthlyTax,
} = require("../utils/taxCalculator.helper");

const brackets = [
  { salary_from: 0, salary_to: 20833, tax_base: 0, percentage_over_base: 0 },
  { salary_from: 20833.01, salary_to: 33333, tax_base: 0, percentage_over_base: 0.15 },
  { salary_from: 33333.01, salary_to: 66667, tax_base: 1875, percentage_over_base: 0.20 },
  { salary_from: 66667.01, salary_to: 166667, tax_base: 8541.80, percentage_over_base: 0.25 },
  { salary_from: 166667.01, salary_to: 999999999, tax_base: 33541.80, percentage_over_base: 0.30 },
];

describe("calcWithholdingTax", () => {
  it("returns 0 for zero income", () => {
    expect(calcWithholdingTax(0, brackets)).toBe(0);
  });

  it("returns 0 for negative income", () => {
    expect(calcWithholdingTax(-5000, brackets)).toBe(0);
  });

  it("returns 0 for income below taxable threshold (0-20833 bracket)", () => {
    expect(calcWithholdingTax(15000, brackets)).toBe(0);
  });

  it("computes 15% bracket correctly (20833.01-33333)", () => {
    const tax = calcWithholdingTax(30000, brackets);
    const expected = 0 + (30000 - 20833.01) * 0.15;
    expect(tax).toBeCloseTo(expected, 2);
    expect(tax).toBeCloseTo(1375.05, 2);
  });

  it("computes 20% bracket correctly (33333.01-66667)", () => {
    const tax = calcWithholdingTax(50000, brackets);
    const expected = 1875 + (50000 - 33333.01) * 0.20;
    expect(tax).toBeCloseTo(expected, 2);
    expect(tax).toBeCloseTo(5208.40, 2);
  });

  it("computes 25% bracket correctly (66667.01-166667)", () => {
    const tax = calcWithholdingTax(100000, brackets);
    const expected = 8541.80 + (100000 - 66667.01) * 0.25;
    expect(tax).toBeCloseTo(expected, 2);
    expect(tax).toBeCloseTo(16875.05, 2);
  });

  it("computes 30% bracket correctly (166667.01+)", () => {
    const tax = calcWithholdingTax(200000, brackets);
    const expected = 33541.80 + (200000 - 166667.01) * 0.30;
    expect(tax).toBeCloseTo(expected, 2);
    expect(tax).toBeCloseTo(43541.70, 2);
  });

  it("handles income exactly at bracket boundary", () => {
    const tax = calcWithholdingTax(33333, brackets);
    const expected = 0 + (33333 - 20833.01) * 0.15;
    expect(tax).toBeCloseTo(expected, 2);
  });

  it("uses max bracket for income above table ceiling", () => {
    const tax = calcWithholdingTax(999999999, brackets);
    const expected = 33541.80 + (999999999 - 166667.01) * 0.30;
    expect(tax).toBeCloseTo(expected, 2);
  });

  it("handles empty brackets array", () => {
    expect(() => calcWithholdingTax(50000, [])).toThrow();
  });

  it("handles bracket data with string numeric values", () => {
    const stringBrackets = [
      { salary_from: "0", salary_to: "20833", tax_base: "0", percentage_over_base: "0" },
      { salary_from: "20833.01", salary_to: "999999", tax_base: "0", percentage_over_base: "0.15" },
    ];
    const tax = calcWithholdingTax(30000, stringBrackets);
    expect(tax).toBeCloseTo((30000 - 20833.01) * 0.15, 2);
  });

  it("returns exact boundary at 20833.01", () => {
    const tax = calcWithholdingTax(20833.01, brackets);
    expect(tax).toBeCloseTo(0, 2);
  });

  it("returns tax_base + excess for 66667.01 entry point", () => {
    const tax = calcWithholdingTax(66667.01, brackets);
    const expected = 8541.80 + (66667.01 - 66667.01) * 0.25;
    expect(tax).toBeCloseTo(expected, 2);
    expect(tax).toBe(8541.80);
  });
});

describe("calcTaxableIncome", () => {
  it("computes basic taxable income (no allowances, no OT, no ND)", () => {
    const result = calcTaxableIncome(25000, 0, 0, 0, 0, 0, 0);
    expect(result).toBe(25000);
  });

  it("adds allowances to taxable income", () => {
    const result = calcTaxableIncome(25000, 1000, 0, 0, 0, 0, 0);
    expect(result).toBe(26000);
  });

  it("adds overtime pay to taxable income", () => {
    const result = calcTaxableIncome(25000, 0, 500, 0, 0, 0, 0);
    expect(result).toBe(25500);
  });

  it("excludes night differential pay from taxable income per RA 11701", () => {
    const withND = calcTaxableIncome(25000, 0, 0, 3000, 0, 0, 0);
    const withoutND = calcTaxableIncome(25000, 0, 0, 0, 0, 0, 0);
    expect(withND).toBe(withoutND);
    expect(withND).toBe(25000);
  });

  it("subtracts government share contributions", () => {
    const result = calcTaxableIncome(25000, 0, 0, 0, 1125, 562.50, 100);
    expect(result).toBe(25000 - 1125 - 562.50 - 100);
    expect(result).toBe(23212.50);
  });

  it("returns 0 when gov deductions exceed gross income", () => {
    const result = calcTaxableIncome(500, 0, 0, 0, 1000, 0, 0);
    expect(result).toBe(0);
  });

  it("returns 0 when all inputs are zero", () => {
    expect(calcTaxableIncome(0, 0, 0, 0, 0, 0, 0)).toBe(0);
  });

  it("handles negative allowances (corrections)", () => {
    const result = calcTaxableIncome(25000, -500, 0, 0, 1000, 500, 100);
    expect(result).toBe(Math.max(0, 24500 - 1600));
    expect(result).toBe(22900);
  });

  it("handles partial contributions", () => {
    const result = calcTaxableIncome(25000, 0, 0, 0, 1125, 0, 100);
    expect(result).toBe(25000 - 1125 - 100);
  });
});

describe("calcSemiMonthlyTax", () => {
  it("divides monthly tax by 2", () => {
    expect(calcSemiMonthlyTax(5208.40)).toBe(2604.20);
  });

  it("rounds to 2 decimal places", () => {
    expect(calcSemiMonthlyTax(1001.25)).toBe(500.63);
  });

  it("handles zero", () => {
    expect(calcSemiMonthlyTax(0)).toBe(0);
  });

  it("handles small tax amounts", () => {
    expect(calcSemiMonthlyTax(1)).toBe(0.50);
  });

  it("handles fractional cents correctly", () => {
    expect(calcSemiMonthlyTax(1000.01)).toBe(500.01);
  });
});

describe("Full tax computation integration (payroll model flow)", () => {
  it("computes semi-monthly withholding tax correctly: low income (no tax)", () => {
    const semiMonthlyBasicPay = 10000;
    const taxableIncome = calcTaxableIncome(semiMonthlyBasicPay, 0, 0, 0, 500, 250, 50);
    const monthlyIncome = taxableIncome * 2;
    const monthlyTax = calcWithholdingTax(monthlyIncome, brackets);
    const semiMonthlyTax = calcSemiMonthlyTax(monthlyTax);
    // Monthly income = (10000 - 800) * 2 = 18400; below 20833 → no tax
    expect(semiMonthlyTax).toBe(0);
  });

  it("computes semi-monthly withholding tax correctly: mid income (15% bracket)", () => {
    const semiMonthlyBasicPay = 15000;
    const allowances = 1000;
    const overtime = 500;
    const ndPay = 2000;
    const sss = 585;
    const philHealth = 350;
    const pagIbig = 100;

    const taxableIncome = calcTaxableIncome(semiMonthlyBasicPay, allowances, overtime, ndPay, sss, philHealth, pagIbig);
    // gross = 15000 + 1000 + 500 = 16500 (ND excluded)
    // gov ded = 585 + 350 + 100 = 1035
    // taxable = 16500 - 1035 = 15465
    expect(taxableIncome).toBe(15465);

    const monthlyIncome = taxableIncome * 2; // 30930
    const monthlyTax = calcWithholdingTax(monthlyIncome, brackets);
    // bracket 20833.01-33333: tax = 0 + (30930-20833.01)*0.15 = 1514.5485
    expect(monthlyTax).toBeCloseTo(1514.55, 2);

    const semiMonthlyTax = calcSemiMonthlyTax(monthlyTax);
    expect(semiMonthlyTax).toBeCloseTo(757.27, 2);
  });

  it("computes semi-monthly withholding tax correctly: high income (20% bracket)", () => {
    const semiMonthlyBasicPay = 25000;
    const allowances = 2000;
    const sss = 1125;
    const philHealth = 562.50;
    const pagIbig = 100;

    const taxableIncome = calcTaxableIncome(semiMonthlyBasicPay, allowances, 0, 0, sss, philHealth, pagIbig);
    // gross = 25000 + 2000 = 27000
    // gov ded = 1125 + 562.50 + 100 = 1787.50
    // taxable = 27000 - 1787.50 = 25212.50
    expect(taxableIncome).toBeCloseTo(25212.50, 2);

    const monthlyIncome = taxableIncome * 2; // 50425
    const monthlyTax = calcWithholdingTax(monthlyIncome, brackets);
    // bracket 33333.01-66667: tax = 1875 + (50425-33333.01)*0.20 = 1875 + 3418.398 = 5293.398
    expect(monthlyTax).toBeCloseTo(5293.40, 2);

    const semiMonthlyTax = calcSemiMonthlyTax(monthlyTax);
    expect(semiMonthlyTax).toBeCloseTo(2646.70, 2);
  });

  it("verifies the old bug: using monthly brackets on semi-monthly income under-withholds", () => {
    const semiMonthlyBasicPay = 25000;
    const taxableIncome = calcTaxableIncome(semiMonthlyBasicPay, 0, 0, 0, 0, 0, 0);

    // OLD (buggy): treat semi-monthly as monthly
    const oldTax = calcSemiMonthlyTax(calcWithholdingTax(taxableIncome, brackets));
    // NEW (fixed): annualize to monthly first
    const newTax = calcSemiMonthlyTax(calcWithholdingTax(taxableIncome * 2, brackets));

    // Old: 25000 → bracket 20833.01-33333 → 0 + (25000-20833.01)*0.15 = 625.0485 → /2 = 312.52
    expect(oldTax).toBeCloseTo(312.52, 2);
    // New: 50000 → bracket 33333.01-66667 → 1875 + (50000-33333.01)*0.20 = 5208.40 → /2 = 2604.20
    expect(newTax).toBeCloseTo(2604.20, 2);

    // The fix increases withholding by ~8.3x
    expect(newTax / oldTax).toBeCloseTo(8.33, 1);
  });

  it("excludes night differential from taxable income end-to-end", () => {
    const semiMonthlyBasicPay = 20000;
    const ndPay = 3000;

    const taxableWithND = calcTaxableIncome(semiMonthlyBasicPay, 0, 0, ndPay, 500, 250, 50);
    const taxableWithoutND = calcTaxableIncome(semiMonthlyBasicPay, 0, 0, 0, 500, 250, 50);
    expect(taxableWithND).toBe(taxableWithoutND);

    const monthlyIncome = taxableWithND * 2;
    const monthlyTax = calcWithholdingTax(monthlyIncome, brackets);
    const semiMonthlyTax = calcSemiMonthlyTax(monthlyTax);
    // Same tax whether ND was paid or not (ND is exempt)
    const monthlyIncomeRef = taxableWithoutND * 2;
    const monthlyTaxRef = calcWithholdingTax(monthlyIncomeRef, brackets);
    const semiMonthlyTaxRef = calcSemiMonthlyTax(monthlyTaxRef);
    expect(semiMonthlyTax).toBe(semiMonthlyTaxRef);
  });

  it("separates taxable vs non-taxable allowances correctly", () => {
    const semiMonthlyBasicPay = 20000;
    const taxableAllowances = 1500;
    const nonTaxableAllowances = 500;
    const sss = 585;
    const philHealth = 350;
    const pagIbig = 100;

    // NEW (fixed): only taxable allowances go into income tax
    const taxableIncome = calcTaxableIncome(semiMonthlyBasicPay, taxableAllowances, 0, 0, sss, philHealth, pagIbig);

    const grossForTax = semiMonthlyBasicPay + taxableAllowances; // 21500, excludes nonTaxable
    const govDed = sss + philHealth + pagIbig; // 1035
    expect(taxableIncome).toBe(grossForTax - govDed);
    expect(taxableIncome).toBe(20465);

    // OLD (buggy): all allowances treated as taxable, inflating taxable income
    const oldTaxableIncome = calcTaxableIncome(semiMonthlyBasicPay, taxableAllowances + nonTaxableAllowances, 0, 0, sss, philHealth, pagIbig);
    expect(oldTaxableIncome).toBe(20965);

    // The fix keeps taxable income lower by excluding non-taxable allowances
    expect(taxableIncome).toBeLessThan(oldTaxableIncome);
    expect(oldTaxableIncome - taxableIncome).toBe(nonTaxableAllowances);
  });
});
