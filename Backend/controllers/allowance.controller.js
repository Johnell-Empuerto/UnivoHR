const allowanceModel = require("../models/allowance.model");

const getAllowanceTypes = async (req, res, next) => {
  try {
    const data = await allowanceModel.getAllowanceTypes();
    res.json({ data });
  } catch (err) { next(err); }
};

const createAllowanceType = async (req, res, next) => {
  try {
    const { name, description, default_amount, is_taxable, is_recurring, frequency } = req.body;
    const data = await allowanceModel.createAllowanceType(name, description, default_amount, is_taxable, is_recurring, frequency);
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

const updateAllowanceType = async (req, res, next) => {
  try {
    const data = await allowanceModel.updateAllowanceType(req.params.id, req.body);
    res.json({ data });
  } catch (err) { next(err); }
};

const deleteAllowanceType = async (req, res, next) => {
  try {
    await allowanceModel.deleteAllowanceType(req.params.id);
    res.json({ message: "Allowance type deleted" });
  } catch (err) { next(err); }
};

const getEmployeeAllowances = async (req, res, next) => {
  try {
    const data = await allowanceModel.getEmployeeAllowances(req.params.employee_id);
    res.json({ data });
  } catch (err) { next(err); }
};

const createEmployeeAllowance = async (req, res, next) => {
  try {
    const { employee_id, allowance_type_id, amount, effective_date, end_date } = req.body;
    const data = await allowanceModel.createEmployeeAllowance(employee_id, allowance_type_id, amount, effective_date, end_date);
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

const updateEmployeeAllowance = async (req, res, next) => {
  try {
    const { amount, end_date } = req.body;
    const data = await allowanceModel.updateEmployeeAllowance(req.params.id, amount, end_date);
    res.json({ data });
  } catch (err) { next(err); }
};

const deleteEmployeeAllowance = async (req, res, next) => {
  try {
    await allowanceModel.deleteEmployeeAllowance(req.params.id);
    res.json({ message: "Employee allowance deleted" });
  } catch (err) { next(err); }
};

module.exports = {
  getAllowanceTypes,
  createAllowanceType,
  updateAllowanceType,
  deleteAllowanceType,
  getEmployeeAllowances,
  createEmployeeAllowance,
  updateEmployeeAllowance,
  deleteEmployeeAllowance,
};
