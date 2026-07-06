/**
 * Contribution Calculator Helpers
 * Pure functions for computing Philippine government contributions.
 * No database dependencies — fully unit-testable.
 */

function calcSssContribution(monthlySalary, sssTable) {
  if (!sssTable || sssTable.length === 0) {
    return { employee_share: 0, employer_share: 0, total_contribution: 0 };
  }
  const bracket = sssTable.find(
    (row) => monthlySalary >= Number(row.salary_from) && monthlySalary <= Number(row.salary_to)
  );
  if (!bracket) {
    const maxBracket = sssTable.reduce((max, row) =>
      Number(row.salary_to) > Number(max.salary_to) ? row : max
    );
    return {
      employee_share: Number(maxBracket.employee_share),
      employer_share: Number(maxBracket.employer_share),
      total_contribution: Number(maxBracket.total_contribution),
    };
  }
  return {
    employee_share: Number(bracket.employee_share),
    employer_share: Number(bracket.employer_share),
    total_contribution: Number(bracket.total_contribution),
  };
}

function calcPhilHealthContribution(monthlySalary, philHealthTable) {
  if (!philHealthTable || philHealthTable.length === 0) {
    return { employee_share: 0, employer_share: 0, monthly_premium: 0 };
  }
  const bracket = philHealthTable.find(
    (row) => monthlySalary >= Number(row.salary_from) && monthlySalary <= Number(row.salary_to)
  );
  if (!bracket) {
    const maxBracket = philHealthTable.reduce((max, row) =>
      Number(row.salary_to) > Number(max.salary_to) ? row : max
    );
    const premium = Number(maxBracket.monthly_premium);
    return {
      employee_share: Math.round(premium * 50) / 100,
      employer_share: Math.round(premium * 50) / 100,
      monthly_premium: premium,
    };
  }
  const premium = Number(bracket.monthly_premium);
  return {
    employee_share: Math.round(premium * 50) / 100,
    employer_share: Math.round(premium * 50) / 100,
    monthly_premium: premium,
  };
}

function calcPagIbigContribution(monthlySalary, pagIbigTable) {
  if (!pagIbigTable || pagIbigTable.length === 0) {
    return { employee_share: 0, employer_share: 0 };
  }
  const bracket = pagIbigTable.find(
    (row) => monthlySalary >= Number(row.salary_from) && monthlySalary <= Number(row.salary_to)
  );
  if (!bracket) {
    return { employee_share: 0, employer_share: 0 };
  }
  const employeeRate = Number(bracket.employee_share);
  const employerRate = Number(bracket.employer_share);
  const employeeShare = Math.min(Math.round(monthlySalary * employeeRate * 100) / 100, 100);
  const employerShare = Math.min(Math.round(monthlySalary * employerRate * 100) / 100, 100);
  return { employee_share: employeeShare, employer_share: employerShare };
}

function calcTotalGovernmentContributions(monthlySalary, sssTable, philHealthTable, pagIbigTable) {
  const sss = calcSssContribution(monthlySalary, sssTable);
  const philHealth = calcPhilHealthContribution(monthlySalary, philHealthTable);
  const pagIbig = calcPagIbigContribution(monthlySalary, pagIbigTable);

  return {
    employee_total: sss.employee_share + philHealth.employee_share + pagIbig.employee_share,
    employer_total: sss.employer_share + philHealth.employer_share + pagIbig.employer_share,
    sss,
    philHealth,
    pagIbig,
  };
}

module.exports = {
  calcSssContribution,
  calcPhilHealthContribution,
  calcPagIbigContribution,
  calcTotalGovernmentContributions,
};
