const contributionTableModel = require("../models/contributionTable.model");

const getSssTable = async (req, res, next) => {
  try {
    const data = await contributionTableModel.getSssTable();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

const getPhilHealthTable = async (req, res, next) => {
  try {
    const data = await contributionTableModel.getPhilHealthTable();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

const getPagIbigTable = async (req, res, next) => {
  try {
    const data = await contributionTableModel.getPagIbigTable();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

const getWithholdingTaxTable = async (req, res, next) => {
  try {
    const data = await contributionTableModel.getWithholdingTaxTable();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSssTable,
  getPhilHealthTable,
  getPagIbigTable,
  getWithholdingTaxTable,
};
