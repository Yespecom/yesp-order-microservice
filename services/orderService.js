const { connectTenantDB } = require("../config/db")
const createOrderModel = require("../models/tenant/Order")
const Tenant = require("../models/main/Tenant")
const { ORDER_STATUS, PAYMENT_STATUS } = require("../utils/constants")
const moment = require("moment")

class OrderService {
  async getTenantConnection(tenantId) {
    const tenant = await Tenant.findOne({ tenantId })
    if (!tenant) {
      throw new Error("Tenant not found")
    }

    if (tenant.status !== "active") {
      throw new Error("Tenant is not active")
    }

    const connection = await connectTenantDB(tenant.dbName)
    return { connection, tenant }
  }

  async generateOrderNumber(tenantId) {
    const { connection, tenant } = await this.getTenantConnection(tenantId)
    const Order = createOrderModel(connection)

    const prefix = tenant.settings.orderPrefix || "ORD"
    const today = moment().format("YYYYMMDD")

    // Find the last order for today
    const lastOrder = await Order.findOne({
      orderNumber: new RegExp(`^${prefix}-${today}-`),
    }).sort({ orderNumber: -1 })

    let sequence = 1
    if (lastOrder) {
      const lastSequence = Number.parseInt(lastOrder.orderNumber.split("-").pop())
      sequence = lastSequence + 1
    }

    return `${prefix}-${today}-${sequence.toString().padStart(4, "0")}`
  }

  async createOrder(tenantId, orderData) {
    const { connection } = await this.getTenantConnection(tenantId)
    const Order = createOrderModel(connection)

    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId)

    // Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const total = subtotal + (orderData.tax || 0) + (orderData.shipping || 0) - (orderData.discount || 0)

    const order = new Order({
      ...orderData,
      orderNumber,
      subtotal,
      total,
      status: ORDER_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
    })

    await order.save()
    return order
  }

  async getOrders(tenantId, filters = {}, options = {}) {
    const { connection } = await this.getTenantConnection(tenantId)
    const Order = createOrderModel(connection)

    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      status,
      paymentStatus,
      customerId,
      storeId,
      startDate,
      endDate,
      search,
    } = options

    // Build query
    const query = {}

    if (status) query.status = status
    if (paymentStatus) query.paymentStatus = paymentStatus
    if (customerId) query.customerId = customerId
    if (storeId) query.storeId = storeId

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    // Search functionality
    if (search) {
      query.$or = [
        { orderNumber: new RegExp(search, "i") },
        { customerName: new RegExp(search, "i") },
        { customerEmail: new RegExp(search, "i") },
      ]
    }

    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(Number.parseInt(limit)),
      Order.countDocuments(query),
    ])

    return {
      orders,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: Number.parseInt(limit),
      },
    }
  }

  async getOrderById(tenantId, orderId) {
    const { connection } = await this.getTenantConnection(tenantId)
    const Order = createOrderModel(connection)

    const order = await Order.findById(orderId)
    if (!order) {
      throw new Error("Order not found")
    }

    return order
  }

  async updateOrder(tenantId, orderId, updateData, updatedBy) {
    const { connection } = await this.getTenantConnection(tenantId)
    const Order = createOrderModel(connection)

    const order = await Order.findById(orderId)
    if (!order) {
      throw new Error("Order not found")
    }

    // Prevent updating certain fields based on current status
    if (order.status === ORDER_STATUS.DELIVERED && updateData.status !== ORDER_STATUS.REFUNDED) {
      throw new Error("Cannot modify delivered order")
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      throw new Error("Cannot modify cancelled order")
    }

    // Update timestamps for status changes
    if (updateData.status) {
      if (updateData.status === ORDER_STATUS.DELIVERED) {
        updateData.deliveredAt = new Date()
      } else if (updateData.status === ORDER_STATUS.CANCELLED) {
        updateData.cancelledAt = new Date()
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { ...updateData, updatedBy },
      { new: true, runValidators: true },
    )

    return updatedOrder
  }

  async cancelOrder(tenantId, orderId, cancelReason, cancelledBy) {
    return this.updateOrder(
      tenantId,
      orderId,
      {
        status: ORDER_STATUS.CANCELLED,
        cancelReason,
        cancelledAt: new Date(),
      },
      cancelledBy,
    )
  }

  async getOrderStats(tenantId, storeId = null) {
    const { connection } = await this.getTenantConnection(tenantId)
    const Order = createOrderModel(connection)

    const matchStage = storeId ? { storeId } : {}

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          averageOrderValue: { $avg: "$total" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", ORDER_STATUS.PENDING] }, 1, 0] },
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ["$status", ORDER_STATUS.CONFIRMED] }, 1, 0] },
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ["$status", ORDER_STATUS.PROCESSING] }, 1, 0] },
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ["$status", ORDER_STATUS.SHIPPED] }, 1, 0] },
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", ORDER_STATUS.DELIVERED] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", ORDER_STATUS.CANCELLED] }, 1, 0] },
          },
        },
      },
    ])

    return (
      stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      }
    )
  }
}

module.exports = new OrderService()
