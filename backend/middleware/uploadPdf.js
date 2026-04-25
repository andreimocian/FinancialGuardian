const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userDir = path.join(UPLOAD_ROOT, String(req.user._id));
        fs.promises.mkdir(userDir, { recursive: true })
            .then(() => cb(null, userDir))
            .catch(cb);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.pdf';
        const stamp = Date.now();
        const rand = Math.random().toString(36).slice(2, 10);
        cb(null, `${stamp}-${rand}${ext}`);
    },
});

const uploadPdf = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed'));
        }
        cb(null, true);
    },
});

module.exports = uploadPdf;
