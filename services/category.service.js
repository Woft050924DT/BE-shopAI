const { prisma } = require("../helper/prisma");

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") {
    return fallback;
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

  return fallback;
}

function mapCategoryBase(category) {
  return {
    id: category.category_id,
    parentId: category.parent_id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.image_url,
    icon: category.icon,
    displayOrder: category.display_order,
    metaTitle: category.meta_title,
    metaDescription: category.meta_description,
    metaKeywords: category.meta_keywords,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
    productCount: Array.isArray(category.products) ? category.products.length : 0,
  };
}

async function createCategory(payload = {}) {
  const name = String(payload.name || "").trim();
  const parentId = String(payload.parentId || "").trim();
  const slug = String(payload.slug || "").trim() || slugify(name);

  if (!name) {
    return { status: 400, payload: { message: "Ten danh muc la bat buoc" } };
  }

  if (!slug) {
    return { status: 400, payload: { message: "Slug danh muc khong hop le" } };
  }

  const [existingCategory, parentCategory] = await Promise.all([
    prisma.categories.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
      select: {
        category_id: true,
        name: true,
        slug: true,
      },
    }),
    parentId
      ? prisma.categories.findFirst({
          where: {
            category_id: parentId,
            is_active: true,
          },
          select: {
            category_id: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (existingCategory) {
    return {
      status: 409,
      payload: { message: "Danh muc da ton tai voi ten hoac slug nay" },
    };
  }

  if (parentId && !parentCategory) {
    return { status: 400, payload: { message: "Danh muc cha khong hop le" } };
  }

  const category = await prisma.categories.create({
    data: {
      parent_id: parentId || null,
      name,
      slug,
      description: payload.description ? String(payload.description).trim() : null,
      image_url: payload.imageUrl ? String(payload.imageUrl).trim() : null,
      icon: payload.icon ? String(payload.icon).trim() : null,
      display_order: Number.isInteger(Number(payload.displayOrder))
        ? Number(payload.displayOrder)
        : 0,
      is_active: parseBoolean(payload.isActive, true),
      meta_title: payload.metaTitle ? String(payload.metaTitle).trim() : null,
      meta_description: payload.metaDescription
        ? String(payload.metaDescription).trim()
        : null,
      meta_keywords: payload.metaKeywords ? String(payload.metaKeywords).trim() : null,
    },
    include: {
      products: {
        where: { status: "published" },
        select: { product_id: true },
      },
    },
  });

  return {
    status: 201,
    payload: {
      message: "Tao danh muc thanh cong",
      item: {
        ...mapCategoryBase(category),
        children: [],
      },
    },
  };
}

function buildCategoryTree(categories) {
  const nodes = categories.map((category) => ({
    ...mapCategoryBase(category),
    children: [],
  }));

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const roots = [];

  for (const node of nodes) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId).children.push(node);
      continue;
    }

    roots.push(node);
  }

  const sortNodes = (items) => {
    items.sort((a, b) => {
      const orderA = Number.isFinite(a.displayOrder) ? a.displayOrder : 0;
      const orderB = Number.isFinite(b.displayOrder) ? b.displayOrder : 0;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.name.localeCompare(b.name);
    });

    items.forEach((item) => sortNodes(item.children));
  };

  sortNodes(roots);

  return roots;
}

async function listCategories(query = {}) {
  const parentId = String(query.parentId || "").trim();
  const tree = String(query.tree || "true").trim().toLowerCase() !== "false";

  const categories = await prisma.categories.findMany({
    where: {
      is_active: true,
      ...(parentId ? { parent_id: parentId } : {}),
    },
    orderBy: [{ display_order: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: { status: "published" },
        select: { product_id: true },
      },
    },
  });

  return {
    status: 200,
    payload: {
      message: "Lay danh sach danh muc thanh cong",
      items: tree && !parentId
        ? buildCategoryTree(categories)
        : categories.map((category) => ({
            ...mapCategoryBase(category),
            children: [],
          })),
    },
  };
}

async function getCategoryDetail(identifier) {
  const lookup = String(identifier || "").trim();

  if (!lookup) {
    return { status: 400, payload: { message: "Thieu ma danh muc" } };
  }

  const category = await prisma.categories.findFirst({
    where: {
      is_active: true,
      OR: [{ category_id: lookup }, { slug: lookup }],
    },
    include: {
      categories: true,
      other_categories: {
        where: { is_active: true },
        orderBy: [{ display_order: "asc" }, { name: "asc" }],
        include: {
          products: {
            where: { status: "published" },
            select: { product_id: true },
          },
        },
      },
      products: {
        where: { status: "published" },
        select: { product_id: true },
      },
    },
  });

  if (!category) {
    return { status: 404, payload: { message: "Khong tim thay danh muc" } };
  }

  return {
    status: 200,
    payload: {
      message: "Lay chi tiet danh muc thanh cong",
      item: {
        ...mapCategoryBase(category),
        parent: category.categories
          ? {
              id: category.categories.category_id,
              name: category.categories.name,
              slug: category.categories.slug,
            }
          : null,
        children: category.other_categories.map((child) => ({
          ...mapCategoryBase(child),
          children: [],
        })),
      },
    },
  };
}

module.exports = {
  createCategory,
  listCategories,
  getCategoryDetail,
};
