/**
 * Withholding Tax Calculator Helper
 * Computes BIR TRAIN Law withholding tax based on monthly salary brackets.
 * No database dependencies — fully unit-testable.
 */

function calcWithholdingTax(monthlyTaxableIncome, taxBrackets) {
  if (monthlyTaxableIncome <= 0) return 0;
  const bracket = taxBrackets.find(
    (row) => monthlyTaxableIncome >= Number(row.salary_from) && monthlyTaxableIncome <= Number(row.salary_to)
  );
  if (!bracket) {
    const maxBracket = taxBrackets.reduce((max, row) =>
      Number(row.salary_to) > Number(max.salary_to) ? row : max
    );
    const excess = Math.max(0, monthlyTaxableIncome - Number(maxBracket.salary_from));
    return Number(maxBracket.tax_base) + excess * Number(maxBracket.percentage_over_base);
  }
  const excess = Math.max(0, monthlyTaxableIncome - Number(bracket.salary_from));
  return Number(bracket.tax_base) + excess * Number(bracket.percentage_over_base);
}

function calcTaxableIncome(monthlyBasicPay, allowances, overtimePay, nightDifferentialPay, sssShare, philHealthShare, pagIbigShare) {
  // Night differential is non-taxable per RA 11701
  const grossIncome = monthlyBasicPay + allowances + overtimePay;
  const totalGovDeductions = sssShare + philHealthShare + pagIbigShare;
  return Math.max(0, grossIncome - totalGovDeductions);
}

function calcSemiMonthlyTax(monthlyTax) {
  return Math.round((monthlyTax / 2) * 100) / 100;
}

module.exports = {
  calcWithholdingTax,
  calcTaxableIncome,
  calcSemiMonthlyTax,
};
