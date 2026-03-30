const AppError = require("../utils/appError");
const {
  createCategory,
  listCategories,
  getCategoryDetail,
} = require("../services/category.service");

async function create(req, res) {
  const result = await createCategory(req.body);

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  return res.status(result.status).json({ success: true, ...result.payload });
}

async function getCategories(req, res) {
  const result = await listCategories(req.query);

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  return res.status(result.status).json({ success: true, ...result.payload });
}

async function getCategoryByIdentifier(req, res) {
  const result = await getCategoryDetail(req.params.identifier);

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  return res.status(result.status).json({ success: true, ...result.payload });
}

module.exports = {
  create,
  getCategories,
  getCategoryByIdentifier,
};
