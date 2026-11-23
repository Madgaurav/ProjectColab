import pg from 'pg'
import mongoose from 'mongoose'
import 'dotenv/config'
import { executeFallbackQuery } from './fallback-store.js'

const { Pool } = pg

let realPool = null
let pgDisabled = false
let loggedFallback = false

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('[Database] Connected to MongoDB Atlas: cluster0.gnloy8k.mongodb.net/projectcollab'))
    .catch((err) => console.error('[Database] MongoDB Atlas connection error:', err.message))
}

function logFallbackOnce() {
  if (!loggedFallback) {
    if (process.env.MONGODB_URI) {
      console.log('[Database] Primary data store: MongoDB Atlas (cluster0.gnloy8k.mongodb.net/projectcollab).')
    } else {
      console.log('[Database] PostgreSQL offline/unavailable. Operating in persistent local store mode.')
    }
    loggedFallback = true
  }
}

try {
  realPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectcollab',
    connectionTimeoutMillis: 1000
  })
  realPool.on('error', () => {
    pgDisabled = true
    logFallbackOnce()
  })
} catch {
  pgDisabled = true
  logFallbackOnce()
}

export async function query(text, params) {
  if (pgDisabled || !realPool) {
    logFallbackOnce()
    return executeFallbackQuery(text, params)
  }
  try {
    return await realPool.query(text, params)
  } catch (error) {
    const isConnErr =
      error.code === 'ECONNREFUSED' ||
      error.code === 'EPERM' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('connect') ||
      error.message?.includes('timeout')

    if (isConnErr) {
      pgDisabled = true
      logFallbackOnce()
      return executeFallbackQuery(text, params)
    }
    throw error
  }
}

export const pool = {
  async connect() {
    if (pgDisabled || !realPool) {
      logFallbackOnce()
      return {
        query: async (text, params) => executeFallbackQuery(text, params),
        release: () => {}
      }
    }
    try {
      const client = await realPool.connect()
      return client
    } catch (error) {
      const isConnErr =
        error.code === 'ECONNREFUSED' ||
        error.code === 'EPERM' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('connect') ||
        error.message?.includes('timeout')

      if (isConnErr) {
        pgDisabled = true
        logFallbackOnce()
        return {
          query: async (text, params) => executeFallbackQuery(text, params),
          release: () => {}
        }
      }
      throw error
    }
  },
  query(text, params) {
    return query(text, params)
  }
}
