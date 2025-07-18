const orderService = require("../services/orderService")
const Joi = require("joi")
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require("../utils/constants")

// Validation schemas
const createOrderSchema = Joi.object({
  customerId: Joi.string().required(),
  customerEmail: Joi.string().email().required(),
  customerName: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        productName: Joi.string().required(),
        sku: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().min(0).required(),
        totalPrice: Joi.number().min(0).required(),
        discount: Joi.number().min(0).default(0),
      }),
    )
    .min(1)
    .required(),
  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHODS))
    .required(),
  tax: Joi.number().min(0).default(0),
  shipping: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).default(0),
  currency: Joi.string().default("USD"),
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow(""),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string().allow(""),
  }).required(),
  billingAddress: Joi.object({
    fullName: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow(""),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string().allow(""),
  }),
  notes: Joi.string().allow(""),
})

const updateOrderSchema = Joi.object({
  status: Joi.string().valid(...Object.values(ORDER_STATUS)),
  paymentStatus: Joi.string().valid(...Object.values(PAYMENT_STATUS)),
  trackingNumber: Joi.string().allow(""),
  estimatedDelivery: Joi.date(),
  notes: Joi.string().allow(""),
})

class OrderController {
  async createOrder(req, res, next) {
    try {
      const { error, value } = createOrderSchema.validate(req.body)
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        })
      }

      const orderData = {
        ...value,
        storeId: req.storeId,
        createdBy: req.userId,
      }

      const order = await orderService.createOrder(req.tenantId, orderData)

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }

  async getOrders(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = "-createdAt",
        status,
        paymentStatus,
        customerId,
        startDate,
        endDate,
        search,
      } = req.query

      const options = {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        sort,
        status,
        paymentStatus,
        customerId,
        storeId: req.storeId,
        startDate,
        endDate,
        search,
      }

      const result = await orderService.getOrders(req.tenantId, {}, options)

      res.json({
        success: true,
        message: "Orders retrieved successfully",
        data: result.orders,
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { orderId } = req.params
      const order = await orderService.getOrderById(req.tenantId, orderId)

      res.json({
        success: true,
        message: "Order retrieved successfully",
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }

  async updateOrder(req, res, next) {
    try {
      const { orderId } = req.params
      const { error, value } = updateOrderSchema.validate(req.body)

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        })
      }

      const updatedOrder = await orderService.updateOrder(req.tenantId, orderId, value, req.userId)

      res.json({
        success: true,
        message: "Order updated successfully",
        data: updatedOrder,
      })
    } catch (error) {
      next(error)
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params
      const { cancelReason } = req.body

      if (!cancelReason) {
        return res.status(400).json({
          success: false,
          message: "Cancel reason is required",
        })
      }

      const cancelledOrder = await orderService.cancelOrder(req.tenantId, orderId, cancelReason, req.userId)

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: cancelledOrder,
      })
    } catch (error) {
      next(error)
    }
  }

  async getOrderStats(req, res, next) {
    try {
      const stats = await orderService.getOrderStats(req.tenantId, req.storeId)

      res.json({
        success: true,
        message: "Order statistics retrieved successfully",
        data: stats,
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new OrderController()
