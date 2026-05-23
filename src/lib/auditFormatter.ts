const actionTranslation: Record<string, string> = {
  CREATE_PRODUCT: "Tạo sản phẩm",
  UPDATE_PRODUCT: "Cập nhật sản phẩm",
  DELETE_PRODUCT: "Xóa sản phẩm",
  DUPLICATE_PRODUCT: "Nhân bản sản phẩm",
  CREATE_UI_ELEMENT: "Tạo UI Element",
  UPDATE_UI_ELEMENT: "Cập nhật UI Element",
  DELETE_UI_ELEMENT: "Xóa UI Element",
  UPDATE_KEY: "Cập nhật Key",
  DELETE_KEY: "Xóa Key",
  MANUAL_ASSIGN_KEYS: "Gán Key thủ công",
  UPDATE_USER: "Cập nhật người dùng",
  UPDATE_SETTINGS: "Cập nhật cấu hình",
  UPDATE_ORDER: "Cập nhật đơn hàng",
  CANCEL_ORDER: "Hủy đơn hàng",
  UPDATE_CATEGORY: "Cập nhật danh mục",
  CREATE_CATEGORY: "Tạo danh mục",
  DELETE_CATEGORY: "Xóa danh mục",
  LOGIN: "Đăng nhập",
  LOGOUT: "Đăng xuất",
};

const fieldLabels: Record<string, string> = {
  name: "Tên",
  slug: "Slug",
  price: "Giá",
  salePrice: "Giá khuyến mãi",
  stock: "Tồn kho",
  status: "Trạng thái",
  type: "Loại",
  description: "Mô tả",
  shortDesc: "Mô tả ngắn",
  guide: "Hướng dẫn",
  sku: "Mã SKU",
  images: "Hình ảnh",
  categoryId: "Danh mục",
  siteName: "Tên website",
  siteLogo: "Logo",
  contactEmail: "Email liên hệ",
  contactPhone: "SĐT liên hệ",
  footerText: "Footer text",
  bankName: "Tên ngân hàng",
  bankAccount: "Số tài khoản",
  bankAccountName: "Chủ tài khoản",
  keyValue: "Giá trị Key",
  orderNumber: "Mã đơn hàng",
  email: "Email",
  phone: "Số điện thoại",
  role: "Vai trò",
  isActive: "Kích hoạt",
  password: "Mật khẩu",
  balanceAdjustment: "Điều chỉnh số dư",
  newProductId: "Sản phẩm mới",
  action: "Hành động",
};

export function formatAuditDetails(details: string | null, action: string, entity: string): string {
  if (!details) return "";

  try {
    const parsed = JSON.parse(details);

    if (action === "UPDATE_PRODUCT" || action === "UPDATE_KEY" || action === "UPDATE_UI_ELEMENT") {
      const fields = parsed.fields || parsed.keys || [];
      if (Array.isArray(fields) && fields.length > 0) {
        return fields.map((f: string) => fieldLabels[f] || f).join(", ");
      }
    }

    if (action === "UPDATE_SETTINGS") {
      const keys = parsed.keys || [];
      if (Array.isArray(keys) && keys.length > 0) {
        return keys.map((k: string) => fieldLabels[k] || k).join(", ");
      }
    }

    if (action === "CANCEL_ORDER" || action === "UPDATE_ORDER") {
      const parts: string[] = [];
      const updatedFields = parsed.updatedFields || [];
      if (Array.isArray(updatedFields)) {
        parts.push(updatedFields.map((f: string) => fieldLabels[f] || f).join(", "));
      }
      if (parsed.previousValues?.status && parsed.newValues?.status && parsed.previousValues.status !== parsed.newValues.status) {
        parts.push(`${statusLabel(parsed.previousValues.status)} → ${statusLabel(parsed.newValues.status)}`);
      }
      if (parsed.previousValues?.paymentStatus && parsed.newValues?.paymentStatus && parsed.previousValues.paymentStatus !== parsed.newValues.paymentStatus) {
        parts.push(`TT: ${statusLabel(parsed.previousValues.paymentStatus)} → ${statusLabel(parsed.newValues.paymentStatus)}`);
      }
      return parts.join(" | ");
    }

    if (action === "DUPLICATE_PRODUCT") {
      return `ID mới: ${parsed.newProductId || "N/A"}`;
    }

    if (action === "UPDATE_USER") {
      const fields = parsed.fields || [];
      if (Array.isArray(fields) && fields.length > 0) {
        return fields.map((f: string) => fieldLabels[f] || f).join(", ");
      }
    }

    if (typeof parsed === "object" && parsed !== null) {
      const entries = Object.entries(parsed);
      if (entries.length > 0) {
        return entries
          .map(([key, val]) => `${fieldLabels[key] || key}: ${val}`)
          .join(", ");
      }
    }

    return details;
  } catch {
    return details || "";
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Chờ xử lý",
    PROCESSING: "Đang xử lý",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    REFUNDED: "Đã hoàn tiền",
    UNPAID: "Chưa TT",
    PAID: "Đã TT",
    FAILED: "Thất bại",
  };
  return labels[status] || status;
}

export function getActionLabel(action: string): string {
  return actionTranslation[action] || action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getEntityLabel(entity: string): string {
  const labels: Record<string, string> = {
    Product: "Sản phẩm",
    ProductKey: "Key",
    User: "Người dùng",
    SystemSettings: "Cấu hình",
    Order: "Đơn hàng",
    uIElement: "UI Element",
    Category: "Danh mục",
  };
  return labels[entity] || entity;
}
