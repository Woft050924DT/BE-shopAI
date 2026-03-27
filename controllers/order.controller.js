const AppError = require("../utils/appError");
const { createOrder, getOrderDetail } = require("../services/order.service");

async function create(req, res) {
  const result = await createOrder(req.body);

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  return res.status(result.status).json({ success: true, ...result.payload });
}

async function getDetail(req, res) {
  const result = await getOrderDetail(req.params.identifier);

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  return res.status(result.status).json({ success: true, ...result.payload });
}

module.exports = {
  create,
  getDetail,
};
