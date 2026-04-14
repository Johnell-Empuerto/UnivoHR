const finalPayService = require("../services/finalPay.service");

// Get employees eligible for final pay
const getEmployeesForFinalPay = async (req, res) => {
  try {
    const employees = await finalPayService.getEmployeesForFinalPay();
    res.json({
      success: true,
      data: employees,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Calculate final pay (preview)
const calculateFinalPay = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await finalPayService.calculateFinalPay(employeeId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Process final pay
const processFinalPay = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const processedBy = req.user.id;
    const result = await finalPayService.processFinalPay(
      employeeId,
      processedBy,
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get final pay history (NEW)
const getFinalPayHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const result = await finalPayService.getFinalPayHistory(
      page,
      limit,
      search,
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get final pay by ID
const getFinalPayById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await finalPayService.getFinalPayById(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download final pay slip
const downloadFinalPaySlip = async (req, res) => {
  try {
    const { id } = req.params;

    //  Call service that generates PDF
    await finalPayService.downloadFinalPaySlip(id, res);
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getEmployeesForFinalPay,
  calculateFinalPay,
  processFinalPay,
  getFinalPayHistory,
  getFinalPayById,
  downloadFinalPaySlip,
};
