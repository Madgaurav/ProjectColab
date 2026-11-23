export function Navigation({
  currentWorkspace,
  onNavigate,
  unreadCount = 0,
  savedCount = 0,
  theme = 'dark',
  onToggleTheme,
}) {
  const navItems = [
    { id: 'discover', label: 'Discover' },
    { id: 'saved', label: 'Saved', badge: savedCount > 0 ? savedCount : null },
    { id: 'projects', label: 'Create Project' },
    { id: 'recruitment', label: 'Recruitment' },
    { id: 'team', label: 'Team' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'notifications', label: 'Notifications', badge: unreadCount > 0 ? unreadCount : null, highlight: unreadCount > 0 },
    { id: 'profile', label: 'Profile' },
  ]

  return (
    <nav className="main-nav-bar" aria-label="Main navigation">
      <div className="nav-items-scroll">
        {navItems.map((item) => {
          const isActive = currentWorkspace === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-tab-button ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{item.label}</span>
              {item.badge != null && (
                <span className={`nav-badge ${item.highlight ? 'badge-alert' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {onToggleTheme && (
        <button
          type="button"
          className="nav-theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    </nav>
  )
}
