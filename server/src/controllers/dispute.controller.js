const DisputeService = require('../services/dispute.service');

exports.create = async (req, res, next) => {
  try {
    const dispute = await DisputeService.create(req.params.matchId, req.user._id, req.body);
    res.status(201).json({ success: true, data: dispute });
  } catch (err) { next(err); }
};

exports.getByMatch = async (req, res, next) => {
  try {
    const disputes = await DisputeService.getByMatch(req.params.matchId);
    res.json({ success: true, data: disputes });
  } catch (err) { next(err); }
};

exports.getMyDisputes = async (req, res, next) => {
  try {
    const disputes = await DisputeService.getUserDisputes(req.user._id, req.query);
    res.json({ success: true, data: disputes });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const dispute = await DisputeService.getById(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    res.json({ success: true, data: dispute });
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const dispute = await DisputeService.addComment(req.params.id, req.user._id, req.body.text);
    res.json({ success: true, data: dispute });
  } catch (err) { next(err); }
};

exports.resolve = async (req, res, next) => {
  try {
    const dispute = await DisputeService.resolve(req.params.id, req.user._id, req.body);
    res.json({ success: true, data: dispute });
  } catch (err) { next(err); }
};

exports.reject = async (req, res, next) => {
  try {
    const dispute = await DisputeService.reject(req.params.id, req.user._id, req.body.reason);
    res.json({ success: true, data: dispute });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const disputes = await DisputeService.getAll(req.query);
    res.json({ success: true, data: disputes });
  } catch (err) { next(err); }
};
