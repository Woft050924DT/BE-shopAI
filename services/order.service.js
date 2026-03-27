const { prisma } = require("../helper/prisma");

function toCurrencyNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value) {
  return Number(value.toFixed(2));
}

function buildOrderNumber() {
  const now = new Date();
  const compactDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${compactDate}-${randomPart}`;
}

function mapOrder(order) {
  return {
    id: order.order_id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    shippingStatus: order.shipping_status,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    shippingAddress: {
      line1: order.shipping_address_line1,
      line2: order.shipping_address_line2,
      city: order.shipping_city,
      district: order.shipping_district,
      ward: order.shipping_ward,
      postalCode: order.shipping_postal_code,
      country: order.shipping_country,
    },
    billingAddress: {
      line1: order.billing_address_line1,
      line2: order.billing_address_line2,
      city: order.billing_city,
      district: order.billing_district,
      ward: order.billing_ward,
      postalCode: order.billing_postal_code,
      country: order.billing_country,
    },
    subtotal: order.subtotal,
    shippingFee: order.shipping_fee,
    taxAmount: order.tax_amount,
    discountAmount: order.discount_amount,
    totalAmount: order.total_amount,
    paymentMethod: order.payment_method,
    shippingMethod: order.shipping_method,
    notes: order.notes,
    createdAt: order.created_at,
    items: (order.order_items || []).map((item) => ({
      id: item.order_item_id,
      productId: item.product_id,
      variantId: item.variant_id,
      productName: item.product_name,
      variantName: item.variant_name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
    })),
  };
}

function validateOrderPayload(payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (items.length === 0) {
    return "Đơn hàng phải có ít nhất 1 sản phẩm";
  }

  const requiredFields = [
    "customerName",
    "customerEmail",
    "shippingAddressLine1",
    "shippingCity",
  ];

  for (const field of requiredFields) {
    if (!String(payload[field] || "").trim()) {
      return "Thiếu thông tin người nhận hàng";
    }
  }

  for (const item of items) {
    const quantity = Number.parseInt(item.quantity, 10);
    if (!item.productId || !Number.isInteger(quantity) || quantity <= 0) {
      return "Danh sách sản phẩm không hợp lệ";
    }
  }

  return null;
}

async function createOrder(payload) {
  const validationError = validateOrderPayload(payload);
  if (validationError) {
    return { status: 400, payload: { message: validationError } };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const normalizedItems = payload.items.map((item) => ({
        productId: String(item.productId),
        variantId: item.variantId ? String(item.variantId) : null,
        quantity: Number.parseInt(item.quantity, 10),
      }));

      const preparedItems = [];

      for (const item of normalizedItems) {
        const product = await tx.products.findFirst({
          where: {
            product_id: item.productId,
            status: "published",
          },
          include: {
            product_variants: {
              where: item.variantId
                ? {
                    variant_id: item.variantId,
                    is_active: true,
                  }
                : { is_active: true },
            },
          },
        });

        if (!product) {
          throw new Error(`Sản phẩm ${item.productId} không tồn tại hoặc chưa mở bán`);
        }

        const selectedVariant = item.variantId
          ? product.product_variants[0] || null
          : null;

        if (item.variantId && !selectedVariant) {
          throw new Error(`Biến thể ${item.variantId} không hợp lệ`);
        }

        const stockQuantity = selectedVariant
          ? selectedVariant.stock_quantity ?? 0
          : null;

        if (stockQuantity !== null && stockQuantity < item.quantity) {
          throw new Error(`Sản phẩm ${product.name} không đủ tồn kho`);
        }

        const unitPrice = roundMoney(
          Number(selectedVariant?.price ?? product.price)
        );
        const totalPrice = roundMoney(unitPrice * item.quantity);

        preparedItems.push({
          product,
          variant: selectedVariant,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        });
      }

      const subtotal = roundMoney(
        preparedItems.reduce((sum, item) => sum + item.totalPrice, 0)
      );
      const shippingFee = roundMoney(toCurrencyNumber(payload.shippingFee, 0));
      const taxAmount = roundMoney(toCurrencyNumber(payload.taxAmount, 0));
      const discountAmount = roundMoney(
        toCurrencyNumber(payload.discountAmount, 0)
      );
      const totalAmount = roundMoney(
        subtotal + shippingFee + taxAmount - discountAmount
      );

      if (totalAmount < 0) {
        throw new Error("Tổng tiền đơn hàng không hợp lệ");
      }

      const createdOrder = await tx.orders.create({
        data: {
          order_number: buildOrderNumber(),
          user_id: payload.userId ? String(payload.userId) : null,
          status: "pending",
          payment_status: "pending",
          shipping_status: "pending",
          customer_name: String(payload.customerName).trim(),
          customer_email: String(payload.customerEmail).trim().toLowerCase(),
          customer_phone: payload.customerPhone
            ? String(payload.customerPhone).trim()
            : null,
          shipping_address_line1: String(payload.shippingAddressLine1).trim(),
          shipping_address_line2: payload.shippingAddressLine2
            ? String(payload.shippingAddressLine2).trim()
            : null,
          shipping_city: String(payload.shippingCity).trim(),
          shipping_district: payload.shippingDistrict
            ? String(payload.shippingDistrict).trim()
            : null,
          shipping_ward: payload.shippingWard
            ? String(payload.shippingWard).trim()
            : null,
          shipping_postal_code: payload.shippingPostalCode
            ? String(payload.shippingPostalCode).trim()
            : null,
          shipping_country: payload.shippingCountry
            ? String(payload.shippingCountry).trim()
            : "Vietnam",
          billing_address_line1: payload.billingAddressLine1
            ? String(payload.billingAddressLine1).trim()
            : String(payload.shippingAddressLine1).trim(),
          billing_address_line2: payload.billingAddressLine2
            ? String(payload.billingAddressLine2).trim()
            : null,
          billing_city: payload.billingCity
            ? String(payload.billingCity).trim()
            : String(payload.shippingCity).trim(),
          billing_district: payload.billingDistrict
            ? String(payload.billingDistrict).trim()
            : payload.shippingDistrict
              ? String(payload.shippingDistrict).trim()
              : null,
          billing_ward: payload.billingWard
            ? String(payload.billingWard).trim()
            : payload.shippingWard
              ? String(payload.shippingWard).trim()
              : null,
          billing_postal_code: payload.billingPostalCode
            ? String(payload.billingPostalCode).trim()
            : payload.shippingPostalCode
              ? String(payload.shippingPostalCode).trim()
              : null,
          billing_country: payload.billingCountry
            ? String(payload.billingCountry).trim()
            : payload.shippingCountry
              ? String(payload.shippingCountry).trim()
              : "Vietnam",
          subtotal,
          shipping_fee: shippingFee,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          coupon_code: payload.couponCode ? String(payload.couponCode).trim() : null,
          payment_method: payload.paymentMethod
            ? String(payload.paymentMethod).trim()
            : "cod",
          shipping_method: payload.shippingMethod
            ? String(payload.shippingMethod).trim()
            : "standard",
          notes: payload.notes ? String(payload.notes).trim() : null,
          order_items: {
            create: preparedItems.map((item) => ({
              product_id: item.product.product_id,
              variant_id: item.variant?.variant_id || null,
              product_name: item.product.name,
              variant_name: item.variant?.name || null,
              sku: item.variant?.sku || item.product.sku || null,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total_price: item.totalPrice,
            })),
          },
          order_status_history: {
            create: {
              status: "pending",
              created_by: payload.userId ? String(payload.userId) : null,
              notes: "Đơn hàng được tạo",
            },
          },
        },
        include: {
          order_items: true,
        },
      });

      for (const item of preparedItems) {
        if (item.variant) {
          const nextStock = (item.variant.stock_quantity ?? 0) - item.quantity;

          await tx.product_variants.update({
            where: { variant_id: item.variant.variant_id },
            data: {
              stock_quantity: nextStock,
            },
          });

          await tx.inventory_transactions.create({
            data: {
              product_id: item.product.product_id,
              variant_id: item.variant.variant_id,
              transaction_type: "sale",
              quantity: -item.quantity,
              reference_id: createdOrder.order_id,
              created_by: payload.userId ? String(payload.userId) : null,
              notes: `Bán hàng cho đơn ${createdOrder.order_number}`,
            },
          });
        }
      }

      return createdOrder;
    });

    return {
      status: 201,
      payload: {
        message: "Tạo đơn hàng thành công",
        order: mapOrder(order),
      },
    };
  } catch (error) {
    return {
      status: 400,
      payload: {
        message: error.message || "Không thể tạo đơn hàng",
      },
    };
  }
}

async function getOrderDetail(identifier) {
  const orderId = String(identifier || "").trim();

  if (!orderId) {
    return { status: 400, payload: { message: "Thiếu mã đơn hàng" } };
  }

  const order = await prisma.orders.findFirst({
    where: {
      OR: [{ order_id: orderId }, { order_number: orderId }],
    },
    include: {
      order_items: true,
    },
  });

  if (!order) {
    return { status: 404, payload: { message: "Không tìm thấy đơn hàng" } };
  }

  return {
    status: 200,
    payload: {
      message: "Lấy chi tiết đơn hàng thành công",
      order: mapOrder(order),
    },
  };
}

module.exports = {
  createOrder,
  getOrderDetail,
};
