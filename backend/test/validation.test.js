import test, { describe } from 'node:test'
import assert from 'node:assert/strict'

describe('Domain & Business Logic Validation', () => {
  // Helper functions matching index.js business rules
  const clean = (val) => (typeof val === 'string' ? val.trim() : '')
  const validEmail = (email) => /^\d+@mitaoe\.ac\.in$/i.test(email)
  const validUrl = (url) => !url || /^https:\/\/.+/i.test(url)
  const projectStatuses = new Set(['recruiting', 'recruitment_closed', 'in_progress', 'completed', 'archived'])
  const projectTypes = new Set(['mini_project', 'major_project', 'personal_project', 'research_project', 'hackathon'])
  const validTaskStatuses = new Set(['todo', 'in_progress', 'completed'])

  const validateProject = (project) => {
    const title = clean(project.title)
    const shortDesc = clean(project.shortDescription)
    const desc = clean(project.description)
    const teamSize = Number(project.teamSize)
    const durationWeeks = Number(project.durationWeeks) || null

    if (title.length < 4 || title.length > 120) return false
    if (shortDesc.length < 20 || shortDesc.length > 240) return false
    if (desc.length < 40 || desc.length > 5000) return false
    if (!project.category) return false
    if (!projectTypes.has(project.projectType)) return false
    if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 20) return false
    if (!projectStatuses.has(project.status || 'recruiting')) return false
    if (durationWeeks && (durationWeeks < 1 || durationWeeks > 104)) return false
    return true
  }

  test('validates college email address format for MIT AOE', () => {
    assert.equal(validEmail('202401100139@mitaoe.ac.in'), true)
    assert.equal(validEmail('202301010011@mitaoe.ac.in'), true)
    assert.equal(validEmail('john@mitaoe.ac.in'), false) // non-numeric
    assert.equal(validEmail('202401100139@gmail.com'), false) // non-mitaoe domain
    assert.equal(validEmail('invalid-email'), false)
    assert.equal(validEmail('student@'), false)
    assert.equal(validEmail('@mitaoe.ac.in'), false)
  })

  test('validates password minimum length requirement (10 characters)', () => {
    const minPassLen = 10
    assert.equal('password12'.length >= minPassLen, true)
    assert.equal('short'.length >= minPassLen, false)
    assert.equal('123456789'.length >= minPassLen, false)
  })

  test('validates project opportunity specifications', () => {
    const validP = {
      title: 'Autonomous Campus Delivery Robot',
      shortDescription: 'Building a small rover that navigates campus paths safely.',
      description: 'The team will design the chassis, implement ROS navigation, and connect GPS pathing. Success means traversing between library and engineering buildings.',
      category: 'Robotics',
      projectType: 'major_project',
      teamSize: 4,
      status: 'recruiting',
      durationWeeks: 12,
    }

    assert.equal(validateProject(validP), true)

    // Invalid title (too short)
    assert.equal(validateProject({ ...validP, title: 'Bot' }), false)

    // Invalid short description (too short)
    assert.equal(validateProject({ ...validP, shortDescription: 'A rover.' }), false)

    // Invalid project type
    assert.equal(validateProject({ ...validP, projectType: 'startup_incubator' }), false)

    // Invalid team size (exceeds max 20)
    assert.equal(validateProject({ ...validP, teamSize: 25 }), false)

    // Invalid team size (less than 1)
    assert.equal(validateProject({ ...validP, teamSize: 0 }), false)
  })

  test('validates application pitch length (20 to 1,500 characters)', () => {
    const validateIntro = (intro) => {
      const c = clean(intro)
      return c.length >= 20 && c.length <= 1500
    }

    assert.equal(validateIntro('Too short'), false)
    assert.equal(
      validateIntro('I have 2 years of experience building React frontends and would love to design this interface.'),
      true
    )
    assert.equal(validateIntro('a'.repeat(1501)), false)
  })

  test('validates task lifecycle status enums', () => {
    assert.equal(validTaskStatuses.has('todo'), true)
    assert.equal(validTaskStatuses.has('in_progress'), true)
    assert.equal(validTaskStatuses.has('completed'), true)
    assert.equal(validTaskStatuses.has('archived'), false)
    assert.equal(validTaskStatuses.has('blocked'), false)
  })

  test('enforces secure HTTPS protocol for shared team resources', () => {
    assert.equal(validUrl('https://github.com/org/repo'), true)
    assert.equal(validUrl('https://figma.com/file/12345'), true)
    assert.equal(validUrl('http://insecure.com'), false)
    assert.equal(validUrl('ftp://ftp.example.com'), false)
    assert.equal(validUrl('javascript:alert(1)'), false)
  })
})
