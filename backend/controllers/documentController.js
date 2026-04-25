const Document = require('../models/documentModel');
const Obligation = require('../models/obligationModel');
const Contract = require('../models/contractModel');
const {
    extractObligationFromPdf,
    extractContractFromPdf,
} = require('../services/pdfExtractor');

const VALID_TYPES = ['lease', 'utility', 'contract'];

exports.uploadDocument = async (req, res) => {
    let document;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded (field name: file)' });
        }

        const { type } = req.body;
        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
        }

        document = await Document.create({
            userId: req.user._id,
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            type,
            status: 'pending',
        });

        if (type === 'contract') {
            let extracted;
            try {
                extracted = await extractContractFromPdf(req.file.buffer);
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

            const contract = await Contract.create({
                userId: req.user._id,
                documentId: document._id,
                provider: extracted.provider,
                startDate: extracted.startDate,
                endDate: extracted.endDate,
                noticePeriodDays: extracted.noticePeriodDays,
                monthlyAmount: extracted.monthlyAmount,
                currency: extracted.currency || 'EUR',
                cancellationTerms: extracted.cancellationTerms,
                autoRenew: extracted.autoRenew,
                description: extracted.description,
                confidence: extracted.confidence,
            });

            document.status = 'extracted';
            document.contractId = contract._id;
            await document.save();

            return res.status(201).json({ status: 'success', document, contract });
        }

        let extracted;
        try {
            extracted = await extractObligationFromPdf(req.file.buffer, type);
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
        const contract = document.contractId
            ? await Contract.findById(document.contractId)
            : null;

        res.status(200).json({ status: 'success', document, obligation, contract });
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
        if (document.contractId) {
            await Contract.findByIdAndDelete(document.contractId);
        }

        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
