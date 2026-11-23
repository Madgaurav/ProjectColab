import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { hashToken, makeToken, signSession, requireRole } from '../src/auth.js'

describe('Authentication & Session Tokens', () => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long-for-antigravity'

  test('makeToken generates a 64-character hexadecimal token', () => {
    const token = makeToken()
    assert.equal(typeof token, 'string')
    assert.equal(token.length, 64)
    assert.match(token, /^[0-9a-f]{64}$/)
  })

  test('hashToken produces deterministic sha256 output', () => {
    const token = 'sample-verification-token-12345'
    const hash1 = hashToken(token)
    const hash2 = hashToken(token)
    assert.equal(hash1, hash2)
    assert.equal(hash1.length, 64)
    assert.notEqual(hash1, token)
  })

  test('signSession creates a valid verifiable JWT with user claims', () => {
    const user = {
      id: 'uuid-1234-5678',
      role: 'student',
      college_id: 'college-uuid-9999',
    }

    const token = signSession(user)
    assert.ok(token)

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    assert.equal(decoded.sub, user.id)
    assert.equal(decoded.role, 'student')
    assert.equal(decoded.collegeId, user.college_id)
    assert.ok(decoded.exp)
  })

  test('requireRole allows requests with matching roles', () => {
    const middleware = requireRole('student', 'admin')
    const req = { user: { role: 'student' } }
    let nextCalled = false
    const res = {
      status() { return this },
      json() { return this },
    }

    middleware(req, res, () => {
      nextCalled = true
    })

    assert.equal(nextCalled, true)
  })

  test('requireRole rejects requests with unauthorized roles', () => {
    const middleware = requireRole('admin')
    const req = { user: { role: 'student' } }
    let nextCalled = false
    let statusCode = null
    let responseData = null

    const res = {
      status(code) {
        statusCode = code
        return this
      },
      json(data) {
        responseData = data
        return this
      },
    }

    middleware(req, res, () => {
      nextCalled = true
    })

    assert.equal(nextCalled, false)
    assert.equal(statusCode, 403)
    assert.match(responseData.message, /permission/)
  })
})
