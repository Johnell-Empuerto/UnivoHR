const branchService = require("../services/branch.service");
const { getUserBranchIds } = require("../utils/branchAccess");

const getAll = async (req, res) => {
  try {
    const branches = await branchService.getAll();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActive = async (req, res) => {
  try {
    let branches = await branchService.getActive();

    // Non-ADMIN users only see assigned branches
    if (req.user && req.user.role !== "ADMIN") {
      const allowed = await getUserBranchIds(req.user.id);
      if (allowed.length > 0) {
        branches = branches.filter((b) => allowed.includes(b.id));
      } else {
        branches = [];
      }
    }

    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const branch = await branchService.getById(req.params.id);
    res.json(branch);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const branch = await branchService.create(req.body);
    res.status(201).json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const branch = await branchService.update(req.params.id, req.body);
    res.json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const setActive = async (req, res) => {
  try {
    const { is_active } = req.body;
    const branch = await branchService.setActive(req.params.id, is_active);
    res.json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  setActive,
};
