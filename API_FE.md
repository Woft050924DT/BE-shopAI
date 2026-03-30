# API Cho FE

Base URL mac dinh:

```txt
http://localhost:5000
```

Tat ca API duoi day deu co prefix:

```txt
/api
```

## Response format chung

### Thanh cong

```json
{
  "success": true,
  "message": "...",
  "...": "du lieu khac"
}
```

### Loi

```json
{
  "success": false,
  "message": "...",
  "details": null
}
```

## 1. Health Check

### GET `/api/health`

Dung de kiem tra server co dang chay hay khong.

Response:

```json
{
  "success": true,
  "message": "OK"
}
```

## 2. Auth

Luu y:

- Sau khi `register` hoac `login` thanh cong, backend se tu set cookie `httpOnly` ten `access_token`
- FE can gui request kem cookie (`withCredentials: true` voi axios hoac `credentials: "include"` voi fetch)
- Role API su dung `user` va `admin` (du lieu DB cu `customer` se duoc map thanh `user`)

### POST `/api/auth/register`

Dang ky tai khoan.

Request body:

```json
{
  "fullName": "Nguyen Van A",
  "email": "vana@gmail.com",
  "password": "123456"
}
```

Response thanh cong:

```json
{
  "success": true,
  "message": "Dang ky thanh cong",  
  "token": "jwt_token",
  "user": {
    "id": "user-id",
    "fullName": "Nguyen Van A",
    "email": "vana@gmail.com",
    "role": "user",
    "createdAt": "2026-03-28T00:00:00.000Z"
  }
}
```

### POST `/api/auth/login`

Dang nhap tai khoan.

Request body:

```json
{
  "email": "vana@gmail.com",
  "password": "123456"
}
```

Response thanh cong:

```json
{
  "success": true,
  "message": "Dang nhap thanh cong",
  "token": "jwt_token",
  "user": {
    "id": "user-id",
    "fullName": "Nguyen Van A",
    "email": "vana@gmail.com",
    "role": "user",
    "createdAt": "2026-03-28T00:00:00.000Z"
  }
}
```

### POST `/api/auth/logout`

Xoa cookie dang nhap.

Response:

```json
{
  "success": true,
  "message": "Dang xuat thanh cong"
}
```

### GET `/api/auth/me`

Lay thong tin user hien tai tu cookie token.

Response:

```json
{
  "success": true,
  "message": "Lay thong tin tai khoan thanh cong",
  "user": {
    "id": "user-id",
    "fullName": "Nguyen Van A",
    "email": "vana@gmail.com",
    "role": "user",
    "createdAt": "2026-03-28T00:00:00.000Z"
  }
}
```

### GET `/api/auth/user`

Route yeu cau dang nhap va role `user` hoac `admin`.

### GET `/api/auth/admin`

Route yeu cau dang nhap va role `admin`.

## 3. Danh muc

### POST `/api/categories`

Tao danh muc moi. Route yeu cau dang nhap va role `admin`.

Request body:

```json
{
  "parentId": null,
  "name": "Dien thoai",
  "slug": "dien-thoai",
  "description": "Danh muc dien thoai",
  "imageUrl": "https://example.com/category-phone.jpg",
  "icon": "phone",
  "displayOrder": 1,
  "isActive": true,
  "metaTitle": "Dien thoai",
  "metaDescription": "Danh muc dien thoai",
  "metaKeywords": "dien thoai, smartphone"
}
```

Response:

```json
{
  "success": true,
  "message": "Tao danh muc thanh cong",
  "item": {
    "id": "category-id",
    "parentId": null,
    "name": "Dien thoai",
    "slug": "dien-thoai",
    "description": "Danh muc dien thoai",
    "imageUrl": "https://example.com/category-phone.jpg",
    "icon": "phone",
    "displayOrder": 1,
    "metaTitle": "Dien thoai",
    "metaDescription": "Danh muc dien thoai",
    "metaKeywords": "dien thoai, smartphone",
    "createdAt": "2026-03-28T00:00:00.000Z",
    "updatedAt": "2026-03-28T00:00:00.000Z",
    "productCount": 0,
    "children": []
  }
}
```

### GET `/api/categories`

Lay danh sach danh muc dang active.

Query params:

| Param | Bat buoc | Mo ta |
|---|---|---|
| `parentId` | Khong | Lay danh sach con truc tiep cua 1 danh muc |
| `tree` | Khong | Mac dinh `true`; neu `false` se tra danh sach phang |

Response:

```json
{
  "success": true,
  "message": "Lay danh sach danh muc thanh cong",
  "items": [
    {
      "id": "category-id",
      "parentId": null,
      "name": "Dien thoai",
      "slug": "dien-thoai",
      "description": "Danh muc dien thoai",
      "imageUrl": "https://...",
      "icon": "phone",
      "displayOrder": 1,
      "metaTitle": "Dien thoai",
      "metaDescription": "Danh muc dien thoai",
      "metaKeywords": "dien thoai, smartphone",
      "createdAt": "2026-03-28T00:00:00.000Z",
      "updatedAt": "2026-03-28T00:00:00.000Z",
      "productCount": 12,
      "children": [
        {
          "id": "child-category-id",
          "parentId": "category-id",
          "name": "IPhone",
          "slug": "iphone",
          "description": "Danh muc iPhone",
          "imageUrl": "https://...",
          "icon": "apple",
          "displayOrder": 1,
          "metaTitle": null,
          "metaDescription": null,
          "metaKeywords": null,
          "createdAt": "2026-03-28T00:00:00.000Z",
          "updatedAt": "2026-03-28T00:00:00.000Z",
          "productCount": 4,
          "children": []
        }
      ]
    }
  ]
}
```

### GET `/api/categories/:identifier`

Lay chi tiet 1 danh muc theo `category_id` hoac `slug`.

Response:

```json
{
  "success": true,
  "message": "Lay chi tiet danh muc thanh cong",
  "item": {
    "id": "category-id",
    "parentId": null,
    "name": "Dien thoai",
    "slug": "dien-thoai",
    "description": "Danh muc dien thoai",
    "imageUrl": "https://...",
    "icon": "phone",
    "displayOrder": 1,
    "metaTitle": "Dien thoai",
    "metaDescription": "Danh muc dien thoai",
    "metaKeywords": "dien thoai, smartphone",
    "createdAt": "2026-03-28T00:00:00.000Z",
    "updatedAt": "2026-03-28T00:00:00.000Z",
    "productCount": 12,
    "parent": null,
    "children": []
  }
}
```

## 4. San pham

### GET `/api/products`

Lay danh sach san pham cho nguoi dung chon mua.

Query params:

| Param | Bat buoc | Mo ta |
|---|---|---|
| `page` | Khong | Trang hien tai, mac dinh `1` |
| `pageSize` | Khong | So luong moi trang, mac dinh `12`, toi da `50` |
| `status` | Khong | Mac dinh `published`; co the dung `draft`, `archived`, `all` |
| `search` | Khong | Tim theo ten, slug, sku, mo ta ngan |
| `categoryId` | Khong | Loc theo danh muc |
| `brandId` | Khong | Loc theo thuong hieu |
| `featured` | Khong | Loc san pham noi bat, `true/false` |
| `bestSeller` | Khong | Loc san pham ban chay, `true/false` |
| `newArrival` | Khong | Loc san pham moi, `true/false` |

Vi du:

```txt
GET /api/products?page=1&pageSize=8&search=iphone&featured=true
```

```txt
GET /api/products?status=active
```

Response:

```json
{
  "success": true,
  "message": "Lay danh sach san pham thanh cong",
  "pagination": {
    "page": 1,
    "pageSize": 8,
    "total": 20,
    "totalPages": 3
  },
  "items": [
    {
      "id": "product-id",
      "name": "IPhone 15",
      "slug": "iphone-15",
      "sku": "IP15",
      "shortDescription": "Mo ta ngan",
      "description": "Mo ta chi tiet",
      "price": "20000000.00",
      "comparePrice": "22000000.00",
      "status": "published",
      "featured": true,
      "bestSeller": false,
      "newArrival": true,
      "createdAt": "2026-03-28T00:00:00.000Z",
      "updatedAt": "2026-03-28T00:00:00.000Z",
      "category": {
        "id": "category-id",
        "name": "Dien thoai",
        "slug": "dien-thoai"
      },
      "brand": {
        "id": "brand-id",
        "name": "Apple",
        "slug": "apple",
        "logoUrl": "https://..."
      },
      "images": [
        {
          "id": "image-id",
          "imageUrl": "https://...",
          "altText": "IPhone 15",
          "isPrimary": true,
          "displayOrder": 1
        }
      ],
      "variants": [
        {
          "id": "variant-id",
          "name": "128GB",
          "sku": "IP15-128",
          "price": "20000000.00",
          "comparePrice": "22000000.00",
          "stockQuantity": 10,
          "imageUrl": "https://...",
          "options": [
            {
              "name": "Dung luong",
              "value": "128GB"
            }
          ]
        }
      ]
    }
  ]
}
```

### GET `/api/products/:identifier`

Lay chi tiet 1 san pham theo `product_id` hoac `slug`.

Vi du:

```txt
GET /api/products/iphone-15
```

Response:

```json
{
  "success": true,
  "message": "Lay chi tiet san pham thanh cong",
  "item": {
    "id": "product-id",
    "name": "IPhone 15",
    "slug": "iphone-15",
    "sku": "IP15",
    "shortDescription": "Mo ta ngan",
    "description": "Mo ta chi tiet",
    "price": "20000000.00",
    "comparePrice": "22000000.00",
    "status": "published",
    "featured": true,
    "bestSeller": false,
    "newArrival": true,
    "createdAt": "2026-03-28T00:00:00.000Z",
    "updatedAt": "2026-03-28T00:00:00.000Z",
    "category": {
      "id": "category-id",
      "name": "Dien thoai",
      "slug": "dien-thoai"
    },
    "brand": {
      "id": "brand-id",
      "name": "Apple",
      "slug": "apple",
      "logoUrl": "https://..."
    },
    "images": [],
    "variants": []
  }
}
```

## 5. Don hang

### POST `/api/orders`

Tao don hang tu danh sach san pham nguoi dung da chon.

Request body:

```json
{
  "userId": "optional-user-id",
  "customerName": "Nguyen Van A",
  "customerEmail": "vana@gmail.com",
  "customerPhone": "0900000000",
  "shippingAddressLine1": "123 Duong ABC",
  "shippingAddressLine2": "Can ho 12A",
  "shippingCity": "Ho Chi Minh",
  "shippingDistrict": "Quan 1",
  "shippingWard": "Ben Nghe",
  "shippingPostalCode": "700000",
  "shippingCountry": "Vietnam",
  "billingAddressLine1": "123 Duong ABC",
  "billingAddressLine2": "Can ho 12A",
  "billingCity": "Ho Chi Minh",
  "billingDistrict": "Quan 1",
  "billingWard": "Ben Nghe",
  "billingPostalCode": "700000",
  "billingCountry": "Vietnam",
  "shippingFee": 30000,
  "taxAmount": 0,
  "discountAmount": 0,
  "couponCode": null,
  "paymentMethod": "cod",
  "shippingMethod": "standard",
  "notes": "Giao gio hanh chinh",
  "items": [
    {
      "productId": "product-id",
      "variantId": "variant-id",
      "quantity": 2
    }
  ]
}
```

Ghi chu:

- `items` bat buoc co it nhat 1 san pham
- `variantId` la tuy chon, chi gui khi san pham co bien the
- He thong se tu tinh `subtotal`, `totalAmount`
- He thong co kiem tra ton kho bien the truoc khi tao don

Response thanh cong:

```json
{
  "success": true,
  "message": "Tao don hang thanh cong",
  "order": {
    "id": "order-id",
    "orderNumber": "ORD-20260328-ABC123",
    "status": "pending",
    "paymentStatus": "pending",
    "shippingStatus": "pending",
    "customerName": "Nguyen Van A",
    "customerEmail": "vana@gmail.com",
    "customerPhone": "0900000000",
    "shippingAddress": {
      "line1": "123 Duong ABC",
      "line2": "Can ho 12A",
      "city": "Ho Chi Minh",
      "district": "Quan 1",
      "ward": "Ben Nghe",
      "postalCode": "700000",
      "country": "Vietnam"
    },
    "billingAddress": {
      "line1": "123 Duong ABC",
      "line2": "Can ho 12A",
      "city": "Ho Chi Minh",
      "district": "Quan 1",
      "ward": "Ben Nghe",
      "postalCode": "700000",
      "country": "Vietnam"
    },
    "subtotal": "40000000.00",
    "shippingFee": "30000.00",
    "taxAmount": "0.00",
    "discountAmount": "0.00",
    "totalAmount": "40030000.00",
    "paymentMethod": "cod",
    "shippingMethod": "standard",
    "notes": "Giao gio hanh chinh",
    "createdAt": "2026-03-28T00:00:00.000Z",
    "items": [
      {
        "id": "order-item-id",
        "productId": "product-id",
        "variantId": "variant-id",
        "productName": "IPhone 15",
        "variantName": "128GB",
        "sku": "IP15-128",
        "quantity": 2,
        "unitPrice": "20000000.00",
        "totalPrice": "40000000.00"
      }
    ]
  }
}
```

### GET `/api/orders/:identifier`

Lay chi tiet don hang theo `order_id` hoac `order_number`.

Vi du:

```txt
GET /api/orders/ORD-20260328-ABC123
```

Response:

```json
{
  "success": true,
  "message": "Lay chi tiet don hang thanh cong",
  "order": {
    "id": "order-id",
    "orderNumber": "ORD-20260328-ABC123",
    "status": "pending",
    "paymentStatus": "pending",
    "shippingStatus": "pending",
    "customerName": "Nguyen Van A",
    "customerEmail": "vana@gmail.com",
    "customerPhone": "0900000000",
    "shippingAddress": {
      "line1": "123 Duong ABC",
      "line2": "Can ho 12A",
      "city": "Ho Chi Minh",
      "district": "Quan 1",
      "ward": "Ben Nghe",
      "postalCode": "700000",
      "country": "Vietnam"
    },
    "billingAddress": {
      "line1": "123 Duong ABC",
      "line2": "Can ho 12A",
      "city": "Ho Chi Minh",
      "district": "Quan 1",
      "ward": "Ben Nghe",
      "postalCode": "700000",
      "country": "Vietnam"
    },
    "subtotal": "40000000.00",
    "shippingFee": "30000.00",
    "taxAmount": "0.00",
    "discountAmount": "0.00",
    "totalAmount": "40030000.00",
    "paymentMethod": "cod",
    "shippingMethod": "standard",
    "notes": "Giao gio hanh chinh",
    "createdAt": "2026-03-28T00:00:00.000Z",
    "items": [
      {
        "id": "order-item-id",
        "productId": "product-id",
        "variantId": "variant-id",
        "productName": "IPhone 15",
        "variantName": "128GB",
        "sku": "IP15-128",
        "quantity": 2,
        "unitPrice": "20000000.00",
        "totalPrice": "40000000.00"
      }
    ]
  }
}
```

## 6. Cac ma loi FE can xu ly

| HTTP Code | Y nghia |
|---|---|
| `400` | Thieu du lieu, du lieu khong hop le, het hang, bien the khong hop le |
| `401` | Sai email hoac mat khau, chua dang nhap, token het han |
| `403` | Dang nhap roi nhung khong du quyen |
| `404` | Khong tim thay route, san pham, hoac don hang |
| `409` | Email da ton tai |
| `500` | Loi may chu |

## 7. Goi y luong FE

### Login

1. Goi `POST /api/auth/login`
2. Bat `credentials` de nhan cookie
3. Goi `GET /api/auth/me` de lay user va role hien tai
4. Neu `role = admin` thi vao man admin, nguoc lai vao man user

### Man hinh danh sach san pham

1. Goi `GET /api/products`
2. Hien thi `items`
3. Dung `pagination` de phan trang

### Man hinh chi tiet san pham

1. Goi `GET /api/products/:identifier`
2. Cho nguoi dung chon `variant`
3. Gui `productId`, `variantId`, `quantity` khi mua

### Man hinh checkout

1. Thu thap thong tin nguoi nhan
2. Tao mang `items`
3. Goi `POST /api/orders`
4. Neu thanh cong, luu `orderNumber` de tra cuu
