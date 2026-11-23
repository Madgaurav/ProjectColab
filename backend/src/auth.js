import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { query } from './db.js'

const jwtSecret = () => {
  return process.env.JWT_SECRET || 'projectcollab-local-dev-jwt-secret-mitaoe-2026'
}

export function signSession(user) {
  return jwt.sign({ sub: user.id, role: user.role, collegeId: user.college_id }, jwtSecret(), { expiresIn: '7d' })
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function makeToken() {
  return crypto.randomBytes(32).toString('hex')
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.header('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ message: 'Sign in is required.' })
    const payload = jwt.verify(token, jwtSecret())
    const { rows } = await query(
      'SELECT id, name, email, role, account_status, college_id FROM users WHERE id = $1',
      [payload.sub],
    )
    const user = rows[0]
    if (!user || user.account_status !== 'active') return res.status(401).json({ message: 'Your account is not active.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'You do not have permission for this action.' })
  next()
}
