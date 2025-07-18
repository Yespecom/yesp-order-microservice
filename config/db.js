const mongoose = require("mongoose")

const connections = {} // To store multiple tenant connections

const connectMainDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MAIN_DB_URI)
      console.log("[DB] Connected to Main Database")
    } else {
      console.log("[DB] Main Database already connected.")
    }
    return mongoose.connection
  } catch (error) {
    console.error("[DB] Error connecting to Main Database:", error)
    process.exit(1) // Exit process with failure
  }
}

// This function now accepts the full dbName
const connectTenantDB = async (dbName) => {
  if (connections[dbName] && connections[dbName].readyState === 1) {
    console.log(`[DB] Reusing existing connection for Tenant Database: ${dbName}`)
    return connections[dbName]
  }

  try {
    console.log(`[DB] Attempting to create new connection for Tenant Database: ${dbName}`)
    // Assuming MONGO_URI is like "mongodb://localhost:27017/"
    // We append the dbName directly, removing any default db from MONGO_URI if present
    const baseUri = process.env.MONGO_URI.split("?")[0].split("/").slice(0, -1).join("/") + "/"
    const conn = await mongoose.createConnection(`${baseUri}${dbName}`)
    connections[dbName] = conn
    console.log(`[DB] Successfully connected to Tenant Database: ${dbName}`)
    return conn
  } catch (error) {
    console.error(`[DB] Error connecting to Tenant Database ${dbName}:`, error)
    throw error
  }
}

module.exports = { connectMainDB, connectTenantDB }
