import test, { describe } from 'node:test'
import assert from 'node:assert/strict'

describe('Frontend Form Validation & UI Logic', () => {
  // Test search & category filtering logic used in DiscoverWorkspace
  const filterProjects = (projects, search, category) => {
    return projects.filter((project) => {
      const matchSearch =
        !search ||
        `${project.title} ${project.short_description}`
          .toLowerCase()
          .includes(search.toLowerCase())
      const matchCat = !category || project.category === category
      return matchSearch && matchCat
    })
  }

  const sampleProjects = [
    { id: '1', title: 'Campus shuttle tracker', short_description: 'Bus arrival updates', category: 'Mobile apps' },
    { id: '2', title: 'Study group matcher', short_description: 'Connect with peers', category: 'Web development' },
    { id: '3', title: 'Energy consumption tracker', short_description: 'Campus sustainability data', category: 'Data science' },
  ]

  test('filters projects by search term across title and description', () => {
    const results = filterProjects(sampleProjects, 'shuttle', '')
    assert.equal(results.length, 1)
    assert.equal(results[0].id, '1')

    const descResults = filterProjects(sampleProjects, 'sustainability', '')
    assert.equal(descResults.length, 1)
    assert.equal(descResults[0].id, '3')
  })

  test('filters projects by selected category', () => {
    const results = filterProjects(sampleProjects, '', 'Web development')
    assert.equal(results.length, 1)
    assert.equal(results[0].id, '2')
  })

  test('handles combined search query and category filter', () => {
    const results = filterProjects(sampleProjects, 'tracker', 'Mobile apps')
    assert.equal(results.length, 1)
    assert.equal(results[0].id, '1')

    const noMatches = filterProjects(sampleProjects, 'peer', 'Robotics')
    assert.equal(noMatches.length, 0)
  })

  test('validates application pitch rules (20 to 1,500 characters)', () => {
    const validatePitch = (pitch) => {
      const trimmed = (pitch || '').trim()
      if (trimmed.length < 20) return 'Please write at least 20 characters introducing your contribution.'
      if (trimmed.length > 1500) return 'Please keep your introduction within 1,500 characters.'
      return null
    }

    assert.match(validatePitch('Hello!'), /at least 20 characters/)
    assert.equal(validatePitch('I have extensive frontend React experience and want to build the design system.'), null)
    assert.match(validatePitch('x'.repeat(1501)), /within 1,500 characters/)
  })

  test('manages bookmark Set additions and removals', () => {
    const bookmarks = new Set(['proj-1', 'proj-2'])

    const toggle = (set, id) => {
      const next = new Set(set)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    }

    const removed = toggle(bookmarks, 'proj-1')
    assert.equal(removed.has('proj-1'), false)
    assert.equal(removed.has('proj-2'), true)
    assert.equal(removed.size, 1)

    const added = toggle(removed, 'proj-3')
    assert.equal(added.has('proj-3'), true)
    assert.equal(added.size, 2)
  })
})
