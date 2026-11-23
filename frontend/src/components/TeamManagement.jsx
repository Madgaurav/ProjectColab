import { useEffect, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

const fallbackProjects = [
  { id: 'p1', title: 'Campus shuttle tracker', team_size: 4, member_count: 3, status: 'recruiting', role: 'Project owner' },
  { id: 'p2', title: 'Study group matcher', team_size: 5, member_count: 2, status: 'recruiting', role: 'Team member' },
]

const fallbackTeam = [
  { id: 'm1', user_id: 'u1', name: 'Aarav Mehta', role: 'Project owner', department: 'Computer science', academic_year: 3, joined_at: '2026-10-01' },
  { id: 'm2', user_id: 'u2', name: 'Nia Shah', role: 'Mobile developer', department: 'Information technology', academic_year: 4, joined_at: '2026-10-05' },
  { id: 'm3', user_id: 'u3', name: 'Ishita Verma', role: 'Frontend developer', department: 'Computer science', academic_year: 3, joined_at: '2026-10-12' },
]

export function TeamManagement({
  user,
  initialProjectId,
  onDiscover,
  onNavigateRecruitment,
  onNavigateWorkspace,
}) {
  const [userTeams, setUserTeams] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '')
  const [projectData, setProjectData] = useState(null)
  const [members, setMembers] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Modals & confirmation dialogs
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedNextOwnerId, setSelectedNextOwnerId] = useState('')
  const [busyAction, setBusyAction] = useState(false)

  // 1. Fetch all projects current user belongs to
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) {
      setUserTeams(fallbackProjects)
      if (!selectedProjectId) setSelectedProjectId(fallbackProjects[0].id)
      return
    }

    setLoadingTeams(true)
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
      .finally(() => setLoadingTeams(false))
  }, [user])

  // 2. Fetch team members for the selected project
  const fetchTeamMembers = () => {
    if (!selectedProjectId) {
      setMembers([])
      setProjectData(null)
      return
    }

    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    if (!session.token) {
      setMembers(fallbackTeam)
      setProjectData(fallbackProjects.find((p) => p.id === selectedProjectId) || fallbackProjects[0])
      return
    }

    setLoadingMembers(true)
    setError('')
    fetch(`/api/projects/${selectedProjectId}/team`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || 'Could not fetch team.')
        }
        return res.json()
      })
      .then((data) => {
        if (data?.project) setProjectData(data.project)
        if (data?.members) setMembers(data.members)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load team members.')
      })
      .finally(() => setLoadingMembers(false))
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [selectedProjectId])

  const isOwner = Boolean(
    projectData && (projectData.owner_id === user?.id || user?.id === 'preview-user')
  )

  // 3. Remove Member (Owner action)
  const handleRemoveMember = async () => {
    if (!memberToRemove) return
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    setBusyAction(true)
    setError('')
    setNotice('')

    if (!session.token) {
      setMembers(members.filter((m) => m.id !== memberToRemove.id))
      setNotice(`Team member ${memberToRemove.name} removed.`)
      setMemberToRemove(null)
      setBusyAction(false)
      return
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/team/${memberToRemove.user_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to remove member.')

      setNotice(data.message || `Removed ${memberToRemove.name} from the team.`)
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id))
      setMemberToRemove(null)
    } catch (err) {
      setError(err.message || 'Could not remove team member.')
    } finally {
      setBusyAction(false)
    }
  }

  // 4. Leave Team (Non-owner member action)
  const handleLeaveTeam = async () => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    setBusyAction(true)
    setError('')

    if (!session.token) {
      setShowLeaveConfirm(false)
      setNotice('You have left the team.')
      setBusyAction(false)
      onDiscover()
      return
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/team/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to leave team.')

      setShowLeaveConfirm(false)
      onDiscover()
    } catch (err) {
      setError(err.message || 'Could not leave team.')
    } finally {
      setBusyAction(false)
    }
  }

  // 5. Transfer Ownership
  const handleTransferOwnership = async () => {
    if (!selectedNextOwnerId) return
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    setBusyAction(true)
    setError('')
    setNotice('')

    if (!session.token) {
      const nextOwner = members.find((m) => m.user_id === selectedNextOwnerId || m.id === selectedNextOwnerId)
      setNotice(`Project ownership transferred to ${nextOwner?.name || 'new owner'}.`)
      setShowTransferModal(false)
      setBusyAction(false)
      return
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/owner`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ userId: selectedNextOwnerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to transfer ownership.')

      setNotice(data.message || 'Project ownership transferred successfully.')
      setShowTransferModal(false)
      fetchTeamMembers()
    } catch (err) {
      setError(err.message || 'Could not transfer ownership.')
    } finally {
      setBusyAction(false)
    }
  }

  // 6. Archive Project
  const handleArchiveProject = async () => {
    const session = JSON.parse(localStorage.getItem('projectcollab-session') || '{}')
    setBusyAction(true)
    setError('')

    if (!session.token) {
      setNotice('Project archived.')
      setShowArchiveConfirm(false)
      setBusyAction(false)
      return
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Could not archive project.')
      }

      setShowArchiveConfirm(false)
      setNotice('Project archived. Recruitment closed and hidden from discovery.')
      setUserTeams((prev) => prev.filter((p) => p.id !== selectedProjectId))
      if (userTeams.length > 1) {
        const nextP = userTeams.find((p) => p.id !== selectedProjectId)
        setSelectedProjectId(nextP?.id || '')
      } else {
        setSelectedProjectId('')
      }
    } catch (err) {
      setError(err.message || 'Failed to archive project.')
    } finally {
      setBusyAction(false)
    }
  }

  const teamCapacity = projectData?.team_size || 4
  const openPositionsCount = Math.max(0, teamCapacity - members.length)

  return (
    <section className="team-page">
      <div className="discover-heading">
        <div>
          <p className="eyebrow">Team management</p>
          <h1>Keep the team <em>moving together.</em></h1>
          <p>
            Make responsibilities clear, keep capacity visible, and give each collaborator a{' '}
            <span className="highlight">defined place in the work.</span>
          </p>
        </div>
        <div className="page-actions">
          {selectedProjectId && (
            <button
              className="outline-button"
              onClick={() => onNavigateWorkspace && onNavigateWorkspace(selectedProjectId)}
            >
              Open workspace
            </button>
          )}
          <button className="outline-button" onClick={onDiscover}>
            Discover projects
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="saved-toolbar" style={{ marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', flexWrap: 'wrap' }}>
          <label className="recruitment-project-label">
            <span>Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="recruitment-project-select"
            >
              {userTeams.length === 0 && <option value="">No project teams found</option>}
              {userTeams.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.role || 'Member'})
                </option>
              ))}
            </select>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.6rem' }}>
            {isOwner && (
              <button
                type="button"
                className="outline-button"
                onClick={() => onNavigateRecruitment && onNavigateRecruitment(selectedProjectId)}
              >
                Review applicants <Arrow />
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

      {projectData && (
        <div className="team-overview">
          <div>
            <span>Project</span>
            <strong>{projectData.title}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong style={{ textTransform: 'capitalize' }}>
              {(projectData.status || 'recruiting').replace('_', ' ')}
            </strong>
          </div>
          <div>
            <span>Team capacity</span>
            <strong>{members.length} of {teamCapacity} members</strong>
          </div>
          <div>
            <span>Open positions</span>
            <strong>{openPositionsCount} remaining</strong>
          </div>
        </div>
      )}

      {loadingMembers && (
        <p className="small-copy" style={{ margin: '2rem 0', textAlign: 'center', color: '#999' }}>
          Loading team roster...
        </p>
      )}

      {!loadingMembers && selectedProjectId && (
        <div className="team-layout">
          <aside className="team-sidebar">
            <p className="eyebrow">{isOwner ? 'Owner controls' : 'Member controls'}</p>
            <h2>{isOwner ? 'Manage your collaborators.' : 'Your team membership.'}</h2>
            <p>
              {isOwner
                ? 'Removing a team member concludes their project access. Transfer ownership before leaving your project.'
                : 'You have full access to private workspace tasks, announcements, and team resources.'}
            </p>

            {isOwner ? (
              <div style={{ display: 'grid', gap: '0.6rem', marginTop: '1.2rem' }}>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setShowTransferModal(true)}
                  disabled={members.filter((m) => m.role !== 'Project owner').length === 0}
                >
                  Transfer ownership
                </button>
                <button
                  type="button"
                  className="archive-trigger-btn"
                  onClick={() => setShowArchiveConfirm(true)}
                >
                  Archive project
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '1.2rem' }}>
                <button
                  type="button"
                  className="archive-trigger-btn"
                  onClick={() => setShowLeaveConfirm(true)}
                >
                  Leave project
                </button>
              </div>
            )}
          </aside>

          <div className="member-list">
            {members.map((member) => {
              const initials = member.name
                ? member.name.split(' ').map((p) => p[0]).slice(0, 2).join('')
                : 'TM'
              const isMemberOwner = member.role === 'Project owner' || member.user_id === projectData?.owner_id

              return (
                <article className="member-card" key={member.id || member.user_id}>
                  <div className="member-avatar">{initials}</div>
                  <div className="member-details">
                    <div>
                      <h2>{member.name}</h2>
                      <p>
                        {member.department || 'Verified student'}
                        {member.academic_year ? ` · Year ${member.academic_year}` : ''}
                      </p>
                    </div>
                    <span className={isMemberOwner ? 'owner-role' : 'member-role'}>
                      {member.role || 'Team member'}
                    </span>
                  </div>

                  {isOwner && !isMemberOwner && (
                    <button
                      type="button"
                      className="remove-member"
                      onClick={() => setMemberToRemove(member)}
                    >
                      Remove member
                    </button>
                  )}
                </article>
              )
            })}

            {openPositionsCount > 0 && (
              <div className="capacity-card">
                <span>{openPositionsCount} place{openPositionsCount === 1 ? '' : 's'} open</span>
                <p>
                  {isOwner
                    ? 'Review incoming applications to fill the remaining roles.'
                    : 'Invite students to apply through active roles in Discover.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!loadingMembers && !userTeams.length && (
        <div className="empty-state">
          <h2>You are not on any teams yet.</h2>
          <p>Create a project or apply to active campus opportunities to join a team.</p>
          <button className="primary-button" onClick={onDiscover}>
            Discover opportunities <Arrow />
          </button>
        </div>
      )}

      {/* Transfer Ownership Drawer */}
      {showTransferModal && (
        <div className="apply-drawer" role="dialog" aria-modal="true" aria-label="Transfer ownership">
          <div>
            <button className="drawer-close" onClick={() => setShowTransferModal(false)}>×</button>
            <p className="eyebrow">Transfer project ownership</p>
            <h2>Choose the next owner.</h2>
            <p className="drawer-lead">
              The chosen member will gain control over recruitment, membership, and project settings.
              You will remain on the team as a member.
            </p>
            <label className="field">
              <span>Next owner</span>
              <select
                value={selectedNextOwnerId}
                onChange={(e) => setSelectedNextOwnerId(e.target.value)}
              >
                <option value="">Select a member</option>
                {members
                  .filter((m) => m.role !== 'Project owner' && m.user_id !== user?.id)
                  .map((m) => (
                    <option key={m.id || m.user_id} value={m.user_id || m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="primary-button"
              disabled={!selectedNextOwnerId || busyAction}
              onClick={handleTransferOwnership}
              style={{ marginTop: '1.2rem' }}
            >
              {busyAction ? 'Transferring...' : <>Transfer ownership <Arrow /></>}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        title="Remove team member?"
        message={`Are you sure you want to remove ${memberToRemove?.name} from this project? Their access to private workspace tasks and discussions will end.`}
        confirmLabel="Remove member"
        cancelLabel="Keep member"
        isDestructive={true}
        onConfirm={handleRemoveMember}
        onCancel={() => setMemberToRemove(null)}
        busy={busyAction}
      />

      <ConfirmDialog
        isOpen={showLeaveConfirm}
        title="Leave this project team?"
        message="Are you sure you want to leave this project team? You will lose access to team workspaces, tasks, and announcements."
        confirmLabel="Leave team"
        cancelLabel="Stay on team"
        isDestructive={true}
        onConfirm={handleLeaveTeam}
        onCancel={() => setShowLeaveConfirm(false)}
        busy={busyAction}
      />

      <ConfirmDialog
        isOpen={showArchiveConfirm}
        title="Archive this project?"
        message="Archiving this project will close recruitment and hide it from campus discovery. Existing collaborators will retain reference access."
        confirmLabel="Archive project"
        cancelLabel="Keep active"
        isDestructive={true}
        onConfirm={handleArchiveProject}
        onCancel={() => setShowArchiveConfirm(false)}
        busy={busyAction}
      />
    </section>
  )
}
