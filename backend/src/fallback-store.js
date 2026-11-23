import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const storePath = path.join(dataDir, 'store.json')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const defaultCollege = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'MIT Academy of Engineering (MIT AOE)',
  email_domain: 'mitaoe.ac.in',
  created_at: new Date().toISOString()
}

const defaultOwner = {
  id: '22222222-2222-2222-2222-222222222222',
  college_id: defaultCollege.id,
  name: 'Aarav Sharma',
  email: '202401100001@mitaoe.ac.in',
  password_hash: '$2b$12$eX4zX3Xp0O.r8Qo15Gf0z.M8M3a5nOqL4s6t9u2v5w8x1y4z7a0b', // dummy hash
  role: 'student',
  account_status: 'active',
  department: 'Computer Engineering',
  academic_year: 3,
  bio: 'Passionate about full-stack systems, campus transit, and student developer collaboration.',
  profile_picture_url: '',
  github_url: 'https://github.com/mitaoe-student',
  portfolio_url: '',
  availability: 'open',
  preferred_categories: ['Web development', 'Mobile apps', 'Hardware & IoT'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const defaultSkills = [
  { id: 's-1', skill_name: 'React' },
  { id: 's-2', skill_name: 'Node.js' },
  { id: 's-3', skill_name: 'PostgreSQL' },
  { id: 's-4', skill_name: 'Leaflet.js' },
  { id: 's-5', skill_name: 'Python' },
  { id: 's-6', skill_name: 'ESP32' },
  { id: 's-7', skill_name: 'MQTT' }
]

const defaultProjects = [
  {
    id: 'p-1',
    college_id: defaultCollege.id,
    owner_id: defaultOwner.id,
    title: 'MIT AOE Smart Campus Shuttle Tracker',
    short_description: 'Real-time GPS tracking and occupancy monitor for MIT AOE campus shuttles between Alandi and Pune city.',
    description: 'An IoT and web-based platform providing live GPS tracking, arrival time predictions, and seat availability for college buses. Designed to eliminate long waiting queues at Alandi depot and help students commute safely.',
    problem_statement: 'Students and faculty face unpredictable transit timings and crowded shuttle buses between Alandi and Swargate/Pune Station without any real-time tracking system.',
    proposed_solution: 'Deploy ESP32 GPS/cellular telemetry nodes on campus buses and connect them to a lightweight web dashboard that displays live vehicle locations, estimated arrival times, and passenger count.',
    technology_stack: ['React', 'Express', 'Node.js', 'Leaflet.js', 'PostgreSQL'],
    category: 'Web development',
    project_type: 'mini_project',
    team_size: 4,
    recruitment_deadline: '2026-11-30',
    duration_weeks: 8,
    status: 'recruiting',
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updated_at: new Date().toISOString()
  }
]

const defaultRoles = [
  { id: 'pr-1', project_id: 'p-1', role_name: 'Frontend Developer', description: 'Build interactive map UI in React & Leaflet', positions_available: 1 },
  { id: 'pr-2', project_id: 'p-1', role_name: 'Backend & API Engineer', description: 'Implement REST & WebSocket endpoints', positions_available: 1 },
  { id: 'pr-3', project_id: 'p-1', role_name: 'IoT Hardware Lead', description: 'Interface GPS/GSM modules with microcontroller', positions_available: 1 }
]

const defaultProjectSkills = [
  { project_id: 'p-1', skill_id: 's-1', required_level: 'intermediate' },
  { project_id: 'p-1', skill_id: 's-2', required_level: 'intermediate' },
  { project_id: 'p-1', skill_id: 's-4', required_level: 'beginner' }
]

const defaultTeamMembers = [
  { id: 'tm-1', project_id: 'p-1', user_id: defaultOwner.id, role: 'Project owner', joined_at: new Date().toISOString() }
]

function getInitialStore() {
  return {
    colleges: [defaultCollege],
    users: [defaultOwner],
    skills: [...defaultSkills],
    user_skills: [
      { user_id: defaultOwner.id, skill_id: 's-1', proficiency_level: 'advanced' },
      { user_id: defaultOwner.id, skill_id: 's-2', proficiency_level: 'intermediate' }
    ],
    user_interests: [
      { user_id: defaultOwner.id, interest: 'Web Development' },
      { user_id: defaultOwner.id, interest: 'Campus Automation' }
    ],
    projects: [...defaultProjects],
    project_roles: [...defaultRoles],
    project_skills: [...defaultProjectSkills],
    team_members: [...defaultTeamMembers],
    bookmarks: [],
    applications: [],
    tasks: [
      {
        id: 't-1',
        project_id: 'p-1',
        assigned_to: defaultOwner.id,
        created_by: defaultOwner.id,
        title: 'Draft API contracts for GPS telemetry endpoints',
        description: 'Define payload JSON schemas and update rate limits.',
        status: 'in_progress',
        due_date: '2026-11-10',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    announcements: [
      {
        id: 'a-1',
        project_id: 'p-1',
        author_id: defaultOwner.id,
        message: 'Welcome everyone! We are recruiting frontend and IoT engineers for the shuttle project.',
        created_at: new Date().toISOString()
      }
    ],
    project_resources: [
      {
        id: 'r-1',
        project_id: 'p-1',
        added_by: defaultOwner.id,
        label: 'MIT AOE Shuttle Route Maps',
        url: 'https://mitaoe.ac.in',
        created_at: new Date().toISOString()
      }
    ],
    milestones: [
      {
        id: 'm-1',
        project_id: 'p-1',
        title: 'Working Prototype Demo on Campus Bus #4',
        due_date: '2026-11-25',
        created_at: new Date().toISOString()
      }
    ],
    notifications: []
  }
}

let memoryStore = null

function loadStore() {
  if (memoryStore) return memoryStore
  try {
    if (fs.existsSync(storePath)) {
      const data = fs.readFileSync(storePath, 'utf8')
      memoryStore = JSON.parse(data)
      if (!memoryStore.colleges?.length) {
        memoryStore.colleges = [defaultCollege]
      }
      return memoryStore
    }
  } catch (err) {
    console.error('[FallbackStore] Failed to read store file, re-initializing:', err.message)
  }
  memoryStore = getInitialStore()
  saveStore()
  return memoryStore
}

function saveStore() {
  if (!memoryStore) return
  try {
    fs.writeFileSync(storePath, JSON.stringify(memoryStore, null, 2), 'utf8')
    if (mongoose.connection?.readyState === 1) {
      syncToMongo().catch(() => {})
    }
  } catch (err) {
    console.error('[FallbackStore] Failed to persist store:', err.message)
  }
}

let syncTimeout = null
async function syncToMongo() {
  if (syncTimeout) clearTimeout(syncTimeout)
  syncTimeout = setTimeout(async () => {
    if (mongoose.connection?.readyState !== 1 || !memoryStore) return
    try {
      const db = mongoose.connection.db
      const collections = [
        'colleges', 'users', 'skills', 'user_skills', 'user_interests',
        'projects', 'project_roles', 'project_skills', 'team_members',
        'bookmarks', 'applications', 'tasks', 'announcements',
        'project_resources', 'milestones', 'notifications'
      ]
      for (const col of collections) {
        if (memoryStore[col]?.length) {
          const c = db.collection(col)
          await c.deleteMany({})
          const docs = memoryStore[col].map(d => ({ ...d, _id: d.id || d._id }))
          await c.insertMany(docs)
        }
      }
    } catch {
      // background sync silently catches
    }
  }, 100)
}

function genId() {
  return crypto.randomUUID()
}

export function executeFallbackQuery(sqlText, params = []) {
  const store = loadStore()
  const sql = sqlText.trim().replace(/\s+/g, ' ')

  // 1. Transaction statements
  if (/^BEGIN/i.test(sql) || /^COMMIT/i.test(sql) || /^ROLLBACK/i.test(sql)) {
    return { rows: [], rowCount: 0 }
  }

  // 2. Colleges
  if (/SELECT id FROM colleges WHERE email_domain/i.test(sql)) {
    const domain = (params[0] || '').toLowerCase()
    const college = store.colleges.find((c) => (c.email_domain || '').toLowerCase() === domain)
    return { rows: college ? [{ id: college.id }] : [], rowCount: college ? 1 : 0 }
  }

  // 3. Insert user (Register)
  if (/INSERT INTO users/i.test(sql) && /verification_token_hash/i.test(sql)) {
    const [name, email, passwordHash, collegeId, verificationTokenHash, verificationExpiresAt] = params
    const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      existing.name = name || existing.name
      existing.password_hash = passwordHash
      existing.account_status = 'active'
      existing.updated_at = new Date().toISOString()
      saveStore()
      return {
        rows: [{ id: existing.id, name: existing.name, email: existing.email, role: existing.role, college_id: existing.college_id }],
        rowCount: 1
      }
    }
    const newUser = {
      id: genId(),
      name,
      email,
      password_hash: passwordHash,
      college_id: collegeId || defaultCollege.id,
      role: 'student',
      account_status: 'active',
      department: '',
      academic_year: null,
      bio: '',
      profile_picture_url: '',
      github_url: '',
      portfolio_url: '',
      availability: 'open',
      preferred_categories: [],
      verification_token_hash: verificationTokenHash,
      verification_expires_at: verificationExpiresAt ? new Date(verificationExpiresAt).toISOString() : null,
      reset_token_hash: null,
      reset_expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    store.users.push(newUser)
    saveStore()
    return {
      rows: [{ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, college_id: newUser.college_id }],
      rowCount: 1
    }
  }

  // 4. Verify email
  if (/UPDATE users SET account_status = 'active'/i.test(sql) && /verification_token_hash/i.test(sql)) {
    const [tokenHash] = params
    const user = store.users.find(
      (u) => u.verification_token_hash === tokenHash && (!u.verification_expires_at || new Date(u.verification_expires_at) > new Date())
    )
    if (!user) return { rows: [], rowCount: 0 }
    user.account_status = 'active'
    user.verification_token_hash = null
    user.verification_expires_at = null
    user.updated_at = new Date().toISOString()
    saveStore()
    return {
      rows: [{ id: user.id, name: user.name, email: user.email, role: user.role, college_id: user.college_id }],
      rowCount: 1
    }
  }

  // 5. Select user by email (Login)
  if (/SELECT \* FROM users WHERE email = \$1/i.test(sql)) {
    const email = (params[0] || '').toLowerCase()
    const user = store.users.find((u) => u.email.toLowerCase() === email)
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 }
  }

  // 5b. Select user by ID (requireAuth)
  if (/SELECT .* FROM users WHERE id = \$1/i.test(sql) && !/profileFields/i.test(sql)) {
    const userId = params[0]
    const user = store.users.find((u) => u.id === userId)
    return {
      rows: user
        ? [
            {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              account_status: user.account_status,
              college_id: user.college_id
            }
          ]
        : [],
      rowCount: user ? 1 : 0
    }
  }

  // 6. Forgot password (update reset token)
  if (/UPDATE users SET reset_token_hash/i.test(sql) && /WHERE email = \$3/i.test(sql)) {
    const [tokenHash, expiresAt, email] = params
    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (user) {
      user.reset_token_hash = tokenHash
      user.reset_expires_at = expiresAt ? new Date(expiresAt).toISOString() : null
      user.updated_at = new Date().toISOString()
      saveStore()
      return { rows: [], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }

  // 7. Reset password
  if (/UPDATE users SET password_hash = \$1.*WHERE reset_token_hash/i.test(sql)) {
    const [passwordHash, tokenHash] = params
    const user = store.users.find(
      (u) => u.reset_token_hash === tokenHash && (!u.reset_expires_at || new Date(u.reset_expires_at) > new Date())
    )
    if (!user) return { rows: [], rowCount: 0 }
    user.password_hash = passwordHash
    user.reset_token_hash = null
    user.reset_expires_at = null
    user.updated_at = new Date().toISOString()
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  // 8. User profile
  if (/SELECT .*profileFields.* FROM users u/i.test(sql) || /SELECT u\.id, u\.name, u\.department/i.test(sql)) {
    const userId = params[0]
    const user = store.users.find((u) => u.id === userId)
    if (!user) return { rows: [], rowCount: 0 }
    const college = store.colleges.find((c) => c.id === user.college_id)
    const userSkills = store.user_skills
      .filter((us) => us.user_id === user.id)
      .map((us) => {
        const s = store.skills.find((skill) => skill.id === us.skill_id)
        return { name: s ? s.skill_name : '', level: us.proficiency_level }
      })
      .filter((s) => s.name)
    const userInterests = store.user_interests
      .filter((ui) => ui.user_id === user.id)
      .map((ui) => ui.interest)

    const profile = {
      id: user.id,
      name: user.name,
      department: user.department || '',
      academic_year: user.academic_year || null,
      bio: user.bio || '',
      profile_picture_url: user.profile_picture_url || '',
      github_url: user.github_url || '',
      portfolio_url: user.portfolio_url || '',
      availability: user.availability || 'open',
      preferred_categories: user.preferred_categories || [],
      college_name: college ? college.name : 'MIT Academy of Engineering',
      skills: userSkills,
      interests: userInterests
    }
    return { rows: [profile], rowCount: 1 }
  }

  // 9. Update user profile fields
  if (/UPDATE users SET department = \$1/i.test(sql)) {
    const [department, academicYear, bio, profilePictureUrl, githubUrl, portfolioUrl, availability, preferredCategories, userId] = params
    const user = store.users.find((u) => u.id === userId)
    if (user) {
      user.department = department
      user.academic_year = academicYear
      user.bio = bio
      user.profile_picture_url = profilePictureUrl
      user.github_url = githubUrl
      user.portfolio_url = portfolioUrl
      user.availability = availability
      user.preferred_categories = preferredCategories
      user.updated_at = new Date().toISOString()
      saveStore()
      return { rows: [], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }

  // 10. User skills & interests management
  if (/DELETE FROM user_skills WHERE user_id = \$1/i.test(sql)) {
    const [userId] = params
    store.user_skills = store.user_skills.filter((us) => us.user_id !== userId)
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  if (/INSERT INTO skills \(skill_name\)/i.test(sql)) {
    const [skillName] = params
    let skill = store.skills.find((s) => s.skill_name.toLowerCase() === skillName.toLowerCase())
    if (!skill) {
      skill = { id: genId(), skill_name: skillName }
      store.skills.push(skill)
      saveStore()
    }
    return { rows: [{ id: skill.id }], rowCount: 1 }
  }

  if (/INSERT INTO user_skills \(user_id, skill_id, proficiency_level\)/i.test(sql)) {
    const [userId, skillId, level] = params
    store.user_skills.push({ user_id: userId, skill_id: skillId, proficiency_level: level })
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  if (/DELETE FROM user_interests WHERE user_id = \$1/i.test(sql)) {
    const [userId] = params
    store.user_interests = store.user_interests.filter((ui) => ui.user_id !== userId)
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  if (/INSERT INTO user_interests \(user_id, interest\)/i.test(sql)) {
    const [userId, interest] = params
    store.user_interests.push({ user_id: userId, interest })
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  // 11. Projects helper: populate project details
  const hydrateProject = (p) => {
    const owner = store.users.find((u) => u.id === p.owner_id)
    const members = store.team_members.filter((tm) => tm.project_id === p.id)
    const skills = store.project_skills
      .filter((ps) => ps.project_id === p.id)
      .map((ps) => {
        const s = store.skills.find((skill) => skill.id === ps.skill_id)
        return { name: s ? s.skill_name : '', level: ps.required_level }
      })
      .filter((s) => s.name)
    const roles = store.project_roles
      .filter((pr) => pr.project_id === p.id)
      .map((pr) => ({ id: pr.id, name: pr.role_name, description: pr.description || '', positions: pr.positions_available }))
    return {
      ...p,
      owner_name: owner ? owner.name : 'Student Owner',
      member_count: members.length,
      skills,
      roles
    }
  }

  // 12. Create project
  if (/INSERT INTO projects/i.test(sql) && /RETURNING id/i.test(sql)) {
    const [collegeId, ownerId, title, shortDescription, description, problemStatement, proposedSolution, technologyStack, category, projectType, teamSize, recruitmentDeadline, durationWeeks, status] = params
    const id = genId()
    const newProject = {
      id,
      college_id: collegeId || defaultCollege.id,
      owner_id: ownerId,
      title,
      short_description: shortDescription,
      description,
      problem_statement: problemStatement,
      proposed_solution: proposedSolution,
      technology_stack: technologyStack || [],
      category,
      project_type: projectType,
      team_size: teamSize,
      recruitment_deadline: recruitmentDeadline,
      duration_weeks: durationWeeks,
      status: status || 'recruiting',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    store.projects.unshift(newProject)
    saveStore()
    return { rows: [{ id }], rowCount: 1 }
  }

  // 13. Team members insert
  if (/INSERT INTO team_members/i.test(sql)) {
    const [projectId, userId, role] = params
    const existing = store.team_members.find((tm) => tm.project_id === projectId && tm.user_id === userId)
    if (existing) {
      const err = new Error('Student is already on team')
      err.code = '23505'
      throw err
    }
    const newMember = { id: genId(), project_id: projectId, user_id: userId, role, joined_at: new Date().toISOString() }
    store.team_members.push(newMember)
    saveStore()
    return { rows: [newMember], rowCount: 1 }
  }

  // 14. Project roles insert
  if (/INSERT INTO project_roles/i.test(sql)) {
    const [projectId, roleName, description, positionsAvailable] = params
    const newRole = { id: genId(), project_id: projectId, role_name: roleName, description, positions_available: positionsAvailable }
    store.project_roles.push(newRole)
    saveStore()
    return { rows: [newRole], rowCount: 1 }
  }

  // 15. Project skills insert
  if (/INSERT INTO project_skills/i.test(sql)) {
    const [projectId, skillId, requiredLevel] = params
    store.project_skills.push({ project_id: projectId, skill_id: skillId, required_level: requiredLevel })
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  // 16. Single Project query (getProject)
  if (/WHERE p\.id = \$1/i.test(sql) && /FROM projects p/i.test(sql) && /GROUP BY p\.id/i.test(sql)) {
    const projectId = params[0]
    const p = store.projects.find((proj) => proj.id === projectId)
    return { rows: p ? [hydrateProject(p)] : [], rowCount: p ? 1 : 0 }
  }

  // 17. Projects count
  if (/SELECT COUNT\(\*\)::int AS total FROM projects p/i.test(sql)) {
    const activeProjects = store.projects.filter((p) => p.status !== 'archived')
    return { rows: [{ total: activeProjects.length }], rowCount: 1 }
  }

  // 18. Projects list (Discover)
  if (/FROM projects p JOIN users u/i.test(sql) && /ORDER BY/i.test(sql) && /LIMIT/i.test(sql)) {
    const activeProjects = store.projects
      .filter((p) => p.status !== 'archived')
      .map(hydrateProject)
    return { rows: activeProjects, rowCount: activeProjects.length }
  }

  // 19. Check project access or existence
  if (/SELECT id FROM projects WHERE id = \$1/i.test(sql)) {
    const projectId = params[0]
    const p = store.projects.find((proj) => proj.id === projectId && proj.status !== 'archived')
    return { rows: p ? [{ id: p.id }] : [], rowCount: p ? 1 : 0 }
  }

  // 20. Bookmarks
  if (/INSERT INTO bookmarks/i.test(sql)) {
    const [userId, projectId] = params
    const exists = store.bookmarks.some((b) => b.user_id === userId && b.project_id === projectId)
    if (!exists) {
      store.bookmarks.push({ id: genId(), user_id: userId, project_id: projectId, created_at: new Date().toISOString() })
      saveStore()
      return { rows: [{ project_id: projectId }], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }

  if (/DELETE FROM bookmarks/i.test(sql)) {
    const [userId, projectId] = params
    store.bookmarks = store.bookmarks.filter((b) => !(b.user_id === userId && b.project_id === projectId))
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  if (/FROM bookmarks b/i.test(sql)) {
    const userId = params[0]
    const userBookmarks = store.bookmarks.filter((b) => b.user_id === userId)
    const bookmarkedProjects = userBookmarks
      .map((b) => {
        const p = store.projects.find((proj) => proj.id === b.project_id)
        return p ? { ...hydrateProject(p), bookmarked_at: b.created_at } : null
      })
      .filter(Boolean)
    return { rows: bookmarkedProjects, rowCount: bookmarkedProjects.length }
  }

  // 21. Applications
  if (/INSERT INTO applications/i.test(sql)) {
    const [projectId, applicantId, roleId, intro] = params
    const existing = store.applications.find((a) => a.project_id === projectId && a.applicant_id === applicantId && a.status === 'pending')
    if (existing) {
      const err = new Error('You already have an active application')
      err.code = '23505'
      throw err
    }
    const newApp = {
      id: genId(),
      project_id: projectId,
      applicant_id: applicantId,
      project_role_id: roleId,
      introduction_message: intro,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    store.applications.push(newApp)
    saveStore()
    return { rows: [{ id: newApp.id, status: newApp.status, created_at: newApp.created_at }], rowCount: 1 }
  }

  if (/FROM applications a JOIN users u/i.test(sql) && /a\.project_id = \$1/i.test(sql)) {
    const projectId = params[0]
    const apps = store.applications
      .filter((a) => a.project_id === projectId)
      .map((a) => {
        const u = store.users.find((user) => user.id === a.applicant_id)
        const role = store.project_roles.find((r) => r.id === a.project_role_id)
        const userSkills = store.user_skills
          .filter((us) => us.user_id === a.applicant_id)
          .map((us) => {
            const s = store.skills.find((skill) => skill.id === us.skill_id)
            return { name: s ? s.skill_name : '', level: us.proficiency_level }
          })
        return {
          id: a.id,
          introduction_message: a.introduction_message,
          status: a.status,
          created_at: a.created_at,
          role_name: role ? role.role_name : 'Team member',
          applicant_id: a.applicant_id,
          name: u ? u.name : 'Applicant',
          department: u ? u.department : '',
          academic_year: u ? u.academic_year : null,
          bio: u ? u.bio : '',
          skills: userSkills
        }
      })
    return { rows: apps, rowCount: apps.length }
  }

  if (/FROM applications a JOIN projects p/i.test(sql) && /a\.applicant_id = \$1/i.test(sql)) {
    const applicantId = params[0]
    const apps = store.applications
      .filter((a) => a.applicant_id === applicantId)
      .map((a) => {
        const p = store.projects.find((proj) => proj.id === a.project_id)
        const role = store.project_roles.find((r) => r.id === a.project_role_id)
        return {
          id: a.id,
          status: a.status,
          created_at: a.created_at,
          project_id: a.project_id,
          title: p ? p.title : 'Project',
          category: p ? p.category : '',
          role_name: role ? role.role_name : 'Member'
        }
      })
    return { rows: apps, rowCount: apps.length }
  }

  if (/FROM applications a JOIN projects p JOIN project_roles pr WHERE a\.id = \$1 FOR UPDATE/i.test(sql)) {
    const appId = params[0]
    const a = store.applications.find((app) => app.id === appId)
    if (!a) return { rows: [], rowCount: 0 }
    const p = store.projects.find((proj) => proj.id === a.project_id)
    const pr = store.project_roles.find((role) => role.id === a.project_role_id)
    const record = {
      ...a,
      owner_id: p ? p.owner_id : null,
      project_status: p ? p.status : 'recruiting',
      team_size: p ? p.team_size : 4,
      role_name: pr ? pr.role_name : 'Role',
      positions_available: pr ? pr.positions_available : 1
    }
    return { rows: [record], rowCount: 1 }
  }

  if (/UPDATE applications SET status = \$1/i.test(sql)) {
    const [status, appId] = params
    const a = store.applications.find((app) => app.id === appId)
    if (a) {
      a.status = status
      a.updated_at = new Date().toISOString()
      saveStore()
      return { rows: [a], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }

  // 22. Team queries
  if (/FROM projects p JOIN team_members tm/i.test(sql) && /p\.id = \$1 AND tm\.user_id = \$2/i.test(sql)) {
    const [projectId, userId] = params
    const p = store.projects.find((proj) => proj.id === projectId)
    const tm = store.team_members.find((m) => m.project_id === projectId && m.user_id === userId)
    if (p && tm) {
      return { rows: [{ id: p.id, title: p.title, owner_id: p.owner_id, team_size: p.team_size, status: p.status }], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }

  if (/FROM team_members tm JOIN users u/i.test(sql) && /tm\.project_id = \$1/i.test(sql)) {
    const projectId = params[0]
    const members = store.team_members
      .filter((tm) => tm.project_id === projectId)
      .map((tm) => {
        const u = store.users.find((user) => user.id === tm.user_id)
        return {
          id: tm.id,
          user_id: tm.user_id,
          role: tm.role,
          joined_at: tm.joined_at,
          name: u ? u.name : 'Teammate',
          department: u ? u.department : '',
          academic_year: u ? u.academic_year : null,
          bio: u ? u.bio : '',
          github_url: u ? u.github_url : '',
          portfolio_url: u ? u.portfolio_url : ''
        }
      })
    return { rows: members, rowCount: members.length }
  }

  if (/FROM team_members tm JOIN projects p/i.test(sql) && /tm\.user_id = \$1/i.test(sql)) {
    const userId = params[0]
    const userTeams = store.team_members.filter((tm) => tm.user_id === userId)
    const rows = userTeams
      .map((tm) => {
        const p = store.projects.find((proj) => proj.id === tm.project_id)
        if (!p) return null
        const memberCount = store.team_members.filter((m) => m.project_id === p.id).length
        return {
          id: p.id,
          title: p.title,
          category: p.category,
          status: p.status,
          team_size: p.team_size,
          owner_id: p.owner_id,
          role: tm.role,
          member_count: memberCount
        }
      })
      .filter(Boolean)
    return { rows, rowCount: rows.length }
  }

  if (/DELETE FROM team_members WHERE project_id = \$1 AND user_id = \$2/i.test(sql)) {
    const [projectId, userId] = params
    const initialLen = store.team_members.length
    store.team_members = store.team_members.filter((tm) => !(tm.project_id === projectId && tm.user_id === userId))
    saveStore()
    const count = initialLen - store.team_members.length
    return { rows: [], rowCount: count }
  }

  if (/SELECT owner_id FROM projects WHERE id = \$1/i.test(sql)) {
    const projectId = params[0]
    const p = store.projects.find((proj) => proj.id === projectId)
    return { rows: p ? [{ id: p.id, owner_id: p.owner_id }] : [], rowCount: p ? 1 : 0 }
  }

  if (/SELECT id FROM team_members WHERE project_id = \$1 AND user_id = \$2/i.test(sql)) {
    const [projectId, userId] = params
    const tm = store.team_members.find((m) => m.project_id === projectId && m.user_id === userId)
    return { rows: tm ? [{ id: tm.id }] : [], rowCount: tm ? 1 : 0 }
  }

  if (/SELECT COUNT\(\*\)::int AS count FROM team_members WHERE project_id = \$1/i.test(sql)) {
    const projectId = params[0]
    const count = store.team_members.filter((tm) => tm.project_id === projectId).length
    return { rows: [{ count }], rowCount: 1 }
  }

  // 23. Workspace: Tasks, Announcements, Resources, Milestones
  if (/FROM tasks t LEFT JOIN users u/i.test(sql)) {
    const projectId = params[0]
    const tasks = store.tasks
      .filter((t) => t.project_id === projectId)
      .map((t) => {
        const u = store.users.find((user) => user.id === t.assigned_to)
        return { ...t, assignee_name: u ? u.name : null }
      })
    return { rows: tasks, rowCount: tasks.length }
  }

  if (/INSERT INTO tasks/i.test(sql)) {
    const [projectId, assignedTo, createdBy, title, description, dueDate] = params
    const newTask = {
      id: genId(),
      project_id: projectId,
      assigned_to: assignedTo,
      created_by: createdBy,
      title,
      description,
      status: 'todo',
      due_date: dueDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    store.tasks.push(newTask)
    saveStore()
    return { rows: [newTask], rowCount: 1 }
  }

  if (/SELECT \* FROM tasks WHERE id = \$1/i.test(sql)) {
    const taskId = params[0]
    const t = store.tasks.find((task) => task.id === taskId)
    return { rows: t ? [t] : [], rowCount: t ? 1 : 0 }
  }

  if (/UPDATE tasks SET status = \$1/i.test(sql)) {
    const [status, taskId] = params
    const t = store.tasks.find((task) => task.id === taskId)
    if (t) {
      t.status = status
      t.updated_at = new Date().toISOString()
      saveStore()
      return { rows: [t], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }

  if (/FROM announcements a JOIN users u/i.test(sql)) {
    const projectId = params[0]
    const announcements = store.announcements
      .filter((a) => a.project_id === projectId)
      .map((a) => {
        const u = store.users.find((user) => user.id === a.author_id)
        return { ...a, author_name: u ? u.name : 'Team member' }
      })
    return { rows: announcements, rowCount: announcements.length }
  }

  if (/INSERT INTO announcements/i.test(sql)) {
    const [projectId, authorId, message] = params
    const newAnnouncement = {
      id: genId(),
      project_id: projectId,
      author_id: authorId,
      message,
      created_at: new Date().toISOString()
    }
    store.announcements.unshift(newAnnouncement)
    saveStore()
    return { rows: [newAnnouncement], rowCount: 1 }
  }

  if (/FROM project_resources/i.test(sql)) {
    const projectId = params[0]
    const resources = store.project_resources.filter((r) => r.project_id === projectId)
    return { rows: resources, rowCount: resources.length }
  }

  if (/INSERT INTO project_resources/i.test(sql)) {
    const [projectId, addedBy, label, url] = params
    const newResource = {
      id: genId(),
      project_id: projectId,
      added_by: addedBy,
      label,
      url,
      created_at: new Date().toISOString()
    }
    store.project_resources.unshift(newResource)
    saveStore()
    return { rows: [newResource], rowCount: 1 }
  }

  if (/FROM milestones/i.test(sql)) {
    const projectId = params[0]
    const milestones = store.milestones.filter((m) => m.project_id === projectId)
    return { rows: milestones, rowCount: milestones.length }
  }

  if (/INSERT INTO milestones/i.test(sql)) {
    const [projectId, title, dueDate] = params
    const newMilestone = {
      id: genId(),
      project_id: projectId,
      title,
      due_date: dueDate,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    store.milestones.push(newMilestone)
    saveStore()
    return { rows: [newMilestone], rowCount: 1 }
  }

  // 24. Notifications
  if (/INSERT INTO notifications/i.test(sql)) {
    const [userId, title, message, type, projectId] = params
    const newNotif = {
      id: genId(),
      user_id: userId,
      title,
      message,
      notification_type: type,
      related_project_id: projectId,
      is_read: false,
      created_at: new Date().toISOString()
    }
    store.notifications.unshift(newNotif)
    saveStore()
    return { rows: [newNotif], rowCount: 1 }
  }

  if (/SELECT \* FROM notifications WHERE user_id = \$1/i.test(sql)) {
    const [userId, limit] = params
    const notifs = store.notifications
      .filter((n) => n.user_id === userId)
      .slice(0, Number(limit) || 30)
    return { rows: notifs, rowCount: notifs.length }
  }

  if (/SELECT COUNT\(\*\)::int AS count FROM notifications WHERE user_id = \$1 AND is_read = false/i.test(sql)) {
    const [userId] = params
    const unread = store.notifications.filter((n) => n.user_id === userId && !n.is_read).length
    return { rows: [{ count: unread }], rowCount: 1 }
  }

  if (/UPDATE notifications SET is_read = true WHERE id = \$1 AND user_id = \$2/i.test(sql)) {
    const [id, userId] = params
    const notif = store.notifications.find((n) => n.id === id && n.user_id === userId)
    if (notif) {
      notif.is_read = true
      saveStore()
      return { rows: [], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }

  if (/UPDATE notifications SET is_read = true WHERE user_id = \$1 AND is_read = false/i.test(sql)) {
    const [userId] = params
    store.notifications.forEach((n) => {
      if (n.user_id === userId) n.is_read = true
    })
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  // 25. Update & Delete projects
  if (/UPDATE projects SET title=\$1/i.test(sql)) {
    const [title, shortDescription, description, problemStatement, proposedSolution, technologyStack, category, projectType, teamSize, recruitmentDeadline, durationWeeks, status, id] = params
    const p = store.projects.find((proj) => proj.id === id)
    if (p) {
      p.title = title
      p.short_description = shortDescription
      p.description = description
      p.problem_statement = problemStatement
      p.proposed_solution = proposedSolution
      p.technology_stack = technologyStack
      p.category = category
      p.project_type = projectType
      p.team_size = teamSize
      p.recruitment_deadline = recruitmentDeadline
      p.duration_weeks = durationWeeks
      p.status = status
      p.updated_at = new Date().toISOString()
      saveStore()
      return { rows: [p], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }

  if (/DELETE FROM project_roles WHERE project_id = \$1/i.test(sql)) {
    const [projectId] = params
    store.project_roles = store.project_roles.filter((pr) => pr.project_id !== projectId)
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  if (/DELETE FROM project_skills WHERE project_id = \$1/i.test(sql)) {
    const [projectId] = params
    store.project_skills = store.project_skills.filter((ps) => ps.project_id !== projectId)
    saveStore()
    return { rows: [], rowCount: 1 }
  }

  if (/UPDATE projects SET status = 'archived'/i.test(sql)) {
    const [id, ownerId] = params
    const p = store.projects.find((proj) => proj.id === id && proj.owner_id === ownerId && proj.status !== 'archived')
    if (p) {
      p.status = 'archived'
      p.updated_at = new Date().toISOString()
      saveStore()
      return { rows: [], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }

  console.warn('[FallbackStore] Unhandled query pattern:', sql, params)
  return { rows: [], rowCount: 0 }
}
