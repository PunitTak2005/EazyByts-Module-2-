import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists (with serverless read-only filesystem check)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;
const uploadDir = isServerless 
  ? path.join('/tmp', 'uploads', 'avatars')
  : path.join(__dirname, '..', '..', 'public', 'uploads', 'avatars');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create upload directory (read-only filesystem):', err.message);
}

// Use memory storage for serverless-safe avatar handling
const storage = multer.memoryStorage();

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Images Only! Allowed types: JPG, JPEG, PNG, WEBP'));
  }
}

// Init upload
export const uploadAvatarMiddleware = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});
