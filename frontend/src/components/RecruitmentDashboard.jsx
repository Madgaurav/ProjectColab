import { useEffect, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

const fallbackProjects = [
  { id: 'p1', title: 'Campus shuttle tracker', team_size: 4, member_count: 1, status: 'recruiting' },
  { id: 'p2', title: 'Study group matcher', team_size: 5, member_count: 2, status: 'recruiting' },
]

const fallbackApplicants = [
  {
    id: 'a1',
    name: 'Ishita Verma',
    role_name: 'Frontend developer',
    department: 'Computer science',
    academic_year: 3,
    introduction_message: 'I have built two React projects and would love to shape an accessible interface for this idea.',
    skills: [{ name: 'React', level: 'advanced' }, { name: 'Figma', level: 'intermediate' }, { name: 'Accessibility', level: 'intermediate' }],
    status: 'pending',
  },
  {
    id: 'a2',
    name: 'Dev Malhotra',
    role_name: 'UI designer',
    department: 'Design & Media',
    academic_year: 2,
    introduction_message: 'I am interested in transport tools that make daily student life simpler. I can contribute research and interaction design.',
    skills: [{ name: 'Research', level: 'intermediate' }, { name: 'Figma', level: 'advanced' }],
    status: 'pending',
  },
]

export function RecruitmentDashboard({
  user,
  initialProjectId,
  onDiscover,
  onProjects,
  onNavigateTeam,
}) {
  const [ownedProjects, setOwnedProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '')
  const [selectedProject, setSelectedProject] = useState(null)
  const [applications, setApplications] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmRejectApp, setConfirmRejectApp] = useState(null)
  const [decidingId, setDecidingId] = useState('')

  // 1. Fetch user's owned projects
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) {
      setOwnedProjects(fallbackProjects)
      if (!selectedProjectId) setSelectedProjectId(fallbackProjects[0].id)
      return
    }

    setLoadingProjects(true)
    fetch('/api/users/me/teams', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.teams) {
          const owned = data.teams.filter(
            (t) => t.role === 'Project owner' || t.owner_id === user?.id
          )
          setOwnedProjects(owned)
          if (owned.length > 0) {
            const currentSelectedExists = owned.some((p) => p.id === selectedProjectId)
            if (!currentSelectedExists) {
              setSelectedProjectId(owned[0].id)
            }
          }
        }
      })
      .catch(() => {
        setOwnedProjects(fallbackProjects)
        if (!selectedProjectId) setSelectedProjectId(fallbackProjects[0].id)
      })
      .finally(() => setLoadingProjects(false))
  }, [user])

  // Update selectedProject metadata when selectedProjectId or ownedProjects change
  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null)
      return
    }
    const found = ownedProjects.find((p) => p.id === selectedProjectId)
    if (found) setSelectedProject(found)
  }, [selectedProjectId, ownedProjects])

  // 2. Fetch applications for selected project
  const fetchApplications = () => {
    if (!selectedProjectId) {
      setApplications([])
      return
    }

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) {
      setApplications(fallbackApplicants)
      return
    }

    setLoadingApplications(true)
    setError('')
    fetch(`/api/projects/${selectedProjectId}/applications`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || 'Could not load applications.')
        }
        return res.json()
      })
      .then((data) => {
        if (data?.applications) {
          setApplications(data.applications)
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch applicants.')
        setApplications([])
      })
      .finally(() => setLoadingApplications(false))
  }

  useEffect(() => {
    fetchApplications()
  }, [selectedProjectId])

  // 3. Make recruitment decision (accept or reject)
  const makeDecision = async (applicationId, status) => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    setDecidingId(applicationId)
    setNotice('')
    setError('')

    if (!session.token) {
      // Mock mode fallback
      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, status } : app
        )
      )
      setNotice(
        status === 'accepted'
          ? 'Applicant accepted and added to the team.'
          : 'Application declined.'
      )
      setDecidingId('')
      setConfirmRejectApp(null)
      return
    }

    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Could not record decision.')
      }

      setNotice(data.message || (status === 'accepted' ? 'Applicant accepted and added to team.' : 'Application declined.'))
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status } : app
        )
      )
      // Refresh project team counts if accepted
      if (status === 'accepted') {
        setSelectedProject((prev) =>
          prev ? { ...prev, member_count: Number(prev.member_count || 1) + 1 } : prev
        )
      }
    } catch (err) {
      setError(err.message || 'Failed to update application.')
    } finally {
      setDecidingId('')
      setConfirmRejectApp(null)
    }
  }

  const pendingCount = applications.filter((app) => app.status === 'pending').length
  const acceptedCount = applications.filter((app) => app.status === 'accepted').length

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === 'all') return true
    return app.status === statusFilter
  })

  return (
    <section className="recruitment-page">
      <div className="discover-heading">
        <div>
          <p className="eyebrow">Recruitment dashboard</p>
          <h1>Choose the people who <em>move it forward.</em></h1>
          <p>
            Review applications with the project context in view, then make a{' '}
            <span className="highlight">clear, considered decision.</span>
          </p>
        </div>
        <div className="page-actions">
          {selectedProjectId && (
            <button
              className="outline-button"
              onClick={() => onNavigateTeam && onNavigateTeam(selectedProjectId)}
            >
              View team
            </button>
          )}
          <button className="outline-button" onClick={onDiscover}>
            Discover projects
          </button>
        </div>
      </div>

      {/* Project Selector Bar */}
      <div className="saved-toolbar" style={{ marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', flexWrap: 'wrap' }}>
          <label className="recruitment-project-label">
            <span>Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="recruitment-project-select"
            >
              {ownedProjects.length === 0 && <option value="">No owned projects found</option>}
              {ownedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.status})
                </option>
              ))}
            </select>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
            {[['all', 'All'], ['pending', 'Pending'], ['accepted', 'Accepted'], ['rejected', 'Declined']].map(
              ([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={statusFilter === val ? 'active' : ''}
                  onClick={() => setStatusFilter(val)}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {notice && (
        <div className="toast-banner" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')}>×</button>
        </div>
      )}

      {error && <p className="notice" style={{ marginBottom: '1rem' }}>{error}</p>}

      {selectedProject && (
        <div className="recruitment-summary">
          <div>
            <span>Active project</span>
            <strong>{selectedProject.title}</strong>
          </div>
          <div>
            <span>Team capacity</span>
            <strong>
              {selectedProject.member_count || (acceptedCount + 1)} of {selectedProject.team_size || 4} filled
            </strong>
          </div>
          <div>
            <span>Review status</span>
            <strong>{pendingCount} pending application{pendingCount === 1 ? '' : 's'}</strong>
          </div>
        </div>
      )}

      {loadingApplications && (
        <p className="small-copy" style={{ margin: '2rem 0', textAlign: 'center', color: '#999' }}>
          Refreshing applicant records...
        </p>
      )}

      {!loadingApplications && filteredApplications.length > 0 && (
        <div className="applicant-list">
          {filteredApplications.map((applicant) => {
            const initials = applicant.name
              ? applicant.name.split(' ').map((p) => p[0]).slice(0, 2).join('')
              : 'ST'
            const isPending = applicant.status === 'pending'
            const isDeciding = decidingId === applicant.id

            return (
              <article className="applicant-card" key={applicant.id}>
                <div className="applicant-avatar">{initials}</div>
                <div className="applicant-content">
                  <div className="applicant-head">
                    <div>
                      <h2>{applicant.name}</h2>
                      <p>
                        Applied for <strong>{applicant.role_name}</strong>
                        {applicant.department ? ` · ${applicant.department}` : ''}
                        {applicant.academic_year ? ` (Year ${applicant.academic_year})` : ''}
                      </p>
                    </div>
                    <span className={`decision ${applicant.status}`}>
                      {applicant.status === 'pending' ? 'Pending review' : applicant.status}
                    </span>
                  </div>

                  <p className="applicant-message">“{applicant.introduction_message}”</p>

                  {applicant.skills && applicant.skills.length > 0 && (
                    <div className="tags">
                      {applicant.skills.map((skill, idx) => (
                        <span className="interest-tag" key={skill.name || idx}>
                          {skill.name || skill}
                          {skill.level && <small style={{ color: '#888', marginLeft: '0.2rem' }}>({skill.level})</small>}
                        </span>
                      ))}
                    </div>
                  )}

                  {isPending && (
                    <div className="decision-actions">
                      <button
                        className="accept"
                        disabled={isDeciding}
                        onClick={() => makeDecision(applicant.id, 'accepted')}
                      >
                        {isDeciding ? 'Updating...' : <>Accept <Arrow /></>}
                      </button>
                      <button
                        className="decline"
                        disabled={isDeciding}
                        onClick={() => setConfirmRejectApp(applicant)}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!loadingApplications && !ownedProjects.length && (
        <div className="empty-state">
          <h2>No project opportunities owned yet.</h2>
          <p>Create a project opportunity to start receiving student applications.</p>
          <button className="primary-button" onClick={onProjects}>
            Create a project <Arrow />
          </button>
        </div>
      )}

      {!loadingApplications && ownedProjects.length > 0 && !filteredApplications.length && (
        <div className="empty-state">
          <h2>No applications found.</h2>
          <p>
            {statusFilter !== 'all'
              ? `There are no ${statusFilter} applications for this project.`
              : 'No students have applied to this project yet. Ensure your opportunity is active in Discover.'}
          </p>
          {statusFilter !== 'all' && (
            <button className="outline-button" onClick={() => setStatusFilter('all')}>
              Show all applications
            </button>
          )}
        </div>
      )}

      {/* Confirmation Dialog before Declining */}
      <ConfirmDialog
        isOpen={Boolean(confirmRejectApp)}
        title="Decline this application?"
        message={`Are you sure you want to decline ${confirmRejectApp?.name}'s application for ${confirmRejectApp?.role_name}? The applicant will be notified.`}
        confirmLabel="Decline application"
        cancelLabel="Keep for review"
        isDestructive={true}
        onConfirm={() => confirmRejectApp && makeDecision(confirmRejectApp.id, 'rejected')}
        onCancel={() => setConfirmRejectApp(null)}
        busy={Boolean(decidingId)}
      />
    </section>
  )
}
