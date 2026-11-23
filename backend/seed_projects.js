import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storePath = path.join(__dirname, 'data', 'store.json')
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'))

const collegeId = '11111111-1111-1111-1111-111111111111'

// Ensure some student owners exist
const extraUsers = [
  {
    name: 'Ananya Deshmukh',
    email: '202401100201@mitaoe.ac.in',
    department: 'Electronics & Telecommunication',
    academic_year: 3,
    bio: 'Robotics and embedded systems enthusiast. Building autonomous navigation prototypes.'
  },
  {
    name: 'Rohan Kulkarni',
    email: '202401100202@mitaoe.ac.in',
    department: 'Mechanical Engineering',
    academic_year: 4,
    bio: 'Mechatronics designer interested in CAD, automated sorting, and smart campus IoT.'
  },
  {
    name: 'Tanvi Patil',
    email: '202401100203@mitaoe.ac.in',
    department: 'Computer Engineering',
    academic_year: 3,
    bio: 'Deep learning researcher exploring vision-language models and educational AI.'
  },
  {
    name: 'Aditya Joshi',
    email: '202401100204@mitaoe.ac.in',
    department: 'Information Technology',
    academic_year: 2,
    bio: 'Full stack developer interested in decentralized knowledge networks and peer tools.'
  },
  {
    name: 'Pooja Shinde',
    email: '202401100205@mitaoe.ac.in',
    department: 'Computer Engineering',
    academic_year: 4,
    bio: 'Cybersecurity analyst focusing on network packet inspection and threat detection.'
  }
]

for (const u of extraUsers) {
  if (!store.users.some(existing => existing.email === u.email)) {
    store.users.push({
      id: crypto.randomUUID(),
      college_id: collegeId,
      name: u.name,
      email: u.email,
      password_hash: '$2b$12$eX4zX3Xp0O.r8Qo15Gf0z.M8M3a5nOqL4s6t9u2v5w8x1y4z7a0b',
      role: 'student',
      account_status: 'active',
      department: u.department,
      academic_year: u.academic_year,
      bio: u.bio,
      profile_picture_url: '',
      github_url: 'https://github.com/mitaoe-student',
      portfolio_url: '',
      availability: 'open',
      preferred_categories: ['Web development', 'AI and ML', 'Robotics'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
}

function getOrCreateSkill(skillName) {
  let skill = store.skills.find(s => s.skill_name.toLowerCase() === skillName.toLowerCase())
  if (!skill) {
    skill = { id: `s-${crypto.randomUUID().slice(0, 8)}`, skill_name: skillName }
    store.skills.push(skill)
  }
  return skill
}

const usersMap = new Map(store.users.map(u => [u.name, u.id]))
const defaultOwnerId = store.users[0].id

const newProjects = [
  {
    title: 'Autonomous Campus Delivery Rover',
    short_description: 'Self-driving four-wheeled rover navigating pedestrian walkways between Academic Blocks and Canteen.',
    description: 'An autonomous ground vehicle (AGV) prototype utilizing ROS2, 2D LiDAR SLAM, and Depth Cameras to deliver lab components and stationery across campus walkways safely without colliding with pedestrians.',
    problem_statement: 'Staff and student project labs frequently need rapid physical transport of hardware tools and printed circuit boards across distant campus wings during working hours.',
    proposed_solution: 'Build a differential drive rover with waypoint navigation, ultrasonic obstacle detection, and live telemetry to automate short-distance campus deliveries.',
    technology_stack: ['ROS2', 'Python', 'C++', 'LiDAR', 'Raspberry Pi', 'OpenCV'],
    category: 'Robotics',
    project_type: 'major_project',
    team_size: 4,
    recruitment_deadline: '2026-12-10',
    duration_weeks: 16,
    owner_name: 'Ananya Deshmukh',
    roles: [
      { name: 'ROS Navigation Specialist', description: 'Configure Nav2 stack, costmaps, and odometry telemetry', positions: 1 },
      { name: 'Computer Vision Lead', description: 'Train YOLOv8 pedestrian and obstacle avoidance pipeline', positions: 1 },
      { name: 'Hardware & Motor Driver Engineer', description: 'Interface BLDC motor drivers with microcontrollers and power management', positions: 1 }
    ],
    skills: [
      { name: 'ROS2', level: 'intermediate' },
      { name: 'Python', level: 'intermediate' },
      { name: 'C++', level: 'intermediate' },
      { name: 'OpenCV', level: 'beginner' }
    ]
  },
  {
    title: 'Alandi Water Quality Monitoring IoT Grid',
    short_description: 'Solar-powered wireless sensor buoys monitoring Indrayani river water quality parameters in real time.',
    description: 'A distributed environmental sensing network featuring floating buoys along the Indrayani river near Alandi temple ghat. Measures dissolved oxygen, turbidity, pH, and water temperature to publish open ecological telemetry.',
    problem_statement: 'Pilgrimage seasons and industrial discharge result in rapid, undetected shifts in Indrayani water quality without actionable continuous public monitoring.',
    proposed_solution: 'Deploy submersible multi-probe sensor pods transmitting telemetry over LoRaWAN to a campus dashboard with automated pollution threshold alerts.',
    technology_stack: ['ESP32', 'LoRaWAN', 'Python', 'InfluxDB', 'Grafana', 'MQTT'],
    category: 'Research',
    project_type: 'research_project',
    team_size: 3,
    recruitment_deadline: '2026-12-05',
    duration_weeks: 12,
    owner_name: 'Ananya Deshmukh',
    roles: [
      { name: 'Embedded Firmware Developer', description: 'Develop low-power sleep routines and sensor calibrations on ESP32', positions: 1 },
      { name: 'Data Pipeline & Dashboard Lead', description: 'Manage InfluxDB time-series ingestion and public Grafana portals', positions: 1 }
    ],
    skills: [
      { name: 'ESP32', level: 'intermediate' },
      { name: 'Python', level: 'intermediate' },
      { name: 'MQTT', level: 'intermediate' }
    ]
  },
  {
    title: 'Contactless Smart Attendance & Face Recognition Gate',
    short_description: 'Edge-computed classroom attendance system with infrared anti-spoofing liveness detection.',
    description: 'A high-speed edge facial recognition platform that detects and logs student attendance within 300ms upon entering the classroom or lab, preventing buddy punching with infrared depth checks.',
    problem_statement: 'Manual roll-calling consumes up to 10 minutes of every 60-minute lecture, and traditional fingerprint scanners cause entry bottlenecks.',
    proposed_solution: 'Mount edge camera nodes with TensorRT optimized face embeddings paired with secure backend sync to the student management system.',
    technology_stack: ['Python', 'PyTorch', 'OpenCV', 'FastAPI', 'React', 'Docker'],
    category: 'AI and ML',
    project_type: 'mini_project',
    team_size: 3,
    recruitment_deadline: '2026-11-28',
    duration_weeks: 8,
    owner_name: 'Tanvi Patil',
    roles: [
      { name: 'Deep Learning Engineer', description: 'Fine-tune ArcFace embeddings and optimize on-device inference', positions: 1 },
      { name: 'Full Stack Web Developer', description: 'Construct teacher attendance override portals and timetable feeds', positions: 1 }
    ],
    skills: [
      { name: 'Python', level: 'intermediate' },
      { name: 'PyTorch', level: 'intermediate' },
      { name: 'React', level: 'beginner' }
    ]
  },
  {
    title: 'Peer Tutoring & Lecture Notes Knowledge Hub',
    short_description: 'College-verified collaborative study network for mentoring juniors, past question papers, and lab code.',
    description: 'A student-exclusive portal where high-performing seniors schedule 1-on-1 subject clarification sessions, exchange verified handwritten lecture notes, and share solved university question sets with peer upvoting.',
    problem_statement: 'Academic resources and exam tips are fragmented across informal WhatsApp groups with no indexing, verification, or searchable taxonomy.',
    proposed_solution: 'Create a clean, college-gated repository with syllabus-indexed units, PDF preview annotations, and a karma-based peer tutoring scheduler.',
    technology_stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Prisma'],
    category: 'Web development',
    project_type: 'personal_project',
    team_size: 4,
    recruitment_deadline: '2026-12-01',
    duration_weeks: 10,
    owner_name: 'Aditya Joshi',
    roles: [
      { name: 'Frontend Engineer (Next.js)', description: 'Build responsive document reader and calendar booking UI', positions: 1 },
      { name: 'Backend & Database Engineer', description: 'Design PostgreSQL schemas and authorization policies in Prisma', positions: 1 },
      { name: 'UI/UX & Product Designer', description: 'Design accessible design system and dark-mode student dashboard', positions: 1 }
    ],
    skills: [
      { name: 'React', level: 'intermediate' },
      { name: 'Node.js', level: 'intermediate' },
      { name: 'PostgreSQL', level: 'intermediate' }
    ]
  },
  {
    title: 'Campus Solar Energy Forecast & Microgrid Dashboard',
    short_description: 'Predictive power load forecasting and rooftop solar generation analytics for MIT AOE campus buildings.',
    description: 'Analyzes energy consumption across computer centers, mechanical workshops, and hostel blocks against rooftop photovoltaic output to recommend smart load shifting and peak demand cutbacks.',
    problem_statement: 'The campus incurs heavy peak utility tariffs because high-power laboratory machinery runs concurrently with peak solar drop-offs.',
    proposed_solution: 'Train time-series gradient boosted models on weather and consumption telemetry to forecast day-ahead net power deficits.',
    technology_stack: ['Python', 'Pandas', 'Scikit-Learn', 'Docker', 'Plotly', 'FastAPI'],
    category: 'Data science',
    project_type: 'major_project',
    team_size: 3,
    recruitment_deadline: '2026-12-15',
    duration_weeks: 14,
    owner_name: 'Gaurav Dhadge',
    roles: [
      { name: 'Time-Series Data Scientist', description: 'Engineer lag features, seasonal solar models, and forecast metrics', positions: 1 },
      { name: 'Data Visualization Lead', description: 'Render interactive daily energy balance diagrams and load heatmaps', positions: 1 }
    ],
    skills: [
      { name: 'Python', level: 'intermediate' },
      { name: 'React', level: 'beginner' },
      { name: 'Node.js', level: 'beginner' }
    ]
  },
  {
    title: 'College Fest Ticketing & Rapid QR Access Pass',
    short_description: 'Offline-capable mobile app for annual festival registration, flash hackathons, and gate badge scanning.',
    description: 'A mobile passbook app designed to streamline thousands of student check-ins during technical symposiums and cultural fests, with encrypted offline QR verification and live attendee headcounts.',
    problem_statement: 'Paper wristbands and manual gate spreadsheets cause hour-long entry queues and duplicate ticket pass-backs at annual events.',
    proposed_solution: 'Provide time-synced dynamic QR codes that refresh every 30 seconds and can be validated offline by volunteer scanners.',
    technology_stack: ['Flutter', 'Dart', 'Firebase', 'Node.js', 'Express'],
    category: 'Mobile apps',
    project_type: 'hackathon',
    team_size: 4,
    recruitment_deadline: '2026-11-25',
    duration_weeks: 6,
    owner_name: 'Gaurav Dhadge',
    roles: [
      { name: 'Flutter Mobile Engineer', description: 'Build offline-first scanning camera views and passbook animations', positions: 1 },
      { name: 'Backend API Architect', description: 'Construct ticket generation endpoints and real-time event analytics', positions: 1 },
      { name: 'Security & Token Validation Tester', description: 'Audit replay-attack prevention and QR cryptographic signatures', positions: 1 }
    ],
    skills: [
      { name: 'Node.js', level: 'intermediate' },
      { name: 'React', level: 'beginner' }
    ]
  },
  {
    title: 'Campus Network Intrusion Honeypot & Threat Map',
    short_description: 'Internal cybersecurity utility and simulated honeypot to detect rogue devices and analyze campus traffic.',
    description: 'Deploys lightweight decoy network services (SSH, HTTP, SMB) within the college subnet to monitor unauthorized scan sweeps, credential brute-forcing, and rogue Wi-Fi AP intrusions.',
    problem_statement: 'Open lab Wi-Fi networks are vulnerable to lateral movement by compromised personal student laptops and rogue access points.',
    proposed_solution: 'Configure low-interaction honeypots with an automated alert pipeline that surfaces rogue port scans on a live administrative threat map.',
    technology_stack: ['Go', 'Python', 'Wireshark', 'Suricata', 'Linux', 'Elasticsearch'],
    category: 'Cybersecurity',
    project_type: 'research_project',
    team_size: 3,
    recruitment_deadline: '2026-12-08',
    duration_weeks: 12,
    owner_name: 'Pooja Shinde',
    roles: [
      { name: 'Go Systems Programmer', description: 'Write low-overhead daemon monitors for packet capture and event logging', positions: 1 },
      { name: 'Threat Detection Analyst', description: 'Analyze PCAP dumps and map indicators of compromise to MITRE ATT&CK', positions: 1 }
    ],
    skills: [
      { name: 'Python', level: 'intermediate' },
      { name: 'Node.js', level: 'beginner' }
    ]
  },
  {
    title: 'Automated Library Shelf Scanning & RFID Cart',
    short_description: 'Mechatronic tabletop cart that scans RFID tags on library shelves and detects misplaced books.',
    description: 'An automated shelf-traversing scanner with directional RFID antennas that reconciles book call numbers against the central library database, flagging misplaced books on a digital inventory map.',
    problem_statement: 'Thousands of textbooks are misplaced daily by browsing students, rendering them virtually lost for weeks despite showing available in the catalog.',
    proposed_solution: 'Build an automated rail-and-cart robot that glides along bookshelf aisles after hours to pinpoint the shelf location of every cataloged book.',
    technology_stack: ['Arduino', 'C++', 'Python', 'SolidWorks', 'RFID', 'Stepper Motors'],
    category: 'Robotics',
    project_type: 'mini_project',
    team_size: 3,
    recruitment_deadline: '2026-11-29',
    duration_weeks: 8,
    owner_name: 'Rohan Kulkarni',
    roles: [
      { name: 'CAD & Mechanism Lead', description: 'Design 3D-printable brackets, linear rail guides, and chassis enclosures', positions: 1 },
      { name: 'Firmware & RFID Lead', description: 'Program stepper trajectories and anti-collision RFID tag read cycles', positions: 1 }
    ],
    skills: [
      { name: 'C++', level: 'intermediate' },
      { name: 'Python', level: 'beginner' }
    ]
  },
  {
    title: 'Bloom Taxonomy AI Exam & Rubrics Generator',
    short_description: 'AI-assisted exam question paper compiler and grading rubrics evaluator for engineering curriculum.',
    description: 'A domain-tuned application that parses university course syllabi and learning objectives to generate balanced question papers strictly mapped to Bloom cognitive levels (Remembering through Evaluating).',
    problem_statement: 'Faculty spend extensive time drafting balanced mid-term and semester papers that satisfy NBA/NAAC accreditation rubrics.',
    proposed_solution: 'Utilize Gemini API and LangChain with syllabus PDF retrieval to generate calibrated problem statements and numerical answer keys.',
    technology_stack: ['Gemini API', 'LangChain', 'Python', 'FastAPI', 'React', 'Tailwind CSS'],
    category: 'AI and ML',
    project_type: 'hackathon',
    team_size: 3,
    recruitment_deadline: '2026-11-22',
    duration_weeks: 6,
    owner_name: 'Tanvi Patil',
    roles: [
      { name: 'LLM Prompt & RAG Engineer', description: 'Construct retrieval pipelines over course syllabi and past paper corpora', positions: 1 },
      { name: 'Frontend Application Developer', description: 'Build interactive question editor with drag-and-drop marks distribution', positions: 1 }
    ],
    skills: [
      { name: 'Python', level: 'intermediate' },
      { name: 'React', level: 'intermediate' }
    ]
  },
  {
    title: 'Campus Emergency SOS & Medical Response Network',
    short_description: 'Instant geotargeted emergency alert broadcast to campus security and ambulance with live GPS tracking.',
    description: 'A life-safety mobile and web network that allows students in medical or security distress to broadcast an SOS alert with precise indoor room locations to campus security patrol and the medical infirmary.',
    problem_statement: 'In sudden laboratory mishaps or medical emergencies, contacting guards across large multistory academic buildings is slow and lacks location clarity.',
    proposed_solution: 'Create a one-tap panic button mobile application integrated with campus security dispatch monitors and Bluetooth beacon triangulation.',
    technology_stack: ['React Native', 'TypeScript', 'WebSockets', 'Node.js', 'Express', 'PostgreSQL'],
    category: 'Mobile apps',
    project_type: 'major_project',
    team_size: 4,
    recruitment_deadline: '2026-12-12',
    duration_weeks: 14,
    owner_name: 'Aarav Sharma',
    roles: [
      { name: 'Mobile App Lead (React Native)', description: 'Implement background GPS beaconing and one-tap emergency widget', positions: 1 },
      { name: 'Real-time WebSocket Engineer', description: 'Manage low-latency incident dispatch feeds and security desk alerts', positions: 1 },
      { name: 'Campus Mapping & GIS Specialist', description: 'Digitize building floorplans and landmark coordinates for emergency teams', positions: 1 }
    ],
    skills: [
      { name: 'React', level: 'intermediate' },
      { name: 'Node.js', level: 'intermediate' },
      { name: 'PostgreSQL', level: 'intermediate' }
    ]
  }
]

let addedCount = 0

for (const p of newProjects) {
  // Check if project title already exists
  if (store.projects.some(existing => existing.title === p.title)) {
    continue
  }

  const ownerId = usersMap.get(p.owner_name) || defaultOwnerId
  const projectId = crypto.randomUUID()

  const projectRecord = {
    id: projectId,
    college_id: collegeId,
    owner_id: ownerId,
    title: p.title,
    short_description: p.short_description,
    description: p.description,
    problem_statement: p.problem_statement,
    proposed_solution: p.proposed_solution,
    technology_stack: p.technology_stack,
    category: p.category,
    project_type: p.project_type,
    team_size: p.team_size,
    recruitment_deadline: p.recruitment_deadline,
    duration_weeks: p.duration_weeks,
    status: 'recruiting',
    created_at: new Date(Date.now() - Math.floor(Math.random() * 5 * 86400000)).toISOString(),
    updated_at: new Date().toISOString()
  }

  store.projects.push(projectRecord)

  // Add roles
  for (const r of p.roles) {
    store.project_roles.push({
      id: crypto.randomUUID(),
      project_id: projectId,
      role_name: r.name,
      description: r.description,
      positions_available: r.positions || 1
    })
  }

  // Add skills
  for (const s of p.skills) {
    const skillObj = getOrCreateSkill(s.name)
    store.project_skills.push({
      project_id: projectId,
      skill_id: skillObj.id,
      required_level: s.level || 'intermediate'
    })
  }

  // Add owner to team members
  store.team_members.push({
    id: crypto.randomUUID(),
    project_id: projectId,
    user_id: ownerId,
    role: 'Project owner',
    joined_at: new Date().toISOString()
  })

  addedCount++
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2))
console.log(`Successfully added ${addedCount} sample projects! Total projects now: ${store.projects.length}`)
