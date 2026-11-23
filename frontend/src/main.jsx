import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { Navigation } from './components/Navigation'
import { ProjectDetailsModal } from './components/ProjectDetailsModal'
import { RecruitmentDashboard } from './components/RecruitmentDashboard'
import { TeamManagement } from './components/TeamManagement'
import { CollaborationWorkspace } from './components/CollaborationWorkspace'
import { NotificationsWorkspace } from './components/NotificationsWorkspace'
import { ProjectCollabSymbol } from './components/ProjectCollabSymbol'
import { HoneycombBackground } from './components/HoneycombBackground'

const API = '/api/auth'

function Arrow() { return <span aria-hidden="true">↗</span> }

function Mark({ onClick }) {
  return (
    <a className="brand" href="#top" onClick={onClick} aria-label="ProjectCollab home">
      <ProjectCollabSymbol size={28} style={{ marginRight: '0.65rem' }} />
      Project<span>Collab</span>
    </a>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required />
    </label>
  )
}

function AuthPanel({ mode, onModeChange, onSubmit, busy, message }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [clientError, setClientError] = useState('')
  const isRegister = mode === 'register'
  const update = (name) => (event) => {
    setForm({ ...form, [name]: event.target.value })
    if (clientError) setClientError('')
  }
  const submit = (event) => {
    event.preventDefault()
    const emailVal = form.email.trim()
    if (!/^\d+@mitaoe\.ac\.in$/i.test(emailVal)) {
      setClientError('Please use your MIT AOE student email format: numbers only before @ (e.g. 202401100139@mitaoe.ac.in).')
      return
    }
    setClientError('')
    onSubmit(form)
  }

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-topline">
        <span>{isRegister ? 'Your campus network' : 'Welcome back'}</span>
        <span className="status-dot" aria-hidden="true" />
      </div>
      <h1 id="auth-title">
        {isRegister ? <>Find your next <em>great team.</em></> : <>Continue building <em>together.</em></>}
      </h1>
      <p className="auth-lead">
        {isRegister
          ? <>Create your verified student profile and turn <span className="highlight">good ideas into shared work.</span></>
          : <>Your projects, teammates, and opportunities are <span className="highlight">right where you left them.</span></>}
      </p>
      <form onSubmit={submit} className="form" noValidate>
        {isRegister && <Field label="Full name" value={form.name} onChange={update('name')} placeholder="Your name" autoComplete="name" />}
        <Field label="College email" type="email" value={form.email} onChange={update('email')} placeholder="202401100139@mitaoe.ac.in" autoComplete="email" />
        <div className="field-wrap">
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={update('password')}
            placeholder={isRegister ? 'At least 10 characters' : 'Enter your password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          {!isRegister && (
            <button type="button" className="text-link" onClick={() => onModeChange('forgot')}>
              Forgot password?
            </button>
          )}
        </div>
        {(clientError || message) && <p className="notice" role="status">{clientError || message}</p>}
        <button className="primary-button" disabled={busy}>
          {busy ? 'Please wait' : isRegister ? <>Create account <Arrow /></> : <>Sign in <Arrow /></>}
        </button>
      </form>
      <p className="switcher">
        {isRegister ? 'Already a member?' : 'New to ProjectCollab?'}{' '}
        <button type="button" onClick={() => { setClientError(''); onModeChange(isRegister ? 'login' : 'register') }}>
          {isRegister ? 'Sign in' : 'Create an account'}
        </button>
      </p>
      {isRegister && <p className="terms">Only MIT AOE student emails (<span style={{ fontFamily: 'monospace' }}>&lt;PRN&gt;@mitaoe.ac.in</span>) are permitted.</p>}
    </section>
  )
}

function ForgotPanel({ onModeChange, onSubmit, busy, message }) {
  const [email, setEmail] = useState('')
  const [clientError, setClientError] = useState('')
  const handleForgot = (e) => {
    e.preventDefault()
    if (!/^\d+@mitaoe\.ac\.in$/i.test(email.trim())) {
      setClientError('Enter your MIT AOE student email (e.g. 202401100139@mitaoe.ac.in).')
      return
    }
    setClientError('')
    onSubmit({ email })
  }
  return (
    <section className="auth-card compact" aria-labelledby="forgot-title">
      <button className="back" onClick={() => onModeChange('login')}>← Back to sign in</button>
      <div className="auth-topline"><span>Account recovery</span><span className="status-dot" aria-hidden="true" /></div>
      <h1 id="forgot-title">Reset your <em>password.</em></h1>
      <p className="auth-lead">Enter your MIT AOE student email and we’ll send a secure reset link.</p>
      <form onSubmit={handleForgot} className="form">
        <Field label="College email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setClientError('') }} placeholder="202401100139@mitaoe.ac.in" autoComplete="email" />
        {(clientError || message) && <p className="notice" role="status">{clientError || message}</p>}
        <button className="primary-button" disabled={busy}>{busy ? 'Sending' : <>Send reset link <Arrow /></>}</button>
      </form>
    </section>
  )
}

function Verification({ message, onVerify, busy }) {
  const [token, setToken] = useState('')
  return (
    <section className="auth-card compact" aria-labelledby="verify-title">
      <div className="auth-topline"><span>One last step</span><span className="status-dot" aria-hidden="true" /></div>
      <h1 id="verify-title">Verify your <em>college email.</em></h1>
      <p className="auth-lead">{message || 'Use the verification link from your inbox to activate your account.'}</p>
      <form onSubmit={(e) => { e.preventDefault(); onVerify(token) }} className="form">
        <Field label="Verification token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your token" autoComplete="one-time-code" />
        <button className="primary-button" disabled={busy}>{busy ? 'Verifying' : <>Verify and enter <Arrow /></>}</button>
      </form>
    </section>
  )
}

function SideStory() {
  return (
    <aside className="story" aria-label="Why ProjectCollab">
      <div className="story-content">
        <p className="eyebrow">Made for the work beyond class</p>
        <blockquote>“The right collaborator can turn a small project into the one you are proud to show.”</blockquote>
        <div className="story-rule" />
        <div className="story-stat"><strong>One college</strong><span>One place to discover people who want to build.</span></div>
      </div>
      <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="node node-one" /><div className="node node-two" /><div className="node node-three" />
    </aside>
  )
}

const emptyProfile = { department: '', academic_year: '', bio: '', profile_picture_url: '', github_url: '', portfolio_url: '', availability: 'open', preferred_categories: [], skills: [], interests: [] }
const categories = ['AI and ML', 'Web development', 'Mobile apps', 'Cybersecurity', 'Data science', 'Robotics', 'Research']

function ProfileWorkspace({ user, profile, onSave, saving, onSignOut, onProjects }) {
  const [draft, setDraft] = useState(profile || emptyProfile)
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => setDraft(profile || emptyProfile), [profile])
  const update = (key) => (event) => setDraft({ ...draft, [key]: event.target.value })
  const addSkill = () => { const name = newSkill.trim(); if (name && !draft.skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) { setDraft({ ...draft, skills: [...draft.skills, { name, level: 'intermediate' }] }); setNewSkill('') } }
  const addInterest = () => { const interest = newInterest.trim(); if (interest && !draft.interests.includes(interest)) { setDraft({ ...draft, interests: [...draft.interests, interest] }); setNewInterest('') } }
  const submit = async (event) => { event.preventDefault(); const result = await onSave(draft); setMessage(result) }
  const initials = user?.name ? user.name.split(' ').map((part) => part[0]).slice(0, 2).join('') : 'PC'

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <div>
          <p className="eyebrow">Student profile</p>
          <h1>Show the work you <em>want to do.</em></h1>
          <p>Give future teammates enough context to find the <span className="highlight">right reason to reach out.</span></p>
        </div>
        <div className="page-actions">
          <button className="outline-button" onClick={onProjects}>Create project</button>
          <button className="outline-button" onClick={onSignOut}>Sign out</button>
        </div>
      </div>
      <form onSubmit={submit} className="profile-layout">
        <aside className="profile-aside">
          <div className="avatar">{draft.profile_picture_url ? <img src={draft.profile_picture_url} alt="Your profile" /> : initials}</div>
          <h2>{user?.name}</h2>
          <p>{draft.department || 'Add your department'}</p>
          <div className={`availability ${draft.availability}`}>
            <i />
            {draft.availability === 'open' ? 'Open to collaborate' : draft.availability === 'limited' ? 'Limited availability' : 'Not available'}
          </div>
          <div className="aside-rule" />
          <p className="small-copy">Your email stays private. Only your student-facing profile is shared within your verified college community.</p>
        </aside>
        <div className="profile-form">
          <section className="form-section">
            <div className="section-title"><span>01</span><div><h2>Your context</h2><p>A few details make it easier to start a useful conversation.</p></div></div>
            <div className="two-fields">
              <Field label="Department or branch" value={draft.department || ''} onChange={update('department')} placeholder="Computer science" />
              <label className="field">
                <span>Academic year</span>
                <select value={draft.academic_year || ''} onChange={update('academic_year')}>
                  <option value="">Select year</option>
                  {[1,2,3,4,5].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Short bio</span>
              <textarea maxLength="500" value={draft.bio || ''} onChange={update('bio')} placeholder="What do you enjoy learning, building, or exploring?" />
              <small>{(draft.bio || '').length}/500</small>
            </label>
          </section>
          <section className="form-section">
            <div className="section-title"><span>02</span><div><h2>Skills and interests</h2><p>Use the things you can contribute today, not every course you have taken.</p></div></div>
            <div className="tag-editor">
              <label className="field">
                <span>Skills</span>
                <div className="add-row">
                  <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} placeholder="Add a skill, e.g. React" />
                  <button type="button" onClick={addSkill}>Add</button>
                </div>
              </label>
              <div className="tags">
                {draft.skills.map((skill, index) => (
                  <span className="skill-tag" key={skill.name}>
                    {skill.name}
                    <select aria-label={`${skill.name} level`} value={skill.level} onChange={(e) => setDraft({ ...draft, skills: draft.skills.map((item, i) => i === index ? { ...item, level: e.target.value } : item) })}>
                      <option value="beginner">beginner</option>
                      <option value="intermediate">intermediate</option>
                      <option value="advanced">advanced</option>
                    </select>
                    <button type="button" aria-label={`Remove ${skill.name}`} onClick={() => setDraft({ ...draft, skills: draft.skills.filter((_, i) => i !== index) })}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="tag-editor">
              <label className="field">
                <span>Areas of interest</span>
                <div className="add-row">
                  <input value={newInterest} onChange={(e) => setNewInterest(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest() } }} placeholder="Add an interest" />
                  <button type="button" onClick={addInterest}>Add</button>
                </div>
              </label>
              <div className="tags">
                {draft.interests.map((interest) => (
                  <span className="interest-tag" key={interest}>
                    {interest}
                    <button type="button" aria-label={`Remove ${interest}`} onClick={() => setDraft({ ...draft, interests: draft.interests.filter((item) => item !== interest) })}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </section>
          <section className="form-section">
            <div className="section-title"><span>03</span><div><h2>Availability and links</h2><p>These are the practical details project owners use to reach you.</p></div></div>
            <div className="field">
              <span>Availability</span>
              <div className="availability-options">
                {[['open', 'Open to collaborate'], ['limited', 'Limited right now'], ['unavailable', 'Not available']].map(([value, label]) => (
                  <label key={value}>
                    <input type="radio" name="availability" checked={draft.availability === value} onChange={() => setDraft({ ...draft, availability: value })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="two-fields">
              <Field label="GitHub profile" type="url" value={draft.github_url || ''} onChange={update('github_url')} placeholder="https://github.com/you" />
              <Field label="Portfolio URL" type="url" value={draft.portfolio_url || ''} onChange={update('portfolio_url')} placeholder="https://yourportfolio.com" />
            </div>
            <div className="field">
              <span>Preferred project categories</span>
              <div className="category-grid">
                {categories.map((category) => (
                  <label key={category}>
                    <input type="checkbox" checked={(draft.preferred_categories || []).includes(category)} onChange={() => setDraft({ ...draft, preferred_categories: (draft.preferred_categories || []).includes(category) ? draft.preferred_categories.filter((item) => item !== category) : [...draft.preferred_categories, category] })} />
                    {category}
                  </label>
                ))}
              </div>
            </div>
          </section>
          {message && <p className="notice profile-notice" role="status">{message}</p>}
          <div className="form-save">
            <button className="primary-button" disabled={saving}>
              {saving ? 'Saving profile' : <>Save profile <Arrow /></>}
            </button>
            <span>Only verified students in your college can see this profile.</span>
          </div>
        </div>
      </form>
    </section>
  )
}

const emptyProject = { title: '', shortDescription: '', description: '', problemStatement: '', proposedSolution: '', category: 'Web development', projectType: 'mini_project', teamSize: 4, recruitmentDeadline: '', durationWeeks: 8, technologyStack: [], skills: [], roles: [{ name: 'Frontend developer', description: '', positions: 1 }], status: 'recruiting' }

const sampleMitaoeProject = {
  title: 'MIT AOE Smart Campus Shuttle Tracker',
  shortDescription: 'Real-time GPS tracking and occupancy monitor for MIT AOE campus shuttles between Alandi and Pune city.',
  description: 'An IoT and web-based platform providing live GPS tracking, arrival time predictions, and seat availability for college buses. Designed to eliminate long waiting queues at Alandi depot and help students commute safely.',
  problemStatement: 'Students and faculty face unpredictable transit timings and crowded shuttle buses between Alandi and Swargate/Pune Station without any real-time tracking system.',
  proposedSolution: 'Deploy ESP32 GPS/cellular telemetry nodes on campus buses and connect them to a lightweight web dashboard that displays live vehicle locations, estimated arrival times, and passenger count.',
  category: 'Web development',
  projectType: 'mini_project',
  teamSize: 4,
  recruitmentDeadline: '2026-11-30',
  durationWeeks: 8,
  technologyStack: ['React', 'Express', 'Node.js', 'Leaflet.js', 'PostgreSQL'],
  skills: ['React', 'Node.js', 'Leaflet.js', 'PostgreSQL'],
  roles: [
    { name: 'Frontend Developer', description: 'Build interactive map UI in React & Leaflet', positions: 1 },
    { name: 'Backend & API Engineer', description: 'Implement REST & WebSocket telemetry endpoints', positions: 1 },
    { name: 'IoT Hardware Specialist', description: 'Interface GPS/GSM modules with ESP32 microcontroller', positions: 1 }
  ],
  status: 'recruiting'
}

function ProjectWorkspace({ user, onProfile, onDiscover, onProjectCreated }) {
  const [draft, setDraft] = useState(emptyProject)
  const [technology, setTechnology] = useState('')
  const [skill, setSkill] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (key) => (event) => setDraft({ ...draft, [key]: event.target.value })
  const addTag = (key, value, setter) => { const item = value.trim(); if (item && !draft[key].includes(item)) setDraft({ ...draft, [key]: [...draft[key], item] }); setter('') }
  const fillSample = () => {
    setDraft(sampleMitaoeProject)
    setMessage('Sample MIT AOE project data loaded! Review the details and click Publish Opportunity.')
  }

  const publish = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ ...draft, skills: draft.skills.map((name) => ({ name, level: 'intermediate' })) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setMessage(`“${data.project.title}” is published and ready for teammates.`)
      setDraft(emptyProject)
      if (onProjectCreated) onProjectCreated(data.project)
    } catch (error) {
      setMessage(error.message || 'We could not publish this project.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="project-page">
      <div className="project-heading">
        <div>
          <p className="eyebrow">Project management</p>
          <h1>Give a good idea a <em>clear start.</em></h1>
          <p>Set the direction, define the roles, then let the right students <span className="highlight">find their place.</span></p>
        </div>
        <div className="page-actions">
          <button type="button" className="outline-button" onClick={fillSample}>⚡ Fill sample example</button>
          <button className="outline-button" onClick={onDiscover}>Discover projects</button>
          <button className="outline-button" onClick={onProfile}>Back to profile</button>
        </div>
      </div>
      <form onSubmit={publish} className="project-layout">
        <aside className="project-brief">
          <p className="eyebrow">Publishing checklist</p>
          <ol>
            <li className={draft.title ? 'done' : ''}>Name the opportunity</li>
            <li className={draft.description.length >= 40 ? 'done' : ''}>Explain the problem</li>
            <li className={draft.roles.length ? 'done' : ''}>Open specific roles</li>
            <li className={draft.skills.length ? 'done' : ''}>Add the skills needed</li>
          </ol>
          <div className="aside-rule" />
          <p className="small-copy">You become the project owner and first team member when this project is published.</p>
        </aside>
        <div className="project-form">
          <section className="form-section">
            <div className="section-title"><span>01</span><div><h2>The opportunity</h2><p>Write the invitation your future team needs to see.</p></div></div>
            <Field label="Project title" value={draft.title} onChange={update('title')} placeholder="Build a campus shuttle tracker" />
            <label className="field"><span>Short description</span><textarea maxLength="240" value={draft.shortDescription} onChange={update('shortDescription')} placeholder="One clear sentence explaining what you want to build." /></label>
            <label className="field"><span>Detailed description</span><textarea value={draft.description} onChange={update('description')} placeholder="What will the team create, and what does success look like?" /></label>
            <div className="two-fields">
              <label className="field"><span>Category</span><select value={draft.category} onChange={update('category')}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="field"><span>Project type</span><select value={draft.projectType} onChange={update('projectType')}><option value="mini_project">Mini-project</option><option value="major_project">Major academic project</option><option value="personal_project">Personal project</option><option value="research_project">Research project</option><option value="hackathon">Hackathon project</option></select></label>
            </div>
          </section>
          <section className="form-section">
            <div className="section-title"><span>02</span><div><h2>Team shape</h2><p>Be specific about the people and capabilities that will make this work.</p></div></div>
            <div className="two-fields">
              <label className="field"><span>Total team size</span><input type="number" min="1" max="20" value={draft.teamSize} onChange={update('teamSize')} /></label>
              <label className="field"><span>Recruitment deadline</span><input type="date" value={draft.recruitmentDeadline} onChange={update('recruitmentDeadline')} /></label>
            </div>
            <div className="tag-editor">
              <label className="field"><span>Required skills</span><div className="add-row"><input value={skill} onChange={(event) => setSkill(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag('skills', skill, setSkill) } }} placeholder="Add a skill, e.g. PostgreSQL" /><button type="button" onClick={() => addTag('skills', skill, setSkill)}>Add</button></div></label>
              <div className="tags">{draft.skills.map((item) => <span className="skill-tag" key={item}>{item}<button type="button" onClick={() => setDraft({ ...draft, skills: draft.skills.filter((entry) => entry !== item) })}>×</button></span>)}</div>
            </div>
            <div className="role-list">
              {draft.roles.map((role, index) => (
                <div className="role-row" key={index}>
                  <input value={role.name} onChange={(event) => setDraft({ ...draft, roles: draft.roles.map((item, i) => i === index ? { ...item, name: event.target.value } : item) })} placeholder="Role name" />
                  <input type="number" min="1" max="20" value={role.positions} onChange={(event) => setDraft({ ...draft, roles: draft.roles.map((item, i) => i === index ? { ...item, positions: event.target.value } : item) })} aria-label="Positions" />
                  <button type="button" onClick={() => setDraft({ ...draft, roles: draft.roles.filter((_, i) => i !== index) })}>×</button>
                </div>
              ))}
              <button type="button" className="add-role" onClick={() => setDraft({ ...draft, roles: [...draft.roles, { name: '', description: '', positions: 1 }] })}>+ Add another role</button>
            </div>
          </section>
          <section className="form-section">
            <div className="section-title"><span>03</span><div><h2>Direction</h2><p>Help people understand the real problem before they apply.</p></div></div>
            <label className="field"><span>Problem statement</span><textarea value={draft.problemStatement} onChange={update('problemStatement')} placeholder="What frustrating or important problem are you solving?" /></label>
            <label className="field"><span>Proposed solution</span><textarea value={draft.proposedSolution} onChange={update('proposedSolution')} placeholder="How will the project approach that problem?" /></label>
            <label className="field"><span>Technology stack</span><div className="add-row"><input value={technology} onChange={(event) => setTechnology(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag('technologyStack', technology, setTechnology) } }} placeholder="Add a technology" /><button type="button" onClick={() => addTag('technologyStack', technology, setTechnology)}>Add</button></div></label>
            <div className="tags">{draft.technologyStack.map((item) => <span className="interest-tag" key={item}>{item}<button type="button" onClick={() => setDraft({ ...draft, technologyStack: draft.technologyStack.filter((entry) => entry !== item) })}>×</button></span>)}</div>
          </section>
          {message && <p className="notice profile-notice">{message}</p>}
          <div className="form-save">
            <button className="primary-button" disabled={busy}>{busy ? 'Publishing' : <>Publish project <Arrow /></>}</button>
            <span>Projects are visible only to verified students in your college.</span>
          </div>
        </div>
      </form>
    </section>
  )
}

const fallbackDemoProjects = [
  { id: 'p1', title: 'Campus shuttle tracker', short_description: 'A live, student-built tracker that makes daily campus travel less uncertain.', category: 'Mobile apps', project_type: 'mini_project', owner_name: 'Nia Shah', owner_id: 'u-demo-1', team_size: 4, member_count: 1, recruitment_deadline: '2026-11-18', status: 'recruiting', skills: [{ name: 'React Native', level: 'intermediate' }, { name: 'Maps API', level: 'beginner' }], roles: [{ id: 'r1', name: 'Mobile developer', positions: 1, description: 'Build and test iOS/Android views' }, { id: 'r2', name: 'UI designer', positions: 1, description: 'Design transit stop interactions' }] },
  { id: 'p2', title: 'Study group matcher', short_description: 'Match students with compatible schedules, subjects, and learning goals.', category: 'Web development', project_type: 'major_project', owner_name: 'Kabir Rao', owner_id: 'u-demo-2', team_size: 5, member_count: 2, recruitment_deadline: '2026-11-25', status: 'recruiting', skills: [{ name: 'React', level: 'advanced' }, { name: 'PostgreSQL', level: 'intermediate' }], roles: [{ id: 'r3', name: 'Backend developer', positions: 1, description: 'Model user availability in Postgres' }] },
  { id: 'p3', title: 'Energy use insights', short_description: 'Turn campus energy data into practical, visible conservation ideas.', category: 'Data science', project_type: 'research_project', owner_name: 'Maya Iyer', owner_id: 'u-demo-3', team_size: 3, member_count: 1, recruitment_deadline: '2026-12-02', status: 'recruiting', skills: [{ name: 'Python', level: 'intermediate' }, { name: 'Data analysis', level: 'intermediate' }], roles: [{ id: 'r4', name: 'Data researcher', positions: 1, description: 'Aggregate smart meter hourly data' }] },
]

function DiscoverWorkspace({
  user,
  onProjects,
  onRecruitment,
  onSaved,
  onOpenDetails,
  bookmarkedIds = new Set(),
  onToggleBookmark,
  onApplicationSubmitted,
}) {
  const [filters, setFilters] = useState({ search: '', category: '', sort: 'newest' })
  const [projects, setProjects] = useState(fallbackDemoProjects)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedForApply, setSelectedForApply] = useState(null)
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [applicationNotice, setApplicationNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchOpportunities = () => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) return

    const params = new URLSearchParams({ limit: '18', sort: filters.sort })
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)

    setLoading(true)
    setError('')
    fetch(`/api/projects?${params}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not refresh campus projects.')
        return res.json()
      })
      .then((data) => {
        if (data?.projects) {
          setProjects(data.projects.length > 0 ? data.projects : [])
        }
      })
      .catch((err) => {
        setError(err.message || 'Unable to connect to projects service.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOpportunities()
  }, [filters])

  const openApplyDrawer = (project) => {
    setSelectedForApply(project)
    setSelectedRoleId(project.roles && project.roles[0] ? project.roles[0].id : '')
    setIntroduction('')
    setApplicationNotice('')
  }

  const submitApplication = async () => {
    if (!selectedForApply) return
    const cleanIntro = introduction.trim()
    if (cleanIntro.length < 20) {
      setApplicationNotice('Please write at least 20 characters introducing your contribution.')
      return
    }
    if (cleanIntro.length > 1500) {
      setApplicationNotice('Please keep your introduction within 1,500 characters.')
      return
    }
    if (!selectedRoleId) {
      setApplicationNotice('Please select an open role to apply for.')
      return
    }

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) {
      setApplicationNotice('Please sign in with your verified college account to submit an application.')
      return
    }

    setSubmitting(true)
    setApplicationNotice('')

    try {
      const response = await fetch(`/api/projects/${selectedForApply.id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          roleId: selectedRoleId,
          introductionMessage: cleanIntro,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Could not submit application.')
      }

      setApplicationNotice('Application submitted. The project owner has been notified.')
      if (onApplicationSubmitted) {
        onApplicationSubmitted(selectedForApply.id, selectedForApply.title)
      }
      setTimeout(() => {
        setSelectedForApply(null)
      }, 1500)
    } catch (err) {
      setApplicationNotice(err.message || 'Something went wrong while submitting.')
    } finally {
      setSubmitting(false)
    }
  }

  const visible = projects.filter((project) => {
    const matchSearch = !filters.search || `${project.title} ${project.short_description}`.toLowerCase().includes(filters.search.toLowerCase())
    const matchCat = !filters.category || project.category === filters.category
    return matchSearch && matchCat
  })

  return (
    <section className="discover-page">
      <div className="discover-heading">
        <div>
          <p className="eyebrow">Discover projects</p>
          <h1>Find a team worth <em>showing up for.</em></h1>
          <p>Explore opportunities from your campus, then apply where your <span className="highlight">skills can make a difference.</span></p>
        </div>
        <div className="page-actions">
          <button className="outline-button" onClick={onRecruitment}>Review applicants</button>
          <button className="outline-button" onClick={onProjects}>Create a project</button>
        </div>
      </div>

      <div className="discovery-toolbar">
        <label className="search-box">
          <span>⌕</span>
          <input
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Search projects, skills, or ideas"
          />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
            <option value="newest">Newest first</option>
            <option value="closing">Closing soon</option>
          </select>
        </label>
      </div>

      <div className="listing-meta">
        <span>{loading ? 'Refreshing campus opportunities' : `${visible.length} recruiting opportunit${visible.length === 1 ? 'y' : 'ies'}`}</span>
        <span>Only your verified college community</span>
      </div>

      {error && (
        <div className="toast-banner">
          <span>{error}</span>
          <button type="button" onClick={fetchOpportunities}>Retry</button>
        </div>
      )}

      <div className="project-grid">
        {visible.map((project) => {
          const isSaved = bookmarkedIds.has(project.id)
          const openRolesTotal = project.roles
            ? project.roles.reduce((total, role) => total + Number(role.positions || role.positions_available || 0), 0)
            : 0

          return (
            <article className="project-card" key={project.id}>
              <div className="card-top">
                <span>{project.category}</span>
                <div className="card-top-right">
                  <span>{project.member_count || 1}/{project.team_size} members</span>
                  <button
                    type="button"
                    className={`card-bookmark-btn ${isSaved ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleBookmark(project.id)
                    }}
                    title={isSaved ? 'Remove from saved' : 'Save project'}
                    aria-label={isSaved ? 'Remove from saved' : 'Save project'}
                  >
                    {isSaved ? '★' : '☆'}
                  </button>
                </div>
              </div>

              <h2 className="clickable-title" onClick={() => onOpenDetails(project)}>
                {project.title}
              </h2>

              <p>{project.short_description}</p>

              <div className="tags">
                {(project.skills || []).slice(0, 3).map((skill) => (
                  <span className="interest-tag" key={skill.name}>{skill.name}</span>
                ))}
              </div>

              <div className="role-summary">
                <span>{openRolesTotal} open role{openRolesTotal === 1 ? '' : 's'}</span>
                <span>By {project.owner_name}</span>
              </div>

              <div className="card-footer">
                <span>
                  {project.recruitment_deadline
                    ? `Closes ${new Date(`${project.recruitment_deadline}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                    : 'Open recruitment'}
                </span>
                <div className="card-action-links">
                  <button type="button" className="details-btn" onClick={() => onOpenDetails(project)}>
                    Details
                  </button>
                  <button type="button" onClick={() => openApplyDrawer(project)}>
                    Apply <Arrow />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {selectedForApply && (
        <div className="apply-drawer" role="dialog" aria-modal="true" aria-label="Apply to project">
          <div>
            <button className="drawer-close" onClick={() => setSelectedForApply(null)}>×</button>
            <p className="eyebrow">Apply to join</p>
            <h2>{selectedForApply.title}</h2>
            <p className="drawer-lead">Choose a role and introduce the contribution you would like to make.</p>

            <label className="field">
              <span>Open role</span>
              <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}>
                {(selectedForApply.roles || []).map((role) => (
                  <option key={role.id || role.name} value={role.id || role.name}>
                    {role.name} ({role.positions || role.positions_available || 1} available)
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Introduction ({introduction.trim().length}/1500, min 20 chars)</span>
              <textarea
                value={introduction}
                onChange={(event) => setIntroduction(event.target.value)}
                maxLength={1500}
                placeholder="Share the relevant skills, experience, or motivation you would bring to this team."
              />
            </label>

            {applicationNotice && <p className="notice">{applicationNotice}</p>}

            <button className="primary-button" disabled={submitting} onClick={submitApplication}>
              {submitting ? 'Submitting...' : <>Submit application <Arrow /></>}
            </button>
          </div>
        </div>
      )}

      {!visible.length && !loading && (
        <div className="empty-state">
          <h2>No matches yet.</h2>
          <p>Try a broader search or clear a filter to see more campus opportunities.</p>
          <button className="outline-button" onClick={() => setFilters({ search: '', category: '', sort: 'newest' })}>
            Clear filters
          </button>
        </div>
      )}
    </section>
  )
}

function SavedProjectsWorkspace({ onDiscover, onOpenDetails, onRemoveBookmark }) {
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchSaved = () => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) {
      setProjects(fallbackDemoProjects.slice(0, 2))
      return
    }

    setLoading(true)
    setError('')
    fetch('/api/users/me/bookmarks', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load saved projects.')
        return res.json()
      })
      .then((data) => {
        if (data?.projects) setProjects(data.projects)
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch bookmarks.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSaved()
  }, [])

  const remove = async (id) => {
    setProjects(projects.filter((project) => project.id !== id))
    if (onRemoveBookmark) onRemoveBookmark(id)
  }

  const statusLabel = (status) =>
    status === 'recruiting'
      ? 'Recruiting now'
      : status === 'recruitment_closed'
      ? 'Recruitment closed'
      : status === 'in_progress'
      ? 'In progress'
      : status === 'completed'
      ? 'Completed'
      : 'Archived'

  const visible = projects.filter((project) => filter === 'all' || project.status === filter)

  return (
    <section className="saved-page">
      <div className="discover-heading">
        <div>
          <p className="eyebrow">Saved projects</p>
          <h1>Keep the good ones <em>close.</em></h1>
          <p>Return to opportunities that caught your attention, and see which ones still have <span className="highlight">room for your contribution.</span></p>
        </div>
        <button className="outline-button" onClick={onDiscover}>Discover projects</button>
      </div>

      <div className="saved-toolbar">
        <span>{loading ? 'Refreshing your saved projects' : `${projects.length} project${projects.length === 1 ? '' : 's'} saved`}</span>
        <div>
          {[['all', 'All'], ['recruiting', 'Recruiting'], ['recruitment_closed', 'Closed']].map(([value, label]) => (
            <button className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="notice" style={{ marginBottom: '1rem' }}>{error}</p>}

      {visible.length ? (
        <div className="saved-list">
          {visible.map((project) => (
            <article className="saved-card" key={project.id}>
              <div className="saved-card-top">
                <span>{project.category}</span>
                <span className={`saved-status ${project.status}`}>{statusLabel(project.status)}</span>
              </div>
              <h2 className="clickable-title" onClick={() => onOpenDetails(project)}>
                {project.title}
              </h2>
              <p>{project.short_description}</p>
              <div className="tags">
                {(project.skills || []).slice(0, 3).map((skill) => (
                  <span className="interest-tag" key={skill.name}>{skill.name}</span>
                ))}
              </div>
              <div className="saved-meta">
                <span>By {project.owner_name}</span>
                <span>{project.member_count || 1}/{project.team_size} members</span>
              </div>
              <div className="saved-card-footer">
                <button type="button" onClick={() => onOpenDetails(project)}>
                  View details <Arrow />
                </button>
                <button type="button" onClick={() => remove(project.id)}>
                  Remove <span aria-hidden="true">×</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No saved projects here.</h2>
          <p>Save an opportunity in Discover to keep it within easy reach.</p>
          <button className="outline-button" onClick={onDiscover}>Browse projects</button>
        </div>
      )}
    </section>
  )
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('projectcollab-theme') || 'dark'
  })
  const [mode, setMode] = useState('register')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [workspace, setWorkspace] = useState('discover')
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null)
  const [activeProjectId, setActiveProjectId] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('projectcollab-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const previewParam = params.get('preview')
    const initialPid = params.get('projectId')
    if (initialPid) setActiveProjectId(initialPid)

    if (import.meta.env.DEV && previewParam) {
      setUser({ id: 'preview-user', name: 'Aarav Mehta', email: 'aarav@example.edu' })
      if (previewParam === 'profile') {
        setProfile({ department: 'Computer science', academic_year: 3, bio: 'I enjoy turning thoughtful product ideas into clean, useful web experiences.', availability: 'open', github_url: 'https://github.com/aarav', portfolio_url: 'https://aarav.dev', preferred_categories: ['Web development', 'AI and ML'], skills: [{ name: 'React', level: 'advanced' }, { name: 'Figma', level: 'intermediate' }, { name: 'Node.js', level: 'intermediate' }], interests: ['Design systems', 'Education', 'Applied AI'] })
        setWorkspace('profile')
      } else if (previewParam === 'project') setWorkspace('projects')
      else if (previewParam === 'discover') setWorkspace('discover')
      else if (previewParam === 'recruitment') setWorkspace('recruitment')
      else if (previewParam === 'team') setWorkspace('team')
      else if (previewParam === 'workspace') setWorkspace('workspace')
      else if (previewParam === 'notifications') setWorkspace('notifications')
      else if (previewParam === 'saved') setWorkspace('saved')
      return
    }

    const saved = localStorage.getItem('projectcollab-session')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.user) setUser(parsed.user)
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) return

    fetch('/api/users/me', { headers: { Authorization: `Bearer ${session.token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.profile && setProfile(data.profile))
      .catch(() => {})

    fetch('/api/users/me/bookmarks', { headers: { Authorization: `Bearer ${session.token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.projects) {
          setBookmarkedIds(new Set(data.projects.map((p) => p.id)))
        }
      })
      .catch(() => {})

    fetch('/api/notifications', { headers: { Authorization: `Bearer ${session.token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.unreadCount === 'number') {
          setUnreadNotificationsCount(data.unreadCount)
        }
      })
      .catch(() => {})
  }, [user])

  async function call(path, body) {
    const response = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.')
    return data
  }

  async function authenticate(form) {
    setBusy(true)
    setMessage('')
    try {
      const data = await call(mode === 'register' ? '/register' : '/login', form)
      if (mode === 'register' && !data.token) {
        setMode('verify')
        setMessage(data.verificationToken ? `Development token: ${data.verificationToken}` : data.message)
      } else {
        localStorage.setItem('projectcollab-session', JSON.stringify(data))
        setUser(data.user)
        setWorkspace('discover')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function verify(token) {
    setBusy(true)
    setMessage('')
    try {
      const data = await call('/verify-email', { token })
      localStorage.setItem('projectcollab-session', JSON.stringify(data))
      setUser(data.user)
      setWorkspace('discover')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function forgot({ email }) {
    setBusy(true)
    setMessage('')
    try {
      const data = await call('/forgot-password', { email })
      setMessage(data.resetToken ? `Development reset token: ${data.resetToken}` : data.message)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveProfile(draft) {
    setSavingProfile(true)
    try {
      const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          department: draft.department,
          academicYear: draft.academic_year,
          bio: draft.bio,
          profilePictureUrl: draft.profile_picture_url,
          githubUrl: draft.github_url,
          portfolioUrl: draft.portfolio_url,
          availability: draft.availability,
          preferredCategories: draft.preferred_categories,
          skills: draft.skills,
          interests: draft.interests,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setProfile(data.profile)
      return 'Profile saved. Your campus profile is ready.'
    } catch (error) {
      return error.message || 'We could not save your profile.'
    } finally {
      setSavingProfile(false)
    }
  }

  const toggleBookmark = async (projectId) => {
    const isCurrentlySaved = bookmarkedIds.has(projectId)
    const nextSet = new Set(bookmarkedIds)
    if (isCurrentlySaved) nextSet.delete(projectId)
    else nextSet.add(projectId)
    setBookmarkedIds(nextSet)

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) return

    try {
      if (isCurrentlySaved) {
        await fetch(`/api/projects/${projectId}/bookmark`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.token}` },
        })
      } else {
        await fetch(`/api/projects/${projectId}/bookmark`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` },
        })
      }
    } catch {
      setBookmarkedIds(bookmarkedIds)
    }
  }

  const handleArchiveProject = async (projectId) => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) return

    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Could not archive project.')
    }
    setToastMessage('Project archived successfully. It has been removed from discovery.')
    setTimeout(() => setToastMessage(''), 4000)
    setWorkspace('discover')
  }

  function logout() {
    localStorage.removeItem('projectcollab-session')
    setUser(null)
    setMode('login')
  }

  return (
    <main id="top" className="page-shell">
      <HoneycombBackground />
      <header>
        <Mark onClick={() => user && setWorkspace('discover')} />
        <div className="header-actions">
          {!user && (
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          )}
          <span className="college-chip">Campus edition</span>
          {user && (
            <button className="text-link" onClick={logout}>
              Sign out
            </button>
          )}
        </div>
      </header>

      {user && (
        <Navigation
          currentWorkspace={workspace}
          onNavigate={(target) => setWorkspace(target)}
          unreadCount={unreadNotificationsCount}
          savedCount={bookmarkedIds.size}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {toastMessage && (
        <div className="toast-banner" role="status">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage('')} aria-label="Dismiss notification">×</button>
        </div>
      )}

      {user ? (
        workspace === 'projects' ? (
          <ProjectWorkspace
            user={user}
            onProfile={() => setWorkspace('profile')}
            onDiscover={() => setWorkspace('discover')}
            onProjectCreated={(newProject) => {
              setToastMessage(`“${newProject.title}” is published!`)
              setTimeout(() => setToastMessage(''), 4000)
              setWorkspace('discover')
            }}
          />
        ) : workspace === 'discover' ? (
          <DiscoverWorkspace
            user={user}
            onProjects={() => setWorkspace('projects')}
            onRecruitment={() => setWorkspace('recruitment')}
            onSaved={() => setWorkspace('saved')}
            onOpenDetails={(project) => setSelectedProjectForDetails(project)}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            onApplicationSubmitted={(projId, title) => {
              setToastMessage(`Application submitted for “${title}”.`)
              setTimeout(() => setToastMessage(''), 4500)
            }}
          />
        ) : workspace === 'saved' ? (
          <SavedProjectsWorkspace
            onDiscover={() => setWorkspace('discover')}
            onOpenDetails={(project) => setSelectedProjectForDetails(project)}
            onRemoveBookmark={(id) => toggleBookmark(id)}
          />
        ) : workspace === 'recruitment' ? (
          <RecruitmentDashboard
            user={user}
            initialProjectId={activeProjectId}
            onDiscover={() => setWorkspace('discover')}
            onProjects={() => setWorkspace('projects')}
            onNavigateTeam={(projId) => {
              setActiveProjectId(projId)
              setWorkspace('team')
            }}
          />
        ) : workspace === 'team' ? (
          <TeamManagement
            user={user}
            initialProjectId={activeProjectId}
            onDiscover={() => setWorkspace('discover')}
            onNavigateRecruitment={(projId) => {
              setActiveProjectId(projId)
              setWorkspace('recruitment')
            }}
            onNavigateWorkspace={(projId) => {
              setActiveProjectId(projId)
              setWorkspace('workspace')
            }}
          />
        ) : workspace === 'workspace' ? (
          <CollaborationWorkspace
            user={user}
            initialProjectId={activeProjectId}
            onNavigateTeam={(projId) => {
              setActiveProjectId(projId)
              setWorkspace('team')
            }}
            onDiscover={() => setWorkspace('discover')}
          />
        ) : workspace === 'notifications' ? (
          <NotificationsWorkspace
            user={user}
            onNavigateWorkspace={(projId) => {
              if (projId) setActiveProjectId(projId)
              setWorkspace('workspace')
            }}
            onNavigateRecruitment={(projId) => {
              if (projId) setActiveProjectId(projId)
              setWorkspace('recruitment')
            }}
            onNavigateTeam={(projId) => {
              if (projId) setActiveProjectId(projId)
              setWorkspace('team')
            }}
            onNotificationRead={() => {
              setUnreadNotificationsCount((prev) => Math.max(0, prev - 1))
            }}
          />
        ) : (
          <ProfileWorkspace
            user={user}
            profile={profile}
            onSave={saveProfile}
            saving={savingProfile}
            onSignOut={logout}
            onProjects={() => setWorkspace('projects')}
          />
        )
      ) : (
        <div className="auth-layout">
          {mode === 'forgot' ? (
            <ForgotPanel onModeChange={setMode} onSubmit={forgot} busy={busy} message={message} />
          ) : mode === 'verify' ? (
            <Verification message={message} onVerify={verify} busy={busy} />
          ) : (
            <AuthPanel mode={mode} onModeChange={setMode} onSubmit={authenticate} busy={busy} message={message} />
          )}
          <SideStory />
        </div>
      )}

      {selectedProjectForDetails && (
        <ProjectDetailsModal
          projectId={selectedProjectForDetails.id}
          initialProject={selectedProjectForDetails}
          user={user}
          isBookmarked={bookmarkedIds.has(selectedProjectForDetails.id)}
          onToggleBookmark={(id) => toggleBookmark(id)}
          onOpenApply={(proj) => {
            setSelectedProjectForDetails(null)
            setWorkspace('discover')
          }}
          onNavigateRecruitment={(id) => {
            setSelectedProjectForDetails(null)
            setActiveProjectId(id)
            setWorkspace('recruitment')
          }}
          onArchiveProject={handleArchiveProject}
          onClose={() => setSelectedProjectForDetails(null)}
        />
      )}

      <footer>
        <span>© 2026 ProjectCollab</span>
        <span>Student-led, college-first.</span>
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
