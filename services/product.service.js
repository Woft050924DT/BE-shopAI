const { prisma } = require("../helper/prisma");

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return undefined;
}

function normalizeStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || "published";
}

function mapVariant(variant) {
  if (!variant) {
    return null;
  }

  return {
    id: variant.variant_id,
    name: variant.name,
    sku: variant.sku,
    price: variant.price,
    comparePrice: variant.compare_price,
    stockQuantity: variant.stock_quantity,
    imageUrl: variant.image_url,
    options: [
      variant.option1_name && variant.option1_value
        ? { name: variant.option1_name, value: variant.option1_value }
        : null,
      variant.option2_name && variant.option2_value
        ? { name: variant.option2_name, value: variant.option2_value }
        : null,
      variant.option3_name && variant.option3_value
        ? { name: variant.option3_name, value: variant.option3_value }
        : null,
    ].filter(Boolean),
  };
}

function mapProduct(product) {
  return {
    id: product.product_id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.short_description,
    description: product.description,
    price: product.price,
    comparePrice: product.compare_price,
    status: product.status,
    featured: product.featured,
    bestSeller: product.best_seller,
    newArrival: product.new_arrival,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    category: product.categories
      ? {
          id: product.categories.category_id,
          name: product.categories.name,
          slug: product.categories.slug,
        }
      : null,
    brand: product.brands
      ? {
          id: product.brands.brand_id,
          name: product.brands.name,
          slug: product.brands.slug,
          logoUrl: product.brands.logo_url,
        }
      : null,
    images: (product.product_images || []).map((image) => ({
      id: image.image_id,
      imageUrl: image.image_url,
      altText: image.alt_text,
      isPrimary: image.is_primary,
      displayOrder: image.display_order,
    })),
    variants: (product.product_variants || []).map(mapVariant),
  };
}

async function listProducts(query) {
  const page = toPositiveInt(query.page, DEFAULT_PAGE);
  const pageSize = Math.min(
    toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );
  const search = String(query.search || "").trim();
  const status = normalizeStatus(query.status);
  const featured = normalizeBoolean(query.featured);
  const bestSeller = normalizeBoolean(query.bestSeller);
  const newArrival = normalizeBoolean(query.newArrival);

  const where = {
    ...(status === "all" ? {} : { status }),
    ...(query.categoryId ? { category_id: String(query.categoryId) } : {}),
    ...(query.brandId ? { brand_id: String(query.brandId) } : {}),
    ...(featured !== undefined ? { featured } : {}),
    ...(bestSeller !== undefined ? { best_seller: bestSeller } : {}),
    ...(newArrival !== undefined ? { new_arrival: newArrival } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { slug: { contains: search } },
            { sku: { contains: search } },
            { short_description: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.products.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ featured: "desc" }, { created_at: "desc" }],
      include: {
        categories: true,
        brands: true,
        product_images: {
          orderBy: [{ is_primary: "desc" }, { display_order: "asc" }],
        },
        product_variants: {
          where: { is_active: true },
          orderBy: { created_at: "asc" },
        },
      },
    }),
    prisma.products.count({ where }),
  ]);

  return {
    status: 200,
    payload: {
      message: "Lấy danh sách sản phẩm thành công",
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
      items: items.map(mapProduct),
    },
  };
}

async function getProductDetail(identifier) {
  const lookup = String(identifier || "").trim();

  if (!lookup) {
    return { status: 400, payload: { message: "Thiếu mã sản phẩm" } };
  }

  const product = await prisma.products.findFirst({
    where: {
      status: "published",
      OR: [{ product_id: lookup }, { slug: lookup }],
    },
    include: {
      categories: true,
      brands: true,
      product_images: {
        orderBy: [{ is_primary: "desc" }, { display_order: "asc" }],
      },
      product_variants: {
        where: { is_active: true },
        orderBy: { created_at: "asc" },
      },
    },
  });

  if (!product) {
    return { status: 404, payload: { message: "Không tìm thấy sản phẩm" } };
  }

  return {
    status: 200,
    payload: {
      message: "Lấy chi tiết sản phẩm thành công",
      item: mapProduct(product),
    },
  };
}

module.exports = {
  listProducts,
  getProductDetail,
};
