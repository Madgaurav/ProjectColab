import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storePath = path.join(__dirname, 'data', 'store.json')
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'))

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set in backend/.env')
  process.exit(1)
}

async function migrate() {
  console.log('Connecting to MongoDB Atlas at:', MONGODB_URI.replace(/:[^:]*@/, ':****@'))
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB Atlas successfully!')

  const db = mongoose.connection.db

  const collectionsMap = {
    colleges: store.colleges || [],
    users: store.users || [],
    skills: store.skills || [],
    user_skills: store.user_skills || [],
    user_interests: store.user_interests || [],
    projects: store.projects || [],
    project_roles: store.project_roles || [],
    project_skills: store.project_skills || [],
    team_members: store.team_members || [],
    bookmarks: store.bookmarks || [],
    applications: store.applications || [],
    tasks: store.tasks || [],
    announcements: store.announcements || [],
    project_resources: store.project_resources || [],
    milestones: store.milestones || [],
    notifications: store.notifications || []
  }

  for (const [colName, docs] of Object.entries(collectionsMap)) {
    if (!docs.length) continue

    const collection = db.collection(colName)
    // Clear previous migration if any
    await collection.deleteMany({})

    // Map each doc to have _id equal to doc.id (or generated if none)
    const formattedDocs = docs.map(doc => {
      const copy = { ...doc }
      if (copy.id) {
        copy._id = copy.id
      }
      return copy
    })

    const result = await collection.insertMany(formattedDocs)
    console.log(`✓ Collection [${colName}]: migrated ${result.insertedCount} documents`)
  }

  console.log('\nAll data successfully migrated to MongoDB Atlas database [projectcollab]!')
  await mongoose.disconnect()
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
