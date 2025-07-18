const express = require("express")
const router = express.Router()
const orderController = require("../controllers/orderController")
const authMiddleware = require("../middleware/authMiddleware")

// Apply auth middleware to all routes
router.use(authMiddleware)

// Order CRUD routes
router.post("/", orderController.createOrder)
router.get("/", orderController.getOrders)
router.get("/stats", orderController.getOrderStats)
router.get("/:orderId", orderController.getOrderById)
router.put("/:orderId", orderController.updateOrder)
router.patch("/:orderId/cancel", orderController.cancelOrder)

module.exports = router
