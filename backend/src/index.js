import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'
import { pool, query } from './db.js'
import { hashToken, makeToken, requireAuth, signSession } from './auth.js'
import { sendPasswordResetEmail, sendVerificationEmail } from './email.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDist = path.join(__dirname, '../../frontend/dist')

const app = express()
const port = process.env.PORT || 4000
const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: true, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json({ limit: '20kb' }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'production' ? 20 : 1000, standardHeaders: true, legacyHeaders: false }))

const clean = (value) => typeof value === 'string' ? value.trim() : ''
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, collegeId: user.college_id })
const tokenExpiry = () => new Date(Date.now() + 60 * 60 * 1000)
const profileFields = `u.id, u.name, u.department, u.academic_year, u.bio, u.profile_picture_url, u.github_url,
  u.portfolio_url, u.availability, u.preferred_categories, c.name AS college_name,
  COALESCE((SELECT json_agg(json_build_object('name', s.skill_name, 'level', us.proficiency_level) ORDER BY s.skill_name)
    FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = u.id), '[]'::json) AS skills,
  COALESCE((SELECT json_agg(interest ORDER BY interest) FROM user_interests WHERE user_id = u.id), '[]'::json) AS interests`
const validAvailability = new Set(['open', 'limited', 'unavailable'])
const projectStatuses = new Set(['recruiting', 'recruitment_closed', 'in_progress', 'completed', 'archived'])
const projectTypes = new Set(['mini_project', 'major_project', 'personal_project', 'research_project', 'hackathon'])
const safeItems = (value, limit = 12) => Array.isArray(value)
  ? [...new Set(value.map(clean).filter((item) => item.length > 0 && item.length <= 50))].slice(0, limit)
  : []
const validUrl = (value) => !value || /^https:\/\/.+/i.test(value)
const createNotification = (userId, title, message, type, projectId = null) => query(
  'INSERT INTO notifications (user_id, title, message, notification_type, related_project_id) VALUES ($1,$2,$3,$4,$5)',
  [userId, title, message, type, projectId],
)

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const name = clean(req.body.name)
    const email = clean(req.body.email).toLowerCase()
    const password = req.body.password || ''
    if (name.length < 2 || name.length > 100) return res.status(400).json({ message: 'Enter your full name.' })
    if (!/^\d+@mitaoe\.ac\.in$/i.test(email)) return res.status(400).json({ message: 'Use your MIT AOE student email format: numbers only before @ (e.g. 202401100139@mitaoe.ac.in).' })
    if (password.length < 10) return res.status(400).json({ message: 'Use at least 10 characters for your password.' })
    const domain = email.split('@')[1]
    const configuredDomain = process.env.COLLEGE_EMAIL_DOMAIN?.toLowerCase()
    if (configuredDomain && domain !== configuredDomain) return res.status(403).json({ message: `Use your ${configuredDomain} college email address.` })

    let collegeId = null
    const { rows: matchingColleges } = await query('SELECT id FROM colleges WHERE email_domain = $1 LIMIT 1', [domain])
    collegeId = matchingColleges[0]?.id || null
    const token = makeToken()
    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, college_id, verification_token_hash, verification_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, college_id`,
      [name, email, passwordHash, collegeId, hashToken(token), tokenExpiry()],
    )
    await sendVerificationEmail({ to: email, name, token, clientOrigin: origin })
    return res.status(201).json({
      message: 'Account created successfully! You are signed in.',
      token: signSession(rows[0]),
      verificationToken: process.env.NODE_ENV !== 'production' ? token : undefined,
      user: publicUser(rows[0])
    })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'An account with this email already exists.' })
    next(error)
  }
})

app.post('/api/auth/verify-email', async (req, res, next) => {
  try {
    const token = clean(req.body.token)
    if (!token) return res.status(400).json({ message: 'Verification token is required.' })
    const { rows } = await query(
      `UPDATE users SET account_status = 'active', verification_token_hash = NULL, verification_expires_at = NULL, updated_at = now()
       WHERE verification_token_hash = $1 AND verification_expires_at > now()
       RETURNING id, name, email, role, college_id`,
      [hashToken(token)],
    )
    if (!rows[0]) return res.status(400).json({ message: 'This verification link is invalid or has expired.' })
    return res.json({ message: 'Your email is verified. Welcome to ProjectCollab.', token: signSession(rows[0]), user: publicUser(rows[0]) })
  } catch (error) { next(error) }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = clean(req.body.email).toLowerCase()
    const password = req.body.password || ''
    if (!/^\d+@mitaoe\.ac\.in$/i.test(email)) return res.status(400).json({ message: 'Enter your MIT AOE student email (e.g. 202401100139@mitaoe.ac.in).' })
    const { rows } = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'Email or password is incorrect.' })
    if (user.account_status === 'suspended') return res.status(403).json({ message: 'This account has been suspended.' })
    if (user.account_status !== 'active') return res.status(403).json({ message: 'Verify your email before signing in.', needsVerification: true })
    return res.json({ token: signSession(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

app.post('/api/auth/forgot-password', async (req, res, next) => {
  try {
    const email = clean(req.body.email).toLowerCase()
    const token = makeToken()
    const { rowCount } = await query('UPDATE users SET reset_token_hash = $1, reset_expires_at = $2 WHERE email = $3', [hashToken(token), tokenExpiry(), email])
    if (rowCount) {
      await sendPasswordResetEmail({ to: email, token, clientOrigin: origin })
    }
    return res.json({ message: 'If an account matches that email, a reset link is on its way.', resetToken: rowCount && process.env.NODE_ENV !== 'production' ? token : undefined })
  } catch (error) { next(error) }
})

app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const token = clean(req.body.token)
    const password = req.body.password || ''
    if (password.length < 10) return res.status(400).json({ message: 'Use at least 10 characters for your new password.' })
    const passwordHash = await bcrypt.hash(password, 12)
    const { rowCount } = await query(
      'UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_expires_at = NULL, updated_at = now() WHERE reset_token_hash = $2 AND reset_expires_at > now()',
      [passwordHash, hashToken(token)],
    )
    if (!rowCount) return res.status(400).json({ message: 'This reset link is invalid or has expired.' })
    return res.json({ message: 'Password updated. You can now sign in.' })
  } catch (error) { next(error) }
})

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }))
app.post('/api/auth/logout', (_req, res) => res.status(204).end())

app.get('/api/notifications', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 30, 100))
    const { rows } = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [req.user.id, limit])
    const unread = await query('SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id])
    res.json({ notifications: rows, unreadCount: unread.rows[0].count })
  } catch (error) { next(error) }
})

app.patch('/api/notifications/:id/read', requireAuth, async (req, res, next) => {
  try { const { rowCount } = await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]); if (!rowCount) return res.status(404).json({ message: 'Notification not found.' }); res.status(204).end() } catch (error) { next(error) }
})

app.patch('/api/notifications/read-all', requireAuth, async (req, res, next) => {
  try { await query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [req.user.id]); res.status(204).end() } catch (error) { next(error) }
})

app.get('/api/users/me/bookmarks', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT p.*, u.name AS owner_name, b.created_at AS bookmarked_at,
      COUNT(DISTINCT tm.id)::int AS member_count,
      COALESCE(json_agg(DISTINCT jsonb_build_object('name', s.skill_name, 'level', ps.required_level)) FILTER (WHERE s.id IS NOT NULL), '[]') AS skills,
      COALESCE(json_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.role_name, 'description', pr.description, 'positions', pr.positions_available)) FILTER (WHERE pr.id IS NOT NULL), '[]') AS roles
      FROM bookmarks b
      JOIN projects p ON p.id = b.project_id
      JOIN users u ON u.id = p.owner_id
      LEFT JOIN team_members tm ON tm.project_id = p.id
      LEFT JOIN project_skills ps ON ps.project_id = p.id
      LEFT JOIN skills s ON s.id = ps.skill_id
      LEFT JOIN project_roles pr ON pr.project_id = p.id
      WHERE b.user_id = $1 AND p.college_id IS NOT DISTINCT FROM $2
      GROUP BY p.id, u.name, b.created_at
      ORDER BY b.created_at DESC`, [req.user.id, req.user.college_id])
    res.json({ projects: rows })
  } catch (error) { next(error) }
})

app.get('/api/users/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT ${profileFields} FROM users u LEFT JOIN colleges c ON c.id = u.college_id WHERE u.id = $1`, [req.user.id])
    res.json({ profile: rows[0] })
  } catch (error) { next(error) }
})

app.get('/api/users/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${profileFields} FROM users u LEFT JOIN colleges c ON c.id = u.college_id
       WHERE u.id = $1 AND u.college_id IS NOT DISTINCT FROM $2 AND u.account_status = 'active'`,
      [req.params.id, req.user.college_id],
    )
    if (!rows[0]) return res.status(404).json({ message: 'That student profile is unavailable.' })
    res.json({ profile: rows[0] })
  } catch (error) { next(error) }
})

app.patch('/api/users/me', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  try {
    const department = clean(req.body.department)
    const academicYear = Number(req.body.academicYear) || null
    const bio = clean(req.body.bio)
    const profilePictureUrl = clean(req.body.profilePictureUrl)
    const githubUrl = clean(req.body.githubUrl)
    const portfolioUrl = clean(req.body.portfolioUrl)
    const availability = clean(req.body.availability) || 'open'
    const categories = safeItems(req.body.preferredCategories, 8)
    const interests = safeItems(req.body.interests, 12)
    const skills = Array.isArray(req.body.skills) ? req.body.skills.slice(0, 15) : []
    const normalizedSkills = []
    for (const entry of skills) {
      const name = clean(entry?.name)
      const level = clean(entry?.level)
      if (name && name.length <= 50 && ['beginner', 'intermediate', 'advanced'].includes(level) && !normalizedSkills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) normalizedSkills.push({ name, level })
    }
    if (bio.length > 500 || !validAvailability.has(availability) || !validUrl(profilePictureUrl) || !validUrl(githubUrl) || !validUrl(portfolioUrl) || (academicYear && (academicYear < 1 || academicYear > 8))) return res.status(400).json({ message: 'Check your profile fields and try again.' })

    await client.query('BEGIN')
    await client.query(
      `UPDATE users SET department = $1, academic_year = $2, bio = $3, profile_picture_url = $4, github_url = $5,
       portfolio_url = $6, availability = $7, preferred_categories = $8, updated_at = now() WHERE id = $9`,
      [department || null, academicYear, bio || null, profilePictureUrl || null, githubUrl || null, portfolioUrl || null, availability, categories, req.user.id],
    )
    await client.query('DELETE FROM user_skills WHERE user_id = $1', [req.user.id])
    for (const skill of normalizedSkills) {
      const { rows } = await client.query('INSERT INTO skills (skill_name) VALUES ($1) ON CONFLICT (skill_name) DO UPDATE SET skill_name = EXCLUDED.skill_name RETURNING id', [skill.name])
      await client.query('INSERT INTO user_skills (user_id, skill_id, proficiency_level) VALUES ($1, $2, $3)', [req.user.id, rows[0].id, skill.level])
    }
    await client.query('DELETE FROM user_interests WHERE user_id = $1', [req.user.id])
    for (const interest of interests) await client.query('INSERT INTO user_interests (user_id, interest) VALUES ($1, $2)', [req.user.id, interest])
    await client.query('COMMIT')
    const { rows } = await query(`SELECT ${profileFields} FROM users u LEFT JOIN colleges c ON c.id = u.college_id WHERE u.id = $1`, [req.user.id])
    res.json({ message: 'Profile saved.', profile: rows[0] })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally { client.release() }
})

const normalizeProject = (body) => ({
  title: clean(body.title), shortDescription: clean(body.shortDescription), description: clean(body.description), problemStatement: clean(body.problemStatement),
  proposedSolution: clean(body.proposedSolution), technologyStack: safeItems(body.technologyStack, 12), category: clean(body.category),
  projectType: clean(body.projectType), teamSize: Number(body.teamSize), recruitmentDeadline: clean(body.recruitmentDeadline) || null,
  durationWeeks: Number(body.durationWeeks) || null, status: clean(body.status) || 'recruiting',
  roles: Array.isArray(body.roles) ? body.roles.map((role) => ({ name: clean(role.name), description: clean(role.description), positions: Number(role.positions) })).filter((role) => role.name.length >= 2 && role.name.length <= 60 && role.positions > 0 && role.positions <= 20).slice(0, 10) : [],
  skills: Array.isArray(body.skills) ? body.skills.map((skill) => ({ name: clean(skill.name), level: clean(skill.level) })).filter((skill) => skill.name && ['beginner', 'intermediate', 'advanced'].includes(skill.level)).slice(0, 15) : [],
})
const validProject = (project) => project.title.length >= 4 && project.title.length <= 120 && project.shortDescription.length >= 20 && project.shortDescription.length <= 240 && project.description.length >= 40 && project.description.length <= 5000 && project.category && projectTypes.has(project.projectType) && Number.isInteger(project.teamSize) && project.teamSize >= 1 && project.teamSize <= 20 && projectStatuses.has(project.status) && (!project.durationWeeks || (project.durationWeeks >= 1 && project.durationWeeks <= 104))
const projectSelect = `p.*, u.name AS owner_name, COUNT(DISTINCT tm.id)::int AS member_count,
  COALESCE(json_agg(DISTINCT jsonb_build_object('name', s.skill_name, 'level', ps.required_level)) FILTER (WHERE s.id IS NOT NULL), '[]') AS skills,
  COALESCE(json_agg(DISTINCT jsonb_build_object('id', pr.id, 'name', pr.role_name, 'description', pr.description, 'positions', pr.positions_available)) FILTER (WHERE pr.id IS NOT NULL), '[]') AS roles`
const projectJoin = `FROM projects p JOIN users u ON u.id = p.owner_id LEFT JOIN team_members tm ON tm.project_id = p.id LEFT JOIN project_skills ps ON ps.project_id = p.id LEFT JOIN skills s ON s.id = ps.skill_id LEFT JOIN project_roles pr ON pr.project_id = p.id`
const getProject = async (id, collegeId) => (await query(`${projectSelect} ${projectJoin} WHERE p.id = $1 AND p.college_id IS NOT DISTINCT FROM $2 GROUP BY p.id, u.name`, [id, collegeId])).rows[0]

app.post('/api/projects', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  try {
    const project = normalizeProject(req.body)
    if (!validProject(project)) return res.status(400).json({ message: 'Add the required project details before publishing.' })
    await client.query('BEGIN')
    const { rows } = await client.query(`INSERT INTO projects (college_id, owner_id, title, short_description, description, problem_statement, proposed_solution, technology_stack, category, project_type, team_size, recruitment_deadline, duration_weeks, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`, [req.user.college_id, req.user.id, project.title, project.shortDescription, project.description, project.problemStatement || null, project.proposedSolution || null, project.technologyStack, project.category, project.projectType, project.teamSize, project.recruitmentDeadline, project.durationWeeks, project.status])
    const id = rows[0].id
    await client.query('INSERT INTO team_members (project_id, user_id, role) VALUES ($1, $2, $3)', [id, req.user.id, 'Project owner'])
    for (const role of project.roles) await client.query('INSERT INTO project_roles (project_id, role_name, description, positions_available) VALUES ($1,$2,$3,$4)', [id, role.name, role.description || null, role.positions])
    for (const skill of project.skills) { const skillId = (await client.query('INSERT INTO skills (skill_name) VALUES ($1) ON CONFLICT (skill_name) DO UPDATE SET skill_name = EXCLUDED.skill_name RETURNING id', [skill.name])).rows[0].id; await client.query('INSERT INTO project_skills (project_id, skill_id, required_level) VALUES ($1,$2,$3)', [id, skillId, skill.level]) }
    await client.query('COMMIT')
    res.status(201).json({ project: await getProject(id, req.user.college_id) })
  } catch (error) { await client.query('ROLLBACK'); next(error) } finally { client.release() }
})

app.get('/api/projects', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, Math.min(Number(req.query.page) || 1, 10000))
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 9, 30))
    const search = clean(req.query.search)
    const category = clean(req.query.category)
    const type = clean(req.query.type)
    const skill = clean(req.query.skill)
    const technology = clean(req.query.technology)
    const requestedStatus = clean(req.query.status)
    const status = projectStatuses.has(requestedStatus) ? requestedStatus : 'recruiting'
    const sort = req.query.sort === 'closing' ? 'closing' : 'newest'
    const where = ['p.college_id IS NOT DISTINCT FROM $1', 'p.status = $2']
    const params = [req.user.college_id, status]
    const add = (sql, value) => { params.push(value); where.push(sql.replace('?', `$${params.length}`)) }
    if (search) add(`(p.title ILIKE ? OR p.short_description ILIKE ? OR p.description ILIKE ?)`.replaceAll('?', `$${params.length + 1}`), `%${search}%`)
    if (category) add('p.category = ?', category)
    if (type && projectTypes.has(type)) add('p.project_type = ?', type)
    if (technology) add(`EXISTS (SELECT 1 FROM unnest(p.technology_stack) AS tech WHERE tech ILIKE ?)`, `%${technology}%`)
    if (skill) add(`EXISTS (SELECT 1 FROM project_skills filter_ps JOIN skills filter_s ON filter_s.id = filter_ps.skill_id WHERE filter_ps.project_id = p.id AND filter_s.skill_name ILIKE ?)`, `%${skill}%`)
    const condition = where.join(' AND ')
    const order = sort === 'closing' ? 'p.recruitment_deadline ASC NULLS LAST, p.created_at DESC' : 'p.created_at DESC'
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM projects p WHERE ${condition}`, params)
    params.push(limit, (page - 1) * limit)
    const { rows } = await query(`${projectSelect} ${projectJoin} WHERE ${condition} GROUP BY p.id, u.name ORDER BY ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`, params)
    res.json({ projects: rows, pagination: { page, limit, total: countResult.rows[0].total, pages: Math.ceil(countResult.rows[0].total / limit) } })
  } catch (error) { next(error) }
})

app.post('/api/projects/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    const project = await query(`SELECT id FROM projects WHERE id = $1 AND college_id IS NOT DISTINCT FROM $2 AND status <> 'archived'`, [req.params.id, req.user.college_id])
    if (!project.rowCount) return res.status(404).json({ message: 'That project is unavailable.' })
    const result = await query('INSERT INTO bookmarks (user_id, project_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING project_id', [req.user.id, req.params.id])
    res.status(result.rowCount ? 201 : 200).json({ bookmarked: true })
  } catch (error) { next(error) }
})

app.delete('/api/projects/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM bookmarks WHERE user_id = $1 AND project_id = $2', [req.user.id, req.params.id])
    res.status(204).end()
  } catch (error) { next(error) }
})

app.post('/api/projects/:id/applications', requireAuth, async (req, res, next) => {
  try {
    const roleId = clean(req.body.roleId)
    const introduction = clean(req.body.introductionMessage)
    if (!roleId || introduction.length < 20 || introduction.length > 1500) return res.status(400).json({ message: 'Choose a role and write a short introduction of at least 20 characters.' })
    const { rows } = await query(`SELECT p.id, p.owner_id, p.status, pr.id AS role_id FROM projects p JOIN project_roles pr ON pr.project_id = p.id WHERE p.id = $1 AND p.college_id IS NOT DISTINCT FROM $2 AND pr.id = $3`, [req.params.id, req.user.college_id, roleId])
    const target = rows[0]
    if (!target || target.status !== 'recruiting') return res.status(404).json({ message: 'This project is not accepting applications.' })
    if (target.owner_id === req.user.id) return res.status(400).json({ message: 'Project owners are already part of their team.' })
    const result = await query('INSERT INTO applications (project_id, applicant_id, project_role_id, introduction_message) VALUES ($1,$2,$3,$4) RETURNING id, status, created_at', [req.params.id, req.user.id, roleId, introduction])
    await createNotification(target.owner_id, 'New project application', 'A student has applied to join your project.', 'project_application', req.params.id)
    res.status(201).json({ application: result.rows[0] })
  } catch (error) { if (error.code === '23505') return res.status(409).json({ message: 'You already have an active application for this project.' }); next(error) }
})

app.get('/api/projects/:id/applications', requireAuth, async (req, res, next) => {
  try {
    const owned = await query('SELECT id FROM projects WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id])
    if (!owned.rowCount) return res.status(403).json({ message: 'Only the project owner can review applications.' })
    const { rows } = await query(`SELECT a.id, a.introduction_message, a.status, a.created_at, pr.role_name, u.id AS applicant_id, u.name, u.department, u.academic_year, u.bio,
      COALESCE((SELECT json_agg(json_build_object('name', s.skill_name, 'level', us.proficiency_level) ORDER BY s.skill_name) FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = u.id), '[]'::json) AS skills
      FROM applications a JOIN users u ON u.id = a.applicant_id JOIN project_roles pr ON pr.id = a.project_role_id
      WHERE a.project_id = $1 ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END, a.created_at DESC`, [req.params.id])
    res.json({ applications: rows })
  } catch (error) { next(error) }
})

app.get('/api/users/me/applications', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT a.id, a.status, a.created_at, p.id AS project_id, p.title, p.category, pr.role_name FROM applications a JOIN projects p ON p.id = a.project_id JOIN project_roles pr ON pr.id = a.project_role_id WHERE a.applicant_id = $1 ORDER BY a.created_at DESC`, [req.user.id])
    res.json({ applications: rows })
  } catch (error) { next(error) }
})

app.patch('/api/applications/:id/status', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  try {
    const status = clean(req.body.status)
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ message: 'Choose either accepted or rejected.' })
    await client.query('BEGIN')
    const application = await client.query(`SELECT a.*, p.owner_id, p.status AS project_status, p.team_size, pr.role_name, pr.positions_available FROM applications a JOIN projects p ON p.id = a.project_id JOIN project_roles pr ON pr.id = a.project_role_id WHERE a.id = $1 FOR UPDATE`, [req.params.id])
    const record = application.rows[0]
    if (!record || record.owner_id !== req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ message: 'Only the project owner can make this decision.' }) }
    if (record.status !== 'pending') { await client.query('ROLLBACK'); return res.status(409).json({ message: 'This application has already been decided.' }) }
    if (status === 'accepted') {
      if (record.project_status !== 'recruiting') { await client.query('ROLLBACK'); return res.status(409).json({ message: 'Recruitment is closed for this project.' }) }
      const team = await client.query('SELECT COUNT(*)::int AS count FROM team_members WHERE project_id = $1', [record.project_id])
      const roleMembers = await client.query('SELECT COUNT(*)::int AS count FROM team_members WHERE project_id = $1 AND role = $2', [record.project_id, record.role_name])
      if (team.rows[0].count >= record.team_size || roleMembers.rows[0].count >= record.positions_available) { await client.query('ROLLBACK'); return res.status(409).json({ message: 'This team or role is already at capacity.' }) }
      await client.query('INSERT INTO team_members (project_id, user_id, role) VALUES ($1,$2,$3)', [record.project_id, record.applicant_id, record.role_name])
    }
    await client.query('UPDATE applications SET status = $1, updated_at = now() WHERE id = $2', [status, record.id])
    await client.query('COMMIT')
    await createNotification(record.applicant_id, status === 'accepted' ? 'You joined a project team' : 'Project application update', status === 'accepted' ? `You were accepted for the ${record.role_name} role.` : 'Your application was not selected this time.', `application_${status}`, record.project_id)
    res.json({ message: status === 'accepted' ? 'Applicant accepted and added to the team.' : 'Application declined.', application: { id: record.id, status } })
  } catch (error) { await client.query('ROLLBACK'); if (error.code === '23505') return res.status(409).json({ message: 'This student is already on the team.' }); next(error) } finally { client.release() }
})

app.patch('/api/applications/:id/withdraw', requireAuth, async (req, res, next) => {
  try { const { rowCount } = await query(`UPDATE applications SET status = 'withdrawn', updated_at = now() WHERE id = $1 AND applicant_id = $2 AND status = 'pending'`, [req.params.id, req.user.id]); if (!rowCount) return res.status(404).json({ message: 'That pending application was not found.' }); res.json({ message: 'Application withdrawn.' }) } catch (error) { next(error) }
})

app.get('/api/projects/:id/team', requireAuth, async (req, res, next) => {
  try {
    const access = await query(`SELECT p.id, p.title, p.owner_id, p.team_size, p.status FROM projects p JOIN team_members tm ON tm.project_id = p.id WHERE p.id = $1 AND tm.user_id = $2 AND p.college_id IS NOT DISTINCT FROM $3`, [req.params.id, req.user.id, req.user.college_id])
    if (!access.rowCount) return res.status(403).json({ message: 'Only team members can view this team.' })
    const { rows: members } = await query(`SELECT tm.id, tm.user_id, tm.role, tm.joined_at, u.name, u.department, u.academic_year, u.bio, u.github_url, u.portfolio_url FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.project_id = $1 ORDER BY CASE WHEN tm.user_id = $2 THEN 0 ELSE 1 END, tm.joined_at`, [req.params.id, access.rows[0].owner_id])
    res.json({ project: access.rows[0], members })
  } catch (error) { next(error) }
})

app.get('/api/users/me/teams', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT p.id, p.title, p.category, p.status, p.team_size, p.owner_id, tm.role, COUNT(all_tm.id)::int AS member_count FROM team_members tm JOIN projects p ON p.id = tm.project_id LEFT JOIN team_members all_tm ON all_tm.project_id = p.id WHERE tm.user_id = $1 AND p.college_id IS NOT DISTINCT FROM $2 GROUP BY p.id, tm.role ORDER BY p.updated_at DESC`, [req.user.id, req.user.college_id])
    res.json({ teams: rows })
  } catch (error) { next(error) }
})

app.delete('/api/projects/:id/team/:userId', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const project = await client.query('SELECT owner_id FROM projects WHERE id = $1 FOR UPDATE', [req.params.id])
    if (req.params.userId === 'me') {
      if (!project.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Project not found.' }) }
      if (project.rows[0].owner_id === req.user.id) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Project owners must transfer ownership before leaving.' }) }
      const left = await client.query('DELETE FROM team_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.user.id])
      if (!left.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'You are not a member of this team.' }) }
      await client.query('COMMIT'); return res.json({ message: 'You have left the team.' })
    }
    if (!project.rowCount || project.rows[0].owner_id !== req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ message: 'Only the project owner can remove a member.' }) }
    if (req.params.userId === req.user.id) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Transfer ownership before leaving your own project.' }) }
    const result = await client.query('DELETE FROM team_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.params.userId])
    if (!result.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'That team member was not found.' }) }
    await client.query('COMMIT'); res.json({ message: 'Team member removed.' })
  } catch (error) { await client.query('ROLLBACK'); next(error) } finally { client.release() }
})

app.delete('/api/projects/:id/team/me', requireAuth, async (req, res, next) => {
  try {
    const project = await query('SELECT owner_id FROM projects WHERE id = $1', [req.params.id])
    if (!project.rowCount) return res.status(404).json({ message: 'Project not found.' })
    if (project.rows[0].owner_id === req.user.id) return res.status(400).json({ message: 'Project owners must transfer ownership before leaving.' })
    const result = await query('DELETE FROM team_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.user.id])
    if (!result.rowCount) return res.status(404).json({ message: 'You are not a member of this team.' })
    res.json({ message: 'You have left the team.' })
  } catch (error) { next(error) }
})

app.patch('/api/projects/:id/owner', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  try {
    const newOwnerId = clean(req.body.userId)
    await client.query('BEGIN')
    const project = await client.query('SELECT owner_id FROM projects WHERE id = $1 FOR UPDATE', [req.params.id])
    if (!project.rowCount || project.rows[0].owner_id !== req.user.id) { await client.query('ROLLBACK'); return res.status(403).json({ message: 'Only the current owner can transfer ownership.' }) }
    if (!newOwnerId || newOwnerId === req.user.id) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Choose a different team member as the new owner.' }) }
    const member = await client.query('SELECT id FROM team_members WHERE project_id = $1 AND user_id = $2', [req.params.id, newOwnerId])
    if (!member.rowCount) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'The new owner must already be on the team.' }) }
    await client.query('UPDATE projects SET owner_id = $1, updated_at = now() WHERE id = $2', [newOwnerId, req.params.id])
    await client.query(`UPDATE team_members SET role = CASE WHEN user_id = $1 THEN 'Project owner' WHEN user_id = $2 AND role = 'Project owner' THEN 'Team member' ELSE role END WHERE project_id = $3`, [newOwnerId, req.user.id, req.params.id])
    await client.query('COMMIT'); res.json({ message: 'Project ownership transferred.' })
  } catch (error) { await client.query('ROLLBACK'); next(error) } finally { client.release() }
})

async function requireTeamMember(projectId, userId, collegeId) {
  const { rows } = await query(`SELECT p.id, p.owner_id FROM projects p JOIN team_members tm ON tm.project_id = p.id WHERE p.id = $1 AND tm.user_id = $2 AND p.college_id IS NOT DISTINCT FROM $3`, [projectId, userId, collegeId])
  return rows[0]
}

app.get('/api/projects/:id/workspace', requireAuth, async (req, res, next) => {
  try {
    const team = await requireTeamMember(req.params.id, req.user.id, req.user.college_id)
    if (!team) return res.status(403).json({ message: 'Only team members can access this workspace.' })
    const [tasks, announcements, resources, milestones] = await Promise.all([
      query(`SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to WHERE t.project_id = $1 ORDER BY t.status, t.due_date NULLS LAST, t.created_at`, [req.params.id]),
      query(`SELECT a.*, u.name AS author_name FROM announcements a JOIN users u ON u.id = a.author_id WHERE a.project_id = $1 ORDER BY a.created_at DESC`, [req.params.id]),
      query('SELECT * FROM project_resources WHERE project_id = $1 ORDER BY created_at DESC', [req.params.id]),
      query('SELECT * FROM milestones WHERE project_id = $1 ORDER BY due_date NULLS LAST', [req.params.id]),
    ])
    res.json({ tasks: tasks.rows, announcements: announcements.rows, resources: resources.rows, milestones: milestones.rows })
  } catch (error) { next(error) }
})

app.post('/api/projects/:id/tasks', requireAuth, async (req, res, next) => {
  try {
    const team = await requireTeamMember(req.params.id, req.user.id, req.user.college_id)
    const title = clean(req.body.title); const description = clean(req.body.description); const assignedTo = clean(req.body.assignedTo) || null; const dueDate = clean(req.body.dueDate) || null
    if (!team) return res.status(403).json({ message: 'Only team members can create tasks.' })
    if (title.length < 2 || title.length > 160 || description.length > 2000) return res.status(400).json({ message: 'Check the task details and try again.' })
    if (assignedTo) { const member = await query('SELECT id FROM team_members WHERE project_id = $1 AND user_id = $2', [req.params.id, assignedTo]); if (!member.rowCount) return res.status(400).json({ message: 'Tasks can only be assigned to a project member.' }) }
    const { rows } = await query('INSERT INTO tasks (project_id, assigned_to, created_by, title, description, due_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [req.params.id, assignedTo, req.user.id, title, description || null, dueDate])
    if (assignedTo && assignedTo !== req.user.id) await createNotification(assignedTo, 'New task assignment', `You were assigned: ${title}`, 'task_assignment', req.params.id)
    res.status(201).json({ task: rows[0] })
  } catch (error) { next(error) }
})

app.patch('/api/tasks/:id', requireAuth, async (req, res, next) => {
  try {
    const task = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]); const record = task.rows[0]
    if (!record) return res.status(404).json({ message: 'Task not found.' })
    const team = await requireTeamMember(record.project_id, req.user.id, req.user.college_id)
    if (!team) return res.status(403).json({ message: 'Only team members can update tasks.' })
    const status = clean(req.body.status); if (!['todo', 'in_progress', 'completed'].includes(status)) return res.status(400).json({ message: 'Choose a valid task status.' })
    const { rows } = await query('UPDATE tasks SET status = $1, updated_at = now() WHERE id = $2 RETURNING *', [status, record.id]); res.json({ task: rows[0] })
  } catch (error) { next(error) }
})

app.post('/api/projects/:id/announcements', requireAuth, async (req, res, next) => {
  try { const team = await requireTeamMember(req.params.id, req.user.id, req.user.college_id); const message = clean(req.body.message); if (!team) return res.status(403).json({ message: 'Only team members can post announcements.' }); if (message.length < 2 || message.length > 2000) return res.status(400).json({ message: 'Write an announcement between 2 and 2,000 characters.' }); const { rows } = await query('INSERT INTO announcements (project_id, author_id, message) VALUES ($1,$2,$3) RETURNING *', [req.params.id, req.user.id, message]); const members = await query('SELECT user_id FROM team_members WHERE project_id = $1 AND user_id <> $2', [req.params.id, req.user.id]); await Promise.all(members.rows.map((member) => createNotification(member.user_id, 'New team announcement', message, 'team_announcement', req.params.id))); res.status(201).json({ announcement: rows[0] }) } catch (error) { next(error) }
})

app.post('/api/projects/:id/resources', requireAuth, async (req, res, next) => {
  try { const team = await requireTeamMember(req.params.id, req.user.id, req.user.college_id); const label = clean(req.body.label); const url = clean(req.body.url); if (!team) return res.status(403).json({ message: 'Only team members can add resources.' }); if (label.length < 2 || label.length > 120 || !/^https:\/\/.+/i.test(url)) return res.status(400).json({ message: 'Add a label and a secure https link.' }); const { rows } = await query('INSERT INTO project_resources (project_id, added_by, label, url) VALUES ($1,$2,$3,$4) RETURNING *', [req.params.id, req.user.id, label, url]); res.status(201).json({ resource: rows[0] }) } catch (error) { next(error) }
})

app.post('/api/projects/:id/milestones', requireAuth, async (req, res, next) => {
  try { const team = await requireTeamMember(req.params.id, req.user.id, req.user.college_id); const title = clean(req.body.title); const dueDate = clean(req.body.dueDate) || null; if (!team || team.owner_id !== req.user.id) return res.status(403).json({ message: 'Only the project owner can create milestones.' }); if (title.length < 2 || title.length > 160) return res.status(400).json({ message: 'Add a clear milestone title.' }); const { rows } = await query('INSERT INTO milestones (project_id, title, due_date) VALUES ($1,$2,$3) RETURNING *', [req.params.id, title, dueDate]); res.status(201).json({ milestone: rows[0] }) } catch (error) { next(error) }
})

app.get('/api/projects/:id', requireAuth, async (req, res, next) => { try { const project = await getProject(req.params.id, req.user.college_id); if (!project) return res.status(404).json({ message: 'That project is unavailable.' }); res.json({ project }) } catch (error) { next(error) } })

app.patch('/api/projects/:id', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  try {
    const owned = await client.query('SELECT id FROM projects WHERE id = $1 AND owner_id = $2 FOR UPDATE', [req.params.id, req.user.id])
    if (!owned.rowCount) return res.status(403).json({ message: 'Only the project owner can update this project.' })
    const project = normalizeProject(req.body)
    if (!validProject(project)) return res.status(400).json({ message: 'Check the project details and try again.' })
    await client.query('BEGIN')
    await client.query(`UPDATE projects SET title=$1, short_description=$2, description=$3, problem_statement=$4, proposed_solution=$5, technology_stack=$6, category=$7, project_type=$8, team_size=$9, recruitment_deadline=$10, duration_weeks=$11, status=$12, updated_at=now() WHERE id=$13`, [project.title, project.shortDescription, project.description, project.problemStatement || null, project.proposedSolution || null, project.technologyStack, project.category, project.projectType, project.teamSize, project.recruitmentDeadline, project.durationWeeks, project.status, req.params.id])
    await client.query('DELETE FROM project_roles WHERE project_id = $1', [req.params.id]); await client.query('DELETE FROM project_skills WHERE project_id = $1', [req.params.id])
    for (const role of project.roles) await client.query('INSERT INTO project_roles (project_id, role_name, description, positions_available) VALUES ($1,$2,$3,$4)', [req.params.id, role.name, role.description || null, role.positions])
    for (const skill of project.skills) { const skillId = (await client.query('INSERT INTO skills (skill_name) VALUES ($1) ON CONFLICT (skill_name) DO UPDATE SET skill_name = EXCLUDED.skill_name RETURNING id', [skill.name])).rows[0].id; await client.query('INSERT INTO project_skills (project_id, skill_id, required_level) VALUES ($1,$2,$3)', [req.params.id, skillId, skill.level]) }
    await client.query('COMMIT'); res.json({ project: await getProject(req.params.id, req.user.college_id) })
  } catch (error) { await client.query('ROLLBACK'); next(error) } finally { client.release() }
})

app.delete('/api/projects/:id', requireAuth, async (req, res, next) => { try { const { rowCount } = await query(`UPDATE projects SET status = 'archived', updated_at = now() WHERE id = $1 AND owner_id = $2 AND status <> 'archived'`, [req.params.id, req.user.id]); if (!rowCount) return res.status(404).json({ message: 'That active project was not found.' }); res.status(204).end() } catch (error) { next(error) } })

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Something went wrong. Please try again.' })
})

export { app }

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`ProjectCollab API running at http://localhost:${port}`))
}
