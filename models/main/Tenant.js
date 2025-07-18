const mongoose = require("mongoose")

const tenantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dbName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    settings: {
      orderPrefix: {
        type: String,
        default: "ORD",
      },
      currency: {
        type: String,
        default: "USD",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Tenant", tenantSchema)
