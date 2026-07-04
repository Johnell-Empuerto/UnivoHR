const m = require("../models/contributionTable.model");

const getSssTable = async (req, res, next) => {
  try {
    const data = await m.getSssTable();
    res.json({ data });
  } catch (err) { next(err); }
};

const createSssRow = async (req, res, next) => {
  try {
    const { salary_from, salary_to, employer_share, employee_share, total_contribution } = req.body;
    const data = await m.createSssRow(salary_from, salary_to, employer_share, employee_share, total_contribution);
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

const updateSssRow = async (req, res, next) => {
  try {
    const data = await m.updateSssRow(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Row not found" });
    res.json({ data });
  } catch (err) { next(err); }
};

const deleteSssRow = async (req, res, next) => {
  try {
    const data = await m.deleteSssRow(req.params.id);
    if (!data) return res.status(404).json({ message: "Row not found" });
    res.json({ message: "Row deleted" });
  } catch (err) { next(err); }
};

const getPhilHealthTable = async (req, res, next) => {
  try {
    const data = await m.getPhilHealthTable();
    res.json({ data });
  } catch (err) { next(err); }
};

const createPhilHealthRow = async (req, res, next) => {
  try {
    const { salary_from, salary_to, employee_rate, employer_rate, monthly_premium } = req.body;
    const data = await m.createPhilHealthRow(salary_from, salary_to, employee_rate, employer_rate, monthly_premium);
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

const updatePhilHealthRow = async (req, res, next) => {
  try {
    const data = await m.updatePhilHealthRow(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Row not found" });
    res.json({ data });
  } catch (err) { next(err); }
};

const deletePhilHealthRow = async (req, res, next) => {
  try {
    const data = await m.deletePhilHealthRow(req.params.id);
    if (!data) return res.status(404).json({ message: "Row not found" });
    res.json({ message: "Row deleted" });
  } catch (err) { next(err); }
};

const getPagIbigTable = async (req, res, next) => {
  try {
    const data = await m.getPagIbigTable();
    res.json({ data });
  } catch (err) { next(err); }
};

const createPagIbigRow = async (req, res, next) => {
  try {
    const { salary_from, salary_to, employee_share, employer_share } = req.body;
    const data = await m.createPagIbigRow(salary_from, salary_to, employee_share, employer_share);
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

const updatePagIbigRow = async (req, res, next) => {
  try {
    const data = await m.updatePagIbigRow(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Row not found" });
    res.json({ data });
  } catch (err) { next(err); }
};

const deletePagIbigRow = async (req, res, next) => {
  try {
    const data = await m.deletePagIbigRow(req.params.id);
    if (!data) return res.status(404).json({ message: "Row not found" });
    res.json({ message: "Row deleted" });
  } catch (err) { next(err); }
};

const getWithholdingTaxTable = async (req, res, next) => {
  try {
    const data = await m.getWithholdingTaxTable();
    res.json({ data });
  } catch (err) { next(err); }
};

const createTaxRow = async (req, res, next) => {
  try {
    const { salary_from, salary_to, tax_base, percentage_over_base, exempt_amount } = req.body;
    const data = await m.createTaxRow(salary_from, salary_to, tax_base, percentage_over_base, exempt_amount);
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

const updateTaxRow = async (req, res, next) => {
  try {
    const data = await m.updateTaxRow(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Row not found" });
    res.json({ data });
  } catch (err) { next(err); }
};

const deleteTaxRow = async (req, res, next) => {
  try {
    const data = await m.deleteTaxRow(req.params.id);
    if (!data) return res.status(404).json({ message: "Row not found" });
    res.json({ message: "Row deleted" });
  } catch (err) { next(err); }
};

module.exports = {
  getSssTable, createSssRow, updateSssRow, deleteSssRow,
  getPhilHealthTable, createPhilHealthRow, updatePhilHealthRow, deletePhilHealthRow,
  getPagIbigTable, createPagIbigRow, updatePagIbigRow, deletePagIbigRow,
  getWithholdingTaxTable, createTaxRow, updateTaxRow, deleteTaxRow,
};
