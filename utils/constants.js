const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
}

const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
}

const PAYMENT_METHODS = {
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  PAYPAL: "paypal",
  BANK_TRANSFER: "bank_transfer",
  CASH_ON_DELIVERY: "cash_on_delivery",
}

const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  CUSTOMER: "customer",
}

const SORT_OPTIONS = {
  NEWEST: "-createdAt",
  OLDEST: "createdAt",
  TOTAL_HIGH: "-total",
  TOTAL_LOW: "total",
  STATUS: "status",
}

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  USER_ROLES,
  SORT_OPTIONS,
}
