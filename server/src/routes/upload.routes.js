const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { Storage } = require('@google-cloud/storage');
const { authenticate } = require('../middleware/auth');

// Initialise GCS with service-account credentials from env vars
const gcs = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    type: 'service_account',
    project_id: process.env.GCS_PROJECT_ID,
    private_key_id: process.env.GCP_PRIVATE_KEY_ID,
    // dotenv stores \n as literal \\n   restore actual newlines
    private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.GCP_CLIENT_EMAIL,
    client_id: process.env.GCP_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  },
});

const bucket = gcs.bucket(process.env.GCS_BUCKET_NAME);

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const isValid =
    allowed.test(path.extname(file.originalname).toLowerCase()) &&
    allowed.test(file.mimetype.split('/')[1]);
  cb(isValid ? null : new Error('Only image files are allowed'), isValid);
};

// Buffer in memory so we can stream directly to GCS (no disk write)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (parseInt(process.env.UPLOAD_MAX_SIZE_MB, 10) || 5) * 1024 * 1024,
  },
  fileFilter,
});

// POST /api/v1/upload   upload a single image → GCS
router.post('/', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const ext = path.extname(req.file.originalname);
    const destName = `uploads/${crypto.randomUUID()}${ext}`;
    const blob = bucket.file(destName);

    await new Promise((resolve, reject) => {
      const stream = blob.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(req.file.buffer);
    });

    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destName}`;

    res.json({
      url: publicUrl,
      filename: destName,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

