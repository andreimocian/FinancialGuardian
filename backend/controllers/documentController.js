const fs = require('fs');
const path = require('path');
const Document = require('../models/documentModel');
const Obligation = require('../models/obligationModel');
const { extractObligationFromPdf } = require('../services/pdfExtractor');

const VALID_TYPES = ['lease', 'utility'];
const BACKEND_ROOT = path.join(__dirname, '..');

const toRelative = (absPath) =>
    path.relative(BACKEND_ROOT, absPath).split(path.sep).join('/');

const toAbsolute = (relPath) =>
    path.isAbsolute(relPath) ? relPath : path.resolve(BACKEND_ROOT, relPath);

exports.uploadDocument = async (req, res) => {
    let document;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded (field name: file)' });
        }

        const { type } = req.body;
        if (!VALID_TYPES.includes(type)) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
        }

        document = await Document.create({
            userId: req.user._id,
            filename: req.file.originalname,
            storedPath: toRelative(req.file.path),
            mimeType: req.file.mimetype,
            type,
            status: 'pending',
        });

        let extracted;
        try {
            extracted = await extractObligationFromPdf(req.file.path, type);
        } catch (err) {
            document.status = 'failed';
            document.extractionError = err.message;
            await document.save();
            return res.status(502).json({
                message: 'PDF extraction failed',
                error: err.message,
                document,
            });
        }

        const obligation = await Obligation.create({
            userId: req.user._id,
            documentId: document._id,
            type,
            provider: extracted.provider,
            amount: extracted.amount,
            currency: extracted.currency || 'EUR',
            dueDate: extracted.dueDate,
            description: extracted.description,
            confidence: extracted.confidence,
        });

        document.status = 'extracted';
        document.obligationId = obligation._id;
        await document.save();

        res.status(201).json({ status: 'success', document, obligation });
    } catch (err) {
        if (req.file) {
            await fs.promises.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ message: err.message });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const documents = await Document
            .find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', count: documents.length, documents });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getDocument = async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!document) return res.status(404).json({ message: 'Document not found' });

        const obligation = document.obligationId
            ? await Obligation.findById(document.obligationId)
            : null;

        res.status(200).json({ status: 'success', document, obligation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const document = await Document.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!document) return res.status(404).json({ message: 'Document not found' });

        if (document.obligationId) {
            await Obligation.findByIdAndDelete(document.obligationId);
        }
        await fs.promises.unlink(toAbsolute(document.storedPath)).catch(() => {});

        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
