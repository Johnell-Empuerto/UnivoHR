const {
  calcSssContribution,
  calcPhilHealthContribution,
  calcPagIbigContribution,
  calcTotalGovernmentContributions,
} = require("../utils/contributionCalculator.helper");

const sssTable = [
  { salary_from: 0, salary_to: 3250, employee_share: 135, employer_share: 225, total_contribution: 360 },
  { salary_from: 3250.01, salary_to: 3750, employee_share: 157.50, employer_share: 262.50, total_contribution: 420 },
  { salary_from: 3750.01, salary_to: 4250, employee_share: 180, employer_share: 300, total_contribution: 480 },
  { salary_from: 4250.01, salary_to: 4750, employee_share: 202.50, employer_share: 337.50, total_contribution: 540 },
  { salary_from: 4750.01, salary_to: 5250, employee_share: 225, employer_share: 375, total_contribution: 600 },
  { salary_from: 5250.01, salary_to: 5750, employee_share: 247.50, employer_share: 412.50, total_contribution: 660 },
  { salary_from: 5750.01, salary_to: 6250, employee_share: 270, employer_share: 450, total_contribution: 720 },
  { salary_from: 6250.01, salary_to: 6750, employee_share: 292.50, employer_share: 487.50, total_contribution: 780 },
  { salary_from: 6750.01, salary_to: 7250, employee_share: 315, employer_share: 525, total_contribution: 840 },
  { salary_from: 7250.01, salary_to: 7750, employee_share: 337.50, employer_share: 562.50, total_contribution: 900 },
  { salary_from: 7750.01, salary_to: 8250, employee_share: 360, employer_share: 600, total_contribution: 960 },
  { salary_from: 8250.01, salary_to: 8750, employee_share: 382.50, employer_share: 637.50, total_contribution: 1020 },
  { salary_from: 8750.01, salary_to: 9250, employee_share: 405, employer_share: 675, total_contribution: 1080 },
  { salary_from: 9250.01, salary_to: 9750, employee_share: 427.50, employer_share: 712.50, total_contribution: 1140 },
  { salary_from: 9750.01, salary_to: 10250, employee_share: 450, employer_share: 750, total_contribution: 1200 },
  { salary_from: 10250.01, salary_to: 10750, employee_share: 472.50, employer_share: 787.50, total_contribution: 1260 },
  { salary_from: 10750.01, salary_to: 11250, employee_share: 495, employer_share: 825, total_contribution: 1320 },
  { salary_from: 11250.01, salary_to: 11750, employee_share: 517.50, employer_share: 862.50, total_contribution: 1380 },
  { salary_from: 11750.01, salary_to: 12250, employee_share: 540, employer_share: 900, total_contribution: 1440 },
  { salary_from: 12250.01, salary_to: 12750, employee_share: 562.50, employer_share: 937.50, total_contribution: 1500 },
  { salary_from: 12750.01, salary_to: 13250, employee_share: 585, employer_share: 975, total_contribution: 1560 },
  { salary_from: 13250.01, salary_to: 13750, employee_share: 607.50, employer_share: 1012.50, total_contribution: 1620 },
  { salary_from: 13750.01, salary_to: 14250, employee_share: 630, employer_share: 1050, total_contribution: 1680 },
  { salary_from: 14250.01, salary_to: 14750, employee_share: 652.50, employer_share: 1087.50, total_contribution: 1740 },
  { salary_from: 14750.01, salary_to: 15250, employee_share: 675, employer_share: 1125, total_contribution: 1800 },
  { salary_from: 15250.01, salary_to: 15750, employee_share: 697.50, employer_share: 1162.50, total_contribution: 1860 },
  { salary_from: 15750.01, salary_to: 16250, employee_share: 720, employer_share: 1200, total_contribution: 1920 },
  { salary_from: 16250.01, salary_to: 16750, employee_share: 742.50, employer_share: 1237.50, total_contribution: 1980 },
  { salary_from: 16750.01, salary_to: 17250, employee_share: 765, employer_share: 1275, total_contribution: 2040 },
  { salary_from: 17250.01, salary_to: 17750, employee_share: 787.50, employer_share: 1312.50, total_contribution: 2100 },
  { salary_from: 17750.01, salary_to: 18250, employee_share: 810, employer_share: 1350, total_contribution: 2160 },
  { salary_from: 18250.01, salary_to: 18750, employee_share: 832.50, employer_share: 1387.50, total_contribution: 2220 },
  { salary_from: 18750.01, salary_to: 19250, employee_share: 855, employer_share: 1425, total_contribution: 2280 },
  { salary_from: 19250.01, salary_to: 19750, employee_share: 877.50, employer_share: 1462.50, total_contribution: 2340 },
  { salary_from: 19750.01, salary_to: 20250, employee_share: 900, employer_share: 1500, total_contribution: 2400 },
  { salary_from: 20250.01, salary_to: 20750, employee_share: 922.50, employer_share: 1537.50, total_contribution: 2460 },
  { salary_from: 20750.01, salary_to: 21250, employee_share: 945, employer_share: 1575, total_contribution: 2520 },
  { salary_from: 21250.01, salary_to: 21750, employee_share: 967.50, employer_share: 1612.50, total_contribution: 2580 },
  { salary_from: 21750.01, salary_to: 22250, employee_share: 990, employer_share: 1650, total_contribution: 2640 },
  { salary_from: 22250.01, salary_to: 22750, employee_share: 1012.50, employer_share: 1687.50, total_contribution: 2700 },
  { salary_from: 22750.01, salary_to: 23250, employee_share: 1035, employer_share: 1725, total_contribution: 2760 },
  { salary_from: 23250.01, salary_to: 23750, employee_share: 1057.50, employer_share: 1762.50, total_contribution: 2820 },
  { salary_from: 23750.01, salary_to: 24250, employee_share: 1080, employer_share: 1800, total_contribution: 2880 },
  { salary_from: 24250.01, salary_to: 24750, employee_share: 1102.50, employer_share: 1837.50, total_contribution: 2940 },
  { salary_from: 24750.01, salary_to: 999999999, employee_share: 1125, employer_share: 1875, total_contribution: 3000 },
];

const philHealthTable = [
  { salary_from: 0, salary_to: 10000, monthly_premium: 500, employee_rate: 0.025, employer_rate: 0.025 },
  { salary_from: 10000.01, salary_to: 999999999, monthly_premium: 900, employee_rate: 0.025, employer_rate: 0.025 },
];

const pagIbigTable = [
  { salary_from: 0, salary_to: 1500, employee_share: 0.01, employer_share: 0.02 },
  { salary_from: 1500.01, salary_to: 999999999, employee_share: 0.02, employer_share: 0.02 },
];

describe("calcSssContribution", () => {
  it("returns zeroes for empty table", () => {
    const result = calcSssContribution(50000, []);
    expect(result).toEqual({ employee_share: 0, employer_share: 0, total_contribution: 0 });
  });

  it("returns zeroes for null table", () => {
    const result = calcSssContribution(50000, null);
    expect(result).toEqual({ employee_share: 0, employer_share: 0, total_contribution: 0 });
  });

  it("returns zeroes for undefined table", () => {
    const result = calcSssContribution(50000, undefined);
    expect(result).toEqual({ employee_share: 0, employer_share: 0, total_contribution: 0 });
  });

  it("returns correct bracket for salary at exact bracket start", () => {
    const result = calcSssContribution(3250.01, sssTable);
    expect(result.employee_share).toBe(157.50);
    expect(result.employer_share).toBe(262.50);
    expect(result.total_contribution).toBe(420);
  });

  it("returns correct bracket for salary in middle of range", () => {
    const result = calcSssContribution(5000, sssTable);
    expect(result.employee_share).toBe(225);
    expect(result.employer_share).toBe(375);
    expect(result.total_contribution).toBe(600);
  });

  it("returns max bracket for salary above ceiling", () => {
    const result = calcSssContribution(100000, sssTable);
    expect(result.employee_share).toBe(1125);
    expect(result.employer_share).toBe(1875);
    expect(result.total_contribution).toBe(3000);
  });

  it("handles salary below minimum bracket", () => {
    const result = calcSssContribution(1000, sssTable);
    expect(result.employee_share).toBe(135);
    expect(result.employer_share).toBe(225);
    expect(result.total_contribution).toBe(360);
  });

  it("handles zero salary", () => {
    const result = calcSssContribution(0, sssTable);
    expect(result.employee_share).toBe(135);
    expect(result.employer_share).toBe(225);
    expect(result.total_contribution).toBe(360);
  });

  it("handles string numeric salary values", () => {
    const result = calcSssContribution("5000", sssTable);
    expect(result.employee_share).toBe(225);
  });

  it("handles string numeric bracket values", () => {
    const stringTable = [
      { salary_from: "0", salary_to: "5000", employee_share: "100", employer_share: "200", total_contribution: "300" },
    ];
    const result = calcSssContribution(3000, stringTable);
    expect(result.employee_share).toBe(100);
    expect(result.employer_share).toBe(200);
    expect(result.total_contribution).toBe(300);
  });
});

describe("calcPhilHealthContribution", () => {
  it("returns zeroes for empty table", () => {
    const result = calcPhilHealthContribution(50000, []);
    expect(result).toEqual({ employee_share: 0, employer_share: 0, monthly_premium: 0 });
  });

  it("returns correct premium for low salary (≤10000 bracket)", () => {
    const result = calcPhilHealthContribution(8000, philHealthTable);
    expect(result.monthly_premium).toBe(500);
    expect(result.employee_share).toBe(250);
    expect(result.employer_share).toBe(250);
  });

  it("returns correct premium for high salary (>10000 bracket)", () => {
    const result = calcPhilHealthContribution(50000, philHealthTable);
    expect(result.monthly_premium).toBe(900);
    expect(result.employee_share).toBe(450);
    expect(result.employer_share).toBe(450);
  });

  it("handles salary at bracket boundary", () => {
    const result = calcPhilHealthContribution(10000.01, philHealthTable);
    expect(result.monthly_premium).toBe(900);
  });

  it("uses max bracket for salary below table minimum", () => {
    const result = calcPhilHealthContribution(0, philHealthTable);
    expect(result.monthly_premium).toBe(500);
  });

  it("returns zeroes for null table", () => {
    const result = calcPhilHealthContribution(50000, null);
    expect(result).toEqual({ employee_share: 0, employer_share: 0, monthly_premium: 0 });
  });
});

describe("calcPagIbigContribution", () => {
  it("returns zeroes for empty table", () => {
    const result = calcPagIbigContribution(50000, []);
    expect(result).toEqual({ employee_share: 0, employer_share: 0 });
  });

  it("computes 1% employee / 2% employer for salary ≤1500", () => {
    const result = calcPagIbigContribution(1000, pagIbigTable);
    expect(result.employee_share).toBe(10);
    expect(result.employer_share).toBe(20);
  });

  it("computes 2% employee / 2% employer for salary >1500", () => {
    const result = calcPagIbigContribution(5000, pagIbigTable);
    expect(result.employee_share).toBe(100);
    expect(result.employer_share).toBe(100);
  });

  it("caps employee share at 100", () => {
    const result = calcPagIbigContribution(10000, pagIbigTable);
    expect(result.employee_share).toBe(100);
    expect(result.employer_share).toBe(100);
  });

  it("returns zeroes for negative salary (no matching bracket)", () => {
    const result = calcPagIbigContribution(-1, pagIbigTable);
    expect(result).toEqual({ employee_share: 0, employer_share: 0 });
  });

  it("handles salary exactly at bracket boundary", () => {
    const result = calcPagIbigContribution(1500.01, pagIbigTable);
    // 1500.01 × 0.02 = 30.0002, rounded to 30.00
    expect(result.employee_share).toBe(30);
    expect(result.employer_share).toBe(30);
  });

  it("returns zeroes for null table", () => {
    const result = calcPagIbigContribution(50000, null);
    expect(result).toEqual({ employee_share: 0, employer_share: 0 });
  });

  it("returns zeroes for no matching bracket in non-empty table", () => {
    const partialTable = [
      { salary_from: 5000, salary_to: 10000, employee_share: 0.02, employer_share: 0.02 },
    ];
    const result = calcPagIbigContribution(2000, partialTable);
    expect(result).toEqual({ employee_share: 0, employer_share: 0 });
  });
});

describe("calcTotalGovernmentContributions", () => {
  it("combines all three contributions correctly", () => {
    const result = calcTotalGovernmentContributions(25000, sssTable, philHealthTable, pagIbigTable);
    const sss = calcSssContribution(25000, sssTable);
    const philHealth = calcPhilHealthContribution(25000, philHealthTable);
    const pagIbig = calcPagIbigContribution(25000, pagIbigTable);

    expect(result.employee_total).toBeCloseTo(sss.employee_share + philHealth.employee_share + pagIbig.employee_share, 2);
    expect(result.employer_total).toBeCloseTo(sss.employer_share + philHealth.employer_share + pagIbig.employer_share, 2);
    expect(result.sss).toEqual(sss);
    expect(result.philHealth).toEqual(philHealth);
    expect(result.pagIbig).toEqual(pagIbig);
  });

  it("returns all zeros for empty tables", () => {
    const result = calcTotalGovernmentContributions(25000, [], [], []);
    expect(result.employee_total).toBe(0);
    expect(result.employer_total).toBe(0);
    expect(result.sss).toEqual({ employee_share: 0, employer_share: 0, total_contribution: 0 });
    expect(result.philHealth).toEqual({ employee_share: 0, employer_share: 0, monthly_premium: 0 });
    expect(result.pagIbig).toEqual({ employee_share: 0, employer_share: 0 });
  });

  it("computes accurate total for typical PH salary scenario", () => {
    const result = calcTotalGovernmentContributions(25000, sssTable, philHealthTable, pagIbigTable);
    // SSS: bracket 24750.01-999999999 → 1125 employee
    expect(result.sss.employee_share).toBe(1125);
    // PhilHealth: >10000 bracket → premium=900 → 450 employee
    expect(result.philHealth.employee_share).toBe(450);
    // Pag-IBIG: >1500 bracket → 2% capped at 100 → 100 employee
    expect(result.pagIbig.employee_share).toBe(100);

    expect(result.employee_total).toBe(1125 + 450 + 100);
    expect(result.employee_total).toBe(1675);
  });
});
