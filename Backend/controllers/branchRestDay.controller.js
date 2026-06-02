const branchRestDayService = require("../services/branchRestDay.service");

const getAll = async (req, res) => {
  try {
    const rows = await branchRestDayService.getAll();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getByBranch = async (req, res) => {
  try {
    const rows = await branchRestDayService.getByBranchId(req.params.branchId);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const row = await branchRestDayService.create({
      branch_id: req.params.branchId,
      day_of_week: req.body.day_of_week,
    });
    res.status(201).json(row);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const row = await branchRestDayService.remove(req.params.id);
    if (!row) return res.status(404).json({ message: "Branch rest day not found" });
    res.json({ message: "Branch rest day removed", data: row });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setActive = async (req, res) => {
  try {
    const { is_active } = req.body;
    const row = await branchRestDayService.setActive(req.params.id, is_active);
    if (!row) return res.status(404).json({ message: "Branch rest day not found" });
    res.json(row);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getByBranch,
  create,
  remove,
  setActive,
};
