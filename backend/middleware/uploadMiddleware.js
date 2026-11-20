import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 'uploads/' folder created.");
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpg|jpeg|png|webp|jfif|pjpeg|pjsig/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Broaden mimetype check to handle various JPEG subtypes
  const mimetype = file.mimetype.startsWith('image/') && (
    filetypes.test(file.mimetype.split('/')[1]) ||
    file.mimetype.includes('jpeg')
  );

  if (extname && mimetype) {
    cb(null, true);
  } else {
    console.error("❌ Upload Rejected:", {
      filename: file.originalname,
      mimetype: file.mimetype,
      extension: path.extname(file.originalname),
      reason: !extname ? "Invalid Extension" : "Invalid Mime-type"
    });
    cb(new Error(`File type not supported (${file.mimetype}). Please use JPG, PNG or WebP.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
});

export default upload;
