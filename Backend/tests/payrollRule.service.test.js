jest.mock("../models/payrollRule.model", () => ({
  getAll: jest.fn(),
  getByKey: jest.fn(),
  update: jest.fn(),
}));

const payrollRuleModel = require("../models/payrollRule.model");
const { getAll, getByKey, update } = require("../services/payrollRule.service");

describe("payrollRule.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAll delegates", async () => {
    payrollRuleModel.getAll.mockResolvedValue([{ rule_key: "tax_table", rule_value: "TRAIN" }]);
    expect(await getAll()).toEqual([{ rule_key: "tax_table", rule_value: "TRAIN" }]);
  });

  it("getByKey delegates", async () => {
    payrollRuleModel.getByKey.mockResolvedValue({ rule_value: "TRAIN" });
    expect(await getByKey("tax_table")).toEqual({ rule_value: "TRAIN" });
  });

  it("update delegates", async () => {
    payrollRuleModel.update.mockResolvedValue({ rule_key: "tax_table", rule_value: "NEW" });
    expect(await update("tax_table", "NEW")).toEqual({ rule_key: "tax_table", rule_value: "NEW" });
  });
});
