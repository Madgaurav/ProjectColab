import { useEffect, useState } from 'react'

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

const fallbackProjects = [
  { id: 'p1', title: 'Campus shuttle tracker', team_size: 4, member_count: 3, role: 'Project owner' },
]

const fallbackTasks = [
  { id: 't1', title: 'Map the core commuter journey', assignee_name: 'Nia Shah', due_date: '2026-10-30', status: 'todo' },
  { id: 't2', title: 'Set up the API data model', assignee_name: 'Aarav Mehta', due_date: '2026-11-02', status: 'in_progress' },
  { id: 't3', title: 'Validate the first prototype', assignee_name: 'Ishita Verma', due_date: '2026-10-24', status: 'completed' },
]

const fallbackAnnouncements = [
  { id: 'a1', author_name: 'Aarav Mehta', message: 'The project brief is ready. Please add your first task before Friday.', created_at: '2026-10-20' },
]

const fallbackResources = [
  { id: 'r1', label: 'Design workspace', url: 'https://www.figma.com' },
  { id: 'r2', label: 'Project repository', url: 'https://github.com' },
  { id: 'r3', label: 'Research notes', url: 'https://docs.google.com' },
]

const fallbackMilestones = [
  { id: 'm1', title: 'Prototype review', due_date: '2026-11-08' },
]

export function CollaborationWorkspace({
  user,
  initialProjectId,
  onNavigateTeam,
  onDiscover,
}) {
  const [userTeams, setUserTeams] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '')
  const [activeProject, setActiveProject] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])

  // Workspace items
  const [tasks, setTasks] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [resources, setResources] = useState([])
  const [milestones, setMilestones] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // New task form state
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskDraft, setTaskDraft] = useState({ title: '', description: '', assignedTo: '', dueDate: '' })
  const [creatingTask, setCreatingTask] = useState(false)

  // Announcement compose
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [postingAnnouncement, setPostingAnnouncement] = useState(false)

  // New resource form state
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [resourceDraft, setResourceDraft] = useState({ label: '', url: '' })
  const [addingResource, setAddingResource] = useState(false)

  // New milestone form state (Owner only)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [milestoneDraft, setMilestoneDraft] = useState({ title: '', dueDate: '' })
  const [addingMilestone, setAddingMilestone] = useState(false)

  // 1. Load user's teams
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) {
      setUserTeams(fallbackProjects)
      if (!selectedProjectId) setSelectedProjectId(fallbackProjects[0].id)
      return
    }

    fetch('/api/users/me/teams', {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.teams && data.teams.length > 0) {
          setUserTeams(data.teams)
          const exists = data.teams.some((t) => t.id === selectedProjectId)
          if (!exists) setSelectedProjectId(data.teams[0].id)
        } else {
          setUserTeams([])
        }
      })
      .catch(() => {
        setUserTeams(fallbackProjects)
        if (!selectedProjectId) setSelectedProjectId(fallbackProjects[0].id)
      })
  }, [user])

  // Update activeProject metadata
  useEffect(() => {
    if (!selectedProjectId) {
      setActiveProject(null)
      return
    }
    const found = userTeams.find((t) => t.id === selectedProjectId)
    if (found) setActiveProject(found)
  }, [selectedProjectId, userTeams])

  // 2. Fetch workspace items & team members for the selected project
  const fetchWorkspace = () => {
    if (!selectedProjectId) return

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) {
      setTasks(fallbackTasks)
      setAnnouncements(fallbackAnnouncements)
      setResources(fallbackResources)
      setMilestones(fallbackMilestones)
      return
    }

    setLoading(true)
    setError('')

    Promise.all([
      fetch(`/api/projects/${selectedProjectId}/workspace`, {
        headers: { Authorization: `Bearer ${session.token}` },
      }),
      fetch(`/api/projects/${selectedProjectId}/team`, {
        headers: { Authorization: `Bearer ${session.token}` },
      }),
    ])
      .then(async ([workRes, teamRes]) => {
        if (!workRes.ok) {
          const errData = await workRes.json().catch(() => ({}))
          throw new Error(errData.message || 'Could not load private workspace.')
        }
        const workData = await workRes.json()
        setTasks(workData.tasks || [])
        setAnnouncements(workData.announcements || [])
        setResources(workData.resources || [])
        setMilestones(workData.milestones || [])

        if (teamRes.ok) {
          const teamData = await teamRes.json()
          if (teamData?.members) setTeamMembers(teamData.members)
          if (teamData?.project) {
            setActiveProject((prev) => ({ ...prev, ...teamData.project }))
          }
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load workspace contents.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchWorkspace()
  }, [selectedProjectId])

  const isOwner = Boolean(
    activeProject && (activeProject.owner_id === user?.id || activeProject.role === 'Project owner' || user?.id === 'preview-user')
  )

  // 3. Move task status (Kanban movement)
  const moveTaskStatus = async (taskId, targetStatus) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    )

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) return

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ status: targetStatus }),
      })
      if (!res.ok) {
        throw new Error('Could not update task status.')
      }
    } catch {
      fetchWorkspace()
    }
  }

  // 4. Create task
  const handleCreateTask = async (e) => {
    e.preventDefault()
    const cleanTitle = taskDraft.title.trim()
    if (cleanTitle.length < 2) {
      setError('Task title must be at least 2 characters.')
      return
    }

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    setCreatingTask(true)
    setError('')

    if (!session.token) {
      const newTask = {
        id: `t-${Date.now()}`,
        title: cleanTitle,
        description: taskDraft.description.trim(),
        assignee_name: teamMembers.find((m) => m.user_id === taskDraft.assignedTo)?.name || 'Unassigned',
        due_date: taskDraft.dueDate || null,
        status: 'todo',
      }
      setTasks([newTask, ...tasks])
      setTaskDraft({ title: '', description: '', assignedTo: '', dueDate: '' })
      setShowTaskModal(false)
      setCreatingTask(false)
      return
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          title: cleanTitle,
          description: taskDraft.description.trim(),
          assignedTo: taskDraft.assignedTo || null,
          dueDate: taskDraft.dueDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not create task.')

      setNotice(`Task “${cleanTitle}” created.`)
      setTaskDraft({ title: '', description: '', assignedTo: '', dueDate: '' })
      setShowTaskModal(false)
      fetchWorkspace()
    } catch (err) {
      setError(err.message || 'Failed to create task.')
    } finally {
      setCreatingTask(false)
    }
  }

  // 5. Post announcement
  const handlePostAnnouncement = async () => {
    const cleanMsg = newAnnouncement.trim()
    if (cleanMsg.length < 2) return

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    setPostingAnnouncement(true)
    setError('')

    if (!session.token) {
      const newEntry = {
        id: `a-${Date.now()}`,
        author_name: user?.name || 'Aarav Mehta',
        message: cleanMsg,
        created_at: new Date().toISOString(),
      }
      setAnnouncements([newEntry, ...announcements])
      setNewAnnouncement('')
      setPostingAnnouncement(false)
      return
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ message: cleanMsg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not post announcement.')

      setNewAnnouncement('')
      fetchWorkspace()
    } catch (err) {
      setError(err.message || 'Failed to post announcement.')
    } finally {
      setPostingAnnouncement(false)
    }
  }

  // 6. Add resource link
  const handleAddResource = async (e) => {
    e.preventDefault()
    const cleanLabel = resourceDraft.label.trim()
    const cleanUrl = resourceDraft.url.trim()

    if (cleanLabel.length < 2 || !/^https:\/\/.+/i.test(cleanUrl)) {
      setError('Please provide a descriptive label and a secure https:// link.')
      return
    }

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    setAddingResource(true)
    setError('')

    if (!session.token) {
      setResources([{ id: `r-${Date.now()}`, label: cleanLabel, url: cleanUrl }, ...resources])
      setResourceDraft({ label: '', url: '' })
      setShowResourceModal(false)
      setAddingResource(false)
      return
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ label: cleanLabel, url: cleanUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not add resource.')

      setResourceDraft({ label: '', url: '' })
      setShowResourceModal(false)
      fetchWorkspace()
    } catch (err) {
      setError(err.message || 'Failed to add resource.')
    } finally {
      setAddingResource(false)
    }
  }

  // 7. Add milestone (Owner only)
  const handleAddMilestone = async (e) => {
    e.preventDefault()
    const cleanTitle = milestoneDraft.title.trim()
    if (cleanTitle.length < 2) {
      setError('Milestone title must be at least 2 characters.')
      return
    }

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    setAddingMilestone(true)
    setError('')

    if (!session.token) {
      setMilestones([{ id: `m-${Date.now()}`, title: cleanTitle, due_date: milestoneDraft.dueDate || null }, ...milestones])
      setMilestoneDraft({ title: '', dueDate: '' })
      setShowMilestoneModal(false)
      setAddingMilestone(false)
      return
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ title: cleanTitle, dueDate: milestoneDraft.dueDate || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not create milestone.')

      setMilestoneDraft({ title: '', dueDate: '' })
      setShowMilestoneModal(false)
      fetchWorkspace()
    } catch (err) {
      setError(err.message || 'Failed to create milestone.')
    } finally {
      setAddingMilestone(false)
    }
  }

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length
  const nextMilestone = milestones.length > 0 ? milestones[0] : null

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Private team workspace</p>
          <h1>Turn the next step into <em>shared progress.</em></h1>
          <p>
            Keep tasks, project context, and the small decisions that matter{' '}
            <span className="highlight">in one calm place.</span>
          </p>
        </div>
        <div className="page-actions">
          {selectedProjectId && (
            <button
              className="outline-button"
              onClick={() => onNavigateTeam && onNavigateTeam(selectedProjectId)}
            >
              Manage team
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
            <span>Workspace:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="recruitment-project-select"
            >
              {userTeams.length === 0 && <option value="">No team workspaces available</option>}
              {userTeams.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.6rem' }}>
            {selectedProjectId && (
              <button
                type="button"
                className="outline-button"
                onClick={() => setShowTaskModal(true)}
              >
                + Add task
              </button>
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

      {activeProject && (
        <div className="workspace-stats">
          <div>
            <span>{activeProject.title}</span>
            <strong>{teamMembers.length || activeProject.member_count || 1} teammates</strong>
          </div>
          <div>
            <span>Task progress</span>
            <strong>
              {completedTasksCount}/{tasks.length} complete
            </strong>
          </div>
          <div>
            <span>Next milestone</span>
            <strong>
              {nextMilestone
                ? `${nextMilestone.title}${nextMilestone.due_date ? `, ${new Date(`${nextMilestone.due_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}`
                : 'No milestones set'}
            </strong>
          </div>
        </div>
      )}

      {loading && (
        <p className="small-copy" style={{ margin: '2rem 0', textAlign: 'center', color: '#999' }}>
          Loading team workspace...
        </p>
      )}

      {!loading && selectedProjectId && (
        <>
          {/* Kanban Board */}
          <div className="kanban">
            {[
              ['todo', 'To do'],
              ['in_progress', 'In progress'],
              ['completed', 'Completed'],
            ].map(([status, label]) => {
              const columnTasks = tasks.filter((t) => t.status === status)
              return (
                <section key={status} className="task-column">
                  <div className="task-column-head">
                    <h2>{label}</h2>
                    <span>{columnTasks.length}</span>
                  </div>

                  {columnTasks.map((task) => (
                    <article className="task-card" key={task.id}>
                      <h3>{task.title}</h3>
                      {task.description && (
                        <p style={{ margin: '0.4rem 0 0', color: '#9c9c9c', fontSize: '0.7rem' }}>
                          {task.description}
                        </p>
                      )}
                      <p>
                        {task.assignee_name || 'Unassigned'}
                        {task.due_date && (
                          <> · Due {new Date(`${task.due_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</>
                        )}
                      </p>
                      <div className="task-move">
                        {status !== 'todo' && (
                          <button
                            type="button"
                            title="Move back"
                            onClick={() =>
                              moveTaskStatus(
                                task.id,
                                status === 'completed' ? 'in_progress' : 'todo'
                              )
                            }
                          >
                            ←
                          </button>
                        )}
                        {status !== 'completed' && (
                          <button
                            type="button"
                            title="Advance status"
                            onClick={() =>
                              moveTaskStatus(
                                task.id,
                                status === 'todo' ? 'in_progress' : 'completed'
                              )
                            }
                          >
                            →
                          </button>
                        )}
                      </div>
                    </article>
                  ))}

                  {!columnTasks.length && <p className="empty-task">Nothing here yet.</p>}
                </section>
              )
            })}
          </div>

          {/* Lower Workspace: Announcements & Shared Resources */}
          <div className="workspace-lower">
            {/* Announcements Panel */}
            <section className="workspace-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Announcements</p>
                  <h2>Keep everyone aligned.</h2>
                </div>
              </div>
              <div className="announcement-compose">
                <textarea
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Share an update or note with your team"
                />
                <button
                  type="button"
                  disabled={postingAnnouncement || newAnnouncement.trim().length < 2}
                  onClick={handlePostAnnouncement}
                >
                  {postingAnnouncement ? 'Posting...' : <>Post <Arrow /></>}
                </button>
              </div>

              {announcements.map((item) => (
                <article className="announcement" key={item.id}>
                  <strong>{item.author_name || 'Teammate'}</strong>
                  <p>{item.message}</p>
                </article>
              ))}

              {!announcements.length && (
                <p className="small-copy" style={{ marginTop: '1rem', color: '#777' }}>
                  No announcements yet. Post the first update above to welcome your teammates.
                </p>
              )}
            </section>

            {/* Resources & Milestones Panel */}
            <aside className="workspace-panel resources-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="eyebrow">Shared resources</p>
                  <h2>Links your team uses.</h2>
                </div>
                <button
                  type="button"
                  className="outline-button"
                  style={{ minHeight: 'auto', padding: '0.28rem 0.55rem', fontSize: '0.68rem' }}
                  onClick={() => setShowResourceModal(true)}
                >
                  + Add link
                </button>
              </div>

              {resources.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                  <span>{link.label}</span>
                  <Arrow />
                </a>
              ))}

              {!resources.length && (
                <p className="small-copy" style={{ color: '#777', margin: '0.4rem 0' }}>
                  No shared resources yet. Add Figma, GitHub, or doc links.
                </p>
              )}

              {/* Milestones Section */}
              <div style={{ marginTop: '1.4rem', borderTop: '1px solid rgba(255, 239, 210, 0.1)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <p className="eyebrow" style={{ margin: 0 }}>Project milestones</p>
                  {isOwner && (
                    <button
                      type="button"
                      className="outline-button"
                      style={{ minHeight: 'auto', padding: '0.24rem 0.48rem', fontSize: '0.65rem' }}
                      onClick={() => setShowMilestoneModal(true)}
                    >
                      + Milestone
                    </button>
                  )}
                </div>

                {milestones.map((m) => (
                  <div className="milestone" key={m.id} style={{ marginBottom: '0.8rem' }}>
                    <strong>{m.title}</strong>
                    {m.due_date && (
                      <p>Due {new Date(`${m.due_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    )}
                  </div>
                ))}

                {!milestones.length && (
                  <p className="small-copy" style={{ color: '#777', marginTop: '0.4rem' }}>
                    {isOwner ? 'Define your first project milestone above.' : 'No milestones scheduled yet.'}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </>
      )}

      {!loading && !userTeams.length && (
        <div className="empty-state">
          <h2>No private workspaces available.</h2>
          <p>Private workspaces are reserved for confirmed team members. Create a project or apply to campus teams to join.</p>
          <button className="primary-button" onClick={onDiscover}>
            Discover opportunities <Arrow />
          </button>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="apply-drawer" role="dialog" aria-modal="true" aria-label="Create new task">
          <div>
            <button className="drawer-close" onClick={() => setShowTaskModal(false)}>×</button>
            <p className="eyebrow">Task assignment</p>
            <h2>Add a team task.</h2>
            <p className="drawer-lead">Outline what needs to be accomplished and who will take ownership.</p>

            <form onSubmit={handleCreateTask}>
              <label className="field">
                <span>Task title</span>
                <input
                  value={taskDraft.title}
                  onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })}
                  placeholder="e.g. Map the transit routes"
                  required
                />
              </label>

              <label className="field">
                <span>Task notes (optional)</span>
                <textarea
                  value={taskDraft.description}
                  onChange={(e) => setTaskDraft({ ...taskDraft, description: e.target.value })}
                  placeholder="Additional context or expectations for this work."
                  style={{ minHeight: '4.5rem' }}
                />
              </label>

              <div className="two-fields">
                <label className="field">
                  <span>Assign to</span>
                  <select
                    value={taskDraft.assignedTo}
                    onChange={(e) => setTaskDraft({ ...taskDraft, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.user_id || m.id} value={m.user_id || m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Due date</span>
                  <input
                    type="date"
                    value={taskDraft.dueDate}
                    onChange={(e) => setTaskDraft({ ...taskDraft, dueDate: e.target.value })}
                  />
                </label>
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={creatingTask || !taskDraft.title.trim()}
                style={{ marginTop: '1.2rem' }}
              >
                {creatingTask ? 'Adding task...' : <>Create task <Arrow /></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showResourceModal && (
        <div className="apply-drawer" role="dialog" aria-modal="true" aria-label="Add shared link">
          <div>
            <button className="drawer-close" onClick={() => setShowResourceModal(false)}>×</button>
            <p className="eyebrow">Shared resources</p>
            <h2>Add a team link.</h2>
            <p className="drawer-lead">Add a link to code, designs, or research notes your team frequently accesses.</p>

            <form onSubmit={handleAddResource}>
              <label className="field">
                <span>Resource label</span>
                <input
                  value={resourceDraft.label}
                  onChange={(e) => setResourceDraft({ ...resourceDraft, label: e.target.value })}
                  placeholder="e.g. Figma prototype"
                  required
                />
              </label>

              <label className="field">
                <span>Secure URL (https://)</span>
                <input
                  type="url"
                  value={resourceDraft.url}
                  onChange={(e) => setResourceDraft({ ...resourceDraft, url: e.target.value })}
                  placeholder="https://www.figma.com/..."
                  required
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={addingResource || !resourceDraft.label.trim() || !resourceDraft.url.trim()}
                style={{ marginTop: '1.2rem' }}
              >
                {addingResource ? 'Adding link...' : <>Save resource <Arrow /></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div className="apply-drawer" role="dialog" aria-modal="true" aria-label="Add project milestone">
          <div>
            <button className="drawer-close" onClick={() => setShowMilestoneModal(false)}>×</button>
            <p className="eyebrow">Project milestone</p>
            <h2>Schedule a key milestone.</h2>
            <p className="drawer-lead">Set an orienting target date for your team's upcoming deliverable.</p>

            <form onSubmit={handleAddMilestone}>
              <label className="field">
                <span>Milestone title</span>
                <input
                  value={milestoneDraft.title}
                  onChange={(e) => setMilestoneDraft({ ...milestoneDraft, title: e.target.value })}
                  placeholder="e.g. End-to-end alpha demo"
                  required
                />
              </label>

              <label className="field">
                <span>Target completion date</span>
                <input
                  type="date"
                  value={milestoneDraft.dueDate}
                  onChange={(e) => setMilestoneDraft({ ...milestoneDraft, dueDate: e.target.value })}
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={addingMilestone || !milestoneDraft.title.trim()}
                style={{ marginTop: '1.2rem' }}
              >
                {addingMilestone ? 'Scheduling...' : <>Set milestone <Arrow /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
