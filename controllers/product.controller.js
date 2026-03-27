const AppError = require("../utils/appError");
const { listProducts, getProductDetail } = require("../services/product.service");

async function getProducts(req, res) {
  const result = await listProducts(req.query);

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  return res.status(result.status).json({ success: true, ...result.payload });
}

async function getProductByIdentifier(req, res) {
  const result = await getProductDetail(req.params.identifier);

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  return res.status(result.status).json({ success: true, ...result.payload });
}

module.exports = {
  getProducts,
  getProductByIdentifier,
};
