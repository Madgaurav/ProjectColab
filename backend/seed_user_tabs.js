import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storePath = path.join(__dirname, 'data', 'store.json')
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'))

const gauravId = 'fffb393e-41d9-4c72-8c6a-cf7a46e6c81a'
const ananyaId = 'dc306885-e62f-4117-83d9-de58f514a012'
const rohanId = '50462015-191a-43d9-b481-5a54fc770c55'
const tanviId = '1f344c7b-69ff-4f3e-92d4-fffe12b94fb8'
const adityaId = 'b5a828ed-f6a1-49a0-b3ca-38209ea2cee3'
const poojaId = '96439269-d711-4434-ad93-1d6728781b3e'

// Find relevant projects
const rideShare = store.projects.find(p => p.id === '9aa6c3a3-0142-48e6-b479-294864629510' || p.title.includes('Ride Share'))
const solarProject = store.projects.find(p => p.id === 'd90c76cb-532d-4864-8e48-fd7ff00e8aa7' || p.title.includes('Solar'))
const roverProject = store.projects.find(p => p.title.includes('Autonomous Campus Delivery Rover'))

const rideShareId = rideShare?.id
const solarId = solarProject?.id
const roverId = roverProject?.id

console.log('Project IDs:', { rideShareId, solarId, roverId })

// Ensure skills exist for applicants
function getSkillId(name) {
  let s = store.skills.find(x => x.skill_name.toLowerCase() === name.toLowerCase())
  if (!s) {
    s = { id: `s-${crypto.randomUUID().slice(0, 8)}`, skill_name: name }
    store.skills.push(s)
  }
  return s.id
}

const sReact = getSkillId('React')
const sNode = getSkillId('Node.js')
const sPostgres = getSkillId('PostgreSQL')
const sPython = getSkillId('Python')
const sROS = getSkillId('ROS2')
const sCpp = getSkillId('C++')
const sESP32 = getSkillId('ESP32')
const sLeaflet = getSkillId('Leaflet.js')

// Seed user_skills
store.user_skills = store.user_skills || []
const addSkill = (userId, skillId, level) => {
  if (!store.user_skills.some(us => us.user_id === userId && us.skill_id === skillId)) {
    store.user_skills.push({ user_id: userId, skill_id: skillId, proficiency_level: level })
  }
}

addSkill(ananyaId, sReact, 'advanced')
addSkill(ananyaId, sLeaflet, 'advanced')
addSkill(ananyaId, sROS, 'intermediate')
addSkill(rohanId, sNode, 'intermediate')
addSkill(rohanId, sPostgres, 'intermediate')
addSkill(rohanId, sCpp, 'advanced')
addSkill(tanviId, sPython, 'advanced')
addSkill(tanviId, sNode, 'intermediate')
addSkill(poojaId, sPostgres, 'advanced')
addSkill(poojaId, sPython, 'intermediate')
addSkill(adityaId, sReact, 'advanced')
addSkill(adityaId, sNode, 'intermediate')
addSkill(gauravId, sReact, 'advanced')
addSkill(gauravId, sNode, 'advanced')
addSkill(gauravId, sESP32, 'intermediate')

// Roles for Ride Share
const rideShareRoles = store.project_roles.filter(r => r.project_id === rideShareId)
const frontendRole = rideShareRoles.find(r => r.role_name.includes('Frontend')) || rideShareRoles[0]
const backendRole = rideShareRoles.find(r => r.role_name.includes('Backend')) || rideShareRoles[1] || rideShareRoles[0]

// Roles for Solar
const solarRoles = store.project_roles.filter(r => r.project_id === solarId)
const dataRole = solarRoles[0]
const vizRole = solarRoles[1] || solarRoles[0]

// 1. Clear previous sample applications and add new ones
store.applications = store.applications || []
store.applications = store.applications.filter(a => a.project_id !== rideShareId && a.project_id !== solarId)

store.applications.push({
  id: crypto.randomUUID(),
  project_id: rideShareId,
  project_role_id: frontendRole.id,
  applicant_id: ananyaId,
  introduction_message: 'I have designed interactive geospatial mapping interfaces in Leaflet and React for our college mobility hackathon. I would love to build the live commuter ETA view.',
  status: 'pending',
  created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
})

store.applications.push({
  id: crypto.randomUUID(),
  project_id: rideShareId,
  project_role_id: backendRole.id,
  applicant_id: rohanId,
  introduction_message: 'Experienced with Express.js and real-time WebSocket coordinate streaming. I want to build the low-latency bus GPS telemetry ingest pipeline.',
  status: 'pending',
  created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
})

if (dataRole) {
  store.applications.push({
    id: crypto.randomUUID(),
    project_id: solarId,
    project_role_id: dataRole.id,
    applicant_id: tanviId,
    introduction_message: 'I have researched solar irradiation models using Scikit-Learn and Pandas. Excited to deploy daily peak load forecasts for the campus microgrid.',
    status: 'pending',
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
  })
}

if (vizRole) {
  store.applications.push({
    id: crypto.randomUUID(),
    project_id: solarId,
    project_role_id: vizRole.id,
    applicant_id: poojaId,
    introduction_message: 'Built high-throughput telemetry dashboards in React and Plotly. Can render real-time power production vs building load comparison charts.',
    status: 'accepted',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  })
}

// 2. Team Members
// In Ride Share: Gaurav (Owner), Aditya Joshi (Frontend Lead), Pooja Shinde (Security Lead)
const addTeamMember = (projectId, userId, role) => {
  if (!store.team_members.some(tm => tm.project_id === projectId && tm.user_id === userId)) {
    store.team_members.push({
      id: crypto.randomUUID(),
      project_id: projectId,
      user_id: userId,
      role: role,
      joined_at: new Date(Date.now() - 5 * 86400000).toISOString()
    })
  }
}

addTeamMember(rideShareId, adityaId, 'Frontend Lead')
addTeamMember(rideShareId, poojaId, 'Backend & Security Engineer')

// In Rover: Ananya (Owner), Gaurav Dhadge (Embedded Systems Specialist), Rohan Kulkarni (Mechanical Chassis Lead)
if (roverId) {
  addTeamMember(roverId, gauravId, 'Embedded Systems Specialist')
  addTeamMember(roverId, rohanId, 'Mechanical Chassis Lead')
}

// 3. Tasks
store.tasks = store.tasks || []
store.tasks = store.tasks.filter(t => t.project_id !== rideShareId && t.project_id !== roverId)

// Ride Share tasks
store.tasks.push(
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    created_by: gauravId,
    assigned_to: adityaId,
    title: 'Define Alandi bus terminus geofencing polygon in Leaflet',
    description: 'Mark precise GPS latitude/longitude bounding boxes for Alandi depot and MIT AOE main porch to trigger automatic arrival events.',
    status: 'todo',
    due_date: '2026-11-20',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    created_by: gauravId,
    assigned_to: poojaId,
    title: 'Implement token bucket rate limiter for GPS polling endpoint',
    description: 'Protect /api/transit/live coordinates against crawler scraping and abuse while maintaining under 50ms latency for student phones.',
    status: 'todo',
    due_date: '2026-11-22',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    created_by: gauravId,
    assigned_to: gauravId,
    title: 'Integrate live GPS breadcrumb trail on interactive campus map',
    description: 'Render smooth real-time bus marker movement with heading arrow rotation using socket updates from ESP32 vehicle nodes.',
    status: 'in_progress',
    due_date: '2026-11-18',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    created_by: gauravId,
    assigned_to: gauravId,
    title: 'Bench-test NEO-6M GPS satellite acquisition under partial cover',
    description: 'Record time-to-first-fix (TTFF) and cold start latencies inside metal vehicle chassis vs roof antenna placement.',
    status: 'in_progress',
    due_date: '2026-11-19',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    created_by: gauravId,
    assigned_to: gauravId,
    title: 'Draft system architecture and telemetry protocol specification',
    description: 'Created MQTT payload schema and defined JSON schemas for coordinate pings, vehicle battery level, and passenger count estimates.',
    status: 'completed',
    due_date: '2026-11-14',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    created_by: gauravId,
    assigned_to: adityaId,
    title: 'Initialize repository with ESLint, Prettier, and Vite proxy',
    description: 'Setup initial frontend structure, Leaflet.js dependencies, and API proxy routing to Express backend.',
    status: 'completed',
    due_date: '2026-11-12',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
)

// Rover tasks
if (roverId) {
  store.tasks.push(
    {
      id: crypto.randomUUID(),
      project_id: roverId,
      created_by: ananyaId,
      assigned_to: gauravId,
      title: 'Calibrate optical wheel encoders and velocity PID tuning',
      description: 'Tune proportional-integral-derivative gains for smooth low-speed deceleration near pedestrian crossings.',
      status: 'todo',
      due_date: '2026-11-21',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      project_id: roverId,
      created_by: ananyaId,
      assigned_to: ananyaId,
      title: 'Configure ROS2 Nav2 costmaps and 2D LiDAR SLAM parameters',
      description: 'Set obstacle inflation radius and local trajectory planner velocity limits for Academic Block C corridors.',
      status: 'in_progress',
      due_date: '2026-11-19',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      project_id: roverId,
      created_by: ananyaId,
      assigned_to: rohanId,
      title: 'CAD design and 3D print front caster suspension bracket',
      description: 'Fabricated impact-resistant PETG front wheel assembly with dual spring dampening.',
      status: 'completed',
      due_date: '2026-11-15',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
    }
  )
}

// 4. Announcements
store.announcements = store.announcements || []
store.announcements = store.announcements.filter(a => a.project_id !== rideShareId && a.project_id !== roverId)

store.announcements.push(
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    author_id: gauravId,
    message: 'Welcome everyone! We received our ESP32-WROOM and NEO-6M development kits from the IoT department lab. Please review our pinout assignments and MQTT telemetry payload in the resources section below.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    author_id: gauravId,
    message: 'Field Trial Notice: We received formal approval from the transport desk to mount our battery-powered GPS datalogger on Campus Shuttle Bus #2 this Friday at 4:30 PM. We will test live packet loss under tree canopies along the Alandi ghat.',
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  }
)

if (roverId) {
  store.announcements.push({
    id: crypto.randomUUID(),
    project_id: roverId,
    author_id: ananyaId,
    message: 'Autonomous Rover Kickoff: Meeting Wednesday 5:00 PM at Mechatronics Lab (Block B). Please ensure your laptops have ROS2 Humble and Nav2 binaries installed before the session.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  })
}

// 5. Shared Resources
store.project_resources = store.project_resources || []
store.project_resources = store.project_resources.filter(r => r.project_id !== rideShareId && r.project_id !== roverId)

store.project_resources.push(
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    added_by: gauravId,
    label: 'MIT AOE Campus Transit Routes & Bus Stop GPS Coordinates',
    url: 'https://mitaoe.ac.in',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    added_by: gauravId,
    label: 'ESP32 GPS Vehicle Node Firmware Repository',
    url: 'https://github.com/mitaoe-student',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    added_by: adityaId,
    label: 'Interactive Commuter Tracking UI & Figma Prototypes',
    url: 'https://figma.com',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
)

if (roverId) {
  store.project_resources.push(
    {
      id: crypto.randomUUID(),
      project_id: roverId,
      added_by: ananyaId,
      label: 'ROS2 Navigation Stack (Nav2) Official Integration Guide',
      url: 'https://docs.nav2.org',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      project_id: roverId,
      added_by: rohanId,
      label: 'Rover 4WD Mechanical Chassis CAD Models in Onshape',
      url: 'https://cad.onshape.com',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    }
  )
}

// 6. Milestones
store.milestones = store.milestones || []
store.milestones = store.milestones.filter(m => m.project_id !== rideShareId && m.project_id !== roverId)

store.milestones.push(
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    title: 'Hardware Breadboard GPS & Cellular Ping Verification',
    due_date: '2026-11-24',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    title: 'Alpha Web Dashboard Live on Campus Intranet',
    due_date: '2026-12-05',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    project_id: rideShareId,
    title: 'Full Route Pilot on Alandi - Swargate Bus #2',
    due_date: '2026-12-18',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
)

if (roverId) {
  store.milestones.push(
    {
      id: crypto.randomUUID(),
      project_id: roverId,
      title: 'Chassis Drive Test & Dual Motor Torque Calibration',
      due_date: '2026-11-28',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      project_id: roverId,
      title: 'Autonomous Hallway Obstacle Avoidance Demo',
      due_date: '2026-12-12',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    }
  )
}

// 7. Notifications for Gaurav
store.notifications = store.notifications || []
store.notifications = store.notifications.filter(n => n.user_id !== gauravId)

store.notifications.push(
  {
    id: crypto.randomUUID(),
    user_id: gauravId,
    title: 'New project application',
    message: 'Ananya Deshmukh applied for the Frontend Developer role in MIT AOE Campus Ride Share & Shuttle Tracker.',
    notification_type: 'project_application',
    related_project_id: rideShareId,
    is_read: false,
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    user_id: gauravId,
    title: 'New task assignment',
    message: 'You were assigned: "Integrate live GPS breadcrumb trail on interactive campus map" in MIT AOE Campus Ride Share & Shuttle Tracker.',
    notification_type: 'task_assignment',
    related_project_id: rideShareId,
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    user_id: gauravId,
    title: 'You joined a project team',
    message: 'Ananya Deshmukh accepted you for the Embedded Systems Specialist role in Autonomous Campus Delivery Rover.',
    notification_type: 'application_accepted',
    related_project_id: roverId,
    is_read: false,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    user_id: gauravId,
    title: 'New team announcement',
    message: 'Field Trial Notice: We received formal approval to mount our battery-powered GPS datalogger on Campus Shuttle Bus #2.',
    notification_type: 'team_announcement',
    related_project_id: rideShareId,
    is_read: true,
    created_at: new Date(Date.now() - 7 * 3600 * 1000).toISOString()
  },
  {
    id: crypto.randomUUID(),
    user_id: gauravId,
    title: 'New project application',
    message: 'Rohan Kulkarni applied for the Backend API Engineer role in MIT AOE Campus Ride Share & Shuttle Tracker.',
    notification_type: 'project_application',
    related_project_id: rideShareId,
    is_read: true,
    created_at: new Date(Date.now() - 15 * 3600 * 1000).toISOString()
  }
)

fs.writeFileSync(storePath, JSON.stringify(store, null, 2))
console.log('Successfully seeded sample data for Recruitment, Team, Workspace, and Notifications!')
console.log({
  applications: store.applications.length,
  team_members: store.team_members.length,
  tasks: store.tasks.length,
  announcements: store.announcements.length,
  resources: store.project_resources.length,
  milestones: store.milestones.length,
  notifications: store.notifications.length
})
