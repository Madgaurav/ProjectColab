import { useEffect, useState } from 'react'

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

const statusMap = {
  recruiting: 'Recruiting now',
  recruitment_closed: 'Recruitment closed',
  in_progress: 'In progress',
  completed: 'Completed',
  archived: 'Archived',
}

const projectTypeMap = {
  mini_project: 'Mini-project',
  major_project: 'Major academic project',
  personal_project: 'Personal project',
  research_project: 'Research project',
  hackathon: 'Hackathon project',
}

export function ProjectDetailsModal({
  projectId,
  initialProject = null,
  user,
  isBookmarked = false,
  onToggleBookmark,
  onOpenApply,
  onNavigateRecruitment,
  onArchiveProject,
  onClose,
}) {
  const [project, setProject] = useState(initialProject)
  const [loading, setLoading] = useState(!initialProject)
  const [error, setError] = useState('')
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    if (!projectId) return
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) return

    setLoading(true)
    setError('')
    fetch(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load project details.')
        return res.json()
      })
      .then((data) => {
        if (data?.project) setProject(data.project)
      })
      .catch((err) => {
        if (!project) setError(err.message || 'Failed to load project.')
      })
      .finally(() => setLoading(false))
  }, [projectId])

  if (!project && !loading && error) {
    return (
      <div className="details-overlay" role="dialog" aria-modal="true" aria-label="Project details error">
        <div className="details-card">
          <button className="drawer-close" onClick={onClose} aria-label="Close dialog">×</button>
          <h2>Project unavailable</h2>
          <p className="notice">{error}</p>
          <button className="outline-button" onClick={onClose} style={{ marginTop: '1.5rem' }}>Close</button>
        </div>
      </div>
    )
  }

  if (loading && !project) {
    return (
      <div className="details-overlay" role="dialog" aria-modal="true" aria-label="Loading project details">
        <div className="details-card">
          <button className="drawer-close" onClick={onClose} aria-label="Close dialog">×</button>
          <p className="eyebrow">Project details</p>
          <h2>Loading opportunity...</h2>
          <p className="small-copy">Fetching verified details from your campus network.</p>
        </div>
      </div>
    )
  }

  if (!project) return null

  const isOwner = user && (user.id === project.owner_id || project.owner_id === 'preview-user')
  const statusLabel = statusMap[project.status] || project.status
  const typeLabel = projectTypeMap[project.project_type] || project.project_type || 'Project'
  const deadlineDate = project.recruitment_deadline
    ? new Date(`${project.recruitment_deadline}T12:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await onArchiveProject(project.id)
      setShowArchiveConfirm(false)
      onClose()
    } catch (err) {
      setError(err.message || 'Could not archive project.')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="details-overlay" role="dialog" aria-modal="true" aria-label={project.title}>
      <div className="details-card">
        <button className="drawer-close" onClick={onClose} aria-label="Close details">×</button>

        <div className="details-header">
          <div className="details-topline">
            <span className="details-category">{project.category}</span>
            <span className="details-type">{typeLabel}</span>
            <span className={`saved-status ${project.status}`}>{statusLabel}</span>
          </div>
          <h1>{project.title}</h1>
          <p className="details-lead">{project.short_description}</p>
        </div>

        <div className="details-meta-bar">
          <div>
            <span>Project owner</span>
            <strong>{project.owner_name}</strong>
          </div>
          <div>
            <span>Team capacity</span>
            <strong>{project.member_count || 1} of {project.team_size} filled</strong>
          </div>
          <div>
            <span>Recruitment</span>
            <strong>{deadlineDate ? `Closes ${deadlineDate}` : 'Open recruitment'}</strong>
          </div>
          {project.duration_weeks && (
            <div>
              <span>Duration</span>
              <strong>{project.duration_weeks} weeks</strong>
            </div>
          )}
        </div>

        <div className="details-body">
          {project.problem_statement && (
            <section className="details-section">
              <p className="eyebrow">The challenge</p>
              <h2>Problem statement</h2>
              <p className="details-copy">{project.problem_statement}</p>
            </section>
          )}

          {project.proposed_solution && (
            <section className="details-section">
              <p className="eyebrow">The approach</p>
              <h2>Proposed solution</h2>
              <p className="details-copy">{project.proposed_solution}</p>
            </section>
          )}

          <section className="details-section">
            <p className="eyebrow">Context and scope</p>
            <h2>Detailed description</h2>
            <p className="details-copy">{project.description}</p>
          </section>

          {project.technology_stack && project.technology_stack.length > 0 && (
            <section className="details-section">
              <p className="eyebrow">Tools</p>
              <h2>Technology stack</h2>
              <div className="tags">
                {project.technology_stack.map((tech) => (
                  <span className="interest-tag" key={tech}>{tech}</span>
                ))}
              </div>
            </section>
          )}

          {project.skills && project.skills.length > 0 && (
            <section className="details-section">
              <p className="eyebrow">Capabilities</p>
              <h2>Required skills</h2>
              <div className="tags">
                {project.skills.map((skill) => (
                  <span className="skill-tag" key={skill.name}>
                    {skill.name}
                    {skill.level && <small style={{ color: '#999', marginLeft: '0.2rem' }}>({skill.level})</small>}
                  </span>
                ))}
              </div>
            </section>
          )}

          {project.roles && project.roles.length > 0 && (
            <section className="details-section">
              <p className="eyebrow">Open positions</p>
              <h2>Team roles</h2>
              <div className="roles-grid">
                {project.roles.map((role, idx) => (
                  <article className="role-detail-card" key={role.id || idx}>
                    <div className="role-detail-head">
                      <h3>{role.name}</h3>
                      <span className="role-badge">{role.positions} position{role.positions === 1 ? '' : 's'}</span>
                    </div>
                    {role.description && <p className="role-desc">{role.description}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        {error && <p className="notice" style={{ margin: '1rem 0' }}>{error}</p>}

        <div className="details-footer">
          <div className="footer-left">
            {!isOwner && (
              <button
                type="button"
                className={`outline-button bookmark-toggle-btn ${isBookmarked ? 'active' : ''}`}
                onClick={() => onToggleBookmark(project.id)}
              >
                {isBookmarked ? '★ Saved in your list' : '☆ Save for later'}
              </button>
            )}
            {isOwner && (
              <span className="owner-status-chip">You are the project owner</span>
            )}
          </div>

          <div className="footer-right">
            {isOwner ? (
              <>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => {
                    onClose()
                    onNavigateRecruitment(project.id)
                  }}
                >
                  Review applications <Arrow />
                </button>
                {project.status !== 'archived' && (
                  <button
                    type="button"
                    className="archive-trigger-btn"
                    onClick={() => setShowArchiveConfirm(true)}
                  >
                    Archive project
                  </button>
                )}
              </>
            ) : project.status === 'recruiting' ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  onClose()
                  onOpenApply(project)
                }}
              >
                Apply for a role <Arrow />
              </button>
            ) : (
              <span className="closed-notice">Recruitment is currently closed</span>
            )}
          </div>
        </div>

        {showArchiveConfirm && (
          <div className="dialog-overlay" role="dialog" aria-modal="true" aria-label="Confirm archive">
            <div className="dialog-card">
              <p className="eyebrow">Confirmation required</p>
              <h2>Archive this project?</h2>
              <p className="dialog-message">
                Archiving will close recruitment and hide this project from campus discovery.
                Team members will still be able to review prior progress.
              </p>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setShowArchiveConfirm(false)}
                  disabled={archiving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="destructive-button"
                  onClick={handleArchive}
                  disabled={archiving}
                >
                  {archiving ? 'Archiving...' : <>Archive project <Arrow /></>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
