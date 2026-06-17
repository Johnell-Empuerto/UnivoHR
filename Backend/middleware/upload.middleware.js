// middleware/upload.middleware.js
const multer = require("multer");
const path = require("path");

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
];

const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".jpg", ".jpeg", ".png",
];

const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
];

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/calendar/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "calendar-" + uniqueSuffix + ext);
  },
});

const getSanitizedExt = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) return ext;
  if (ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) return ext;
  return "";
};

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel and CSV files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
module.exports.ALLOWED_DOCUMENT_EXTENSIONS = ALLOWED_DOCUMENT_EXTENSIONS;
module.exports.ALLOWED_DOCUMENT_MIME_TYPES = ALLOWED_DOCUMENT_MIME_TYPES;
module.exports.getSanitizedExt = getSanitizedExt;
