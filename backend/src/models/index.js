import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  _id: { type: String },
  id: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  account_status: { type: String, enum: ['active', 'pending_verification', 'suspended'], default: 'active' },
  college_id: { type: String },
  department: { type: String, default: '' },
  academic_year: { type: Number, default: null },
  bio: { type: String, default: '' },
  profile_picture_url: { type: String, default: '' },
  github_url: { type: String, default: '' },
  portfolio_url: { type: String, default: '' },
  availability: { type: String, default: 'open' },
  preferred_categories: [{ type: String }],
  verification_token_hash: { type: String, default: null },
  verification_expires_at: { type: Date, default: null },
  reset_token_hash: { type: String, default: null },
  reset_expires_at: { type: Date, default: null }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

const ProjectRoleSchema = new mongoose.Schema({
  _id: { type: String },
  id: { type: String },
  project_id: { type: String, required: true },
  role_name: { type: String, required: true },
  description: { type: String, default: '' },
  positions_available: { type: Number, default: 1 }
})

const ProjectSkillSchema = new mongoose.Schema({
  project_id: { type: String, required: true },
  skill_id: { type: String, required: true },
  required_level: { type: String, default: 'intermediate' }
})

const ProjectSchema = new mongoose.Schema({
  _id: { type: String },
  id: { type: String },
  college_id: { type: String },
  owner_id: { type: String, required: true },
  title: { type: String, required: true },
  short_description: { type: String, required: true },
  description: { type: String, required: true },
  problem_statement: { type: String },
  proposed_solution: { type: String },
  technology_stack: [{ type: String }],
  category: { type: String, required: true },
  project_type: { type: String, required: true },
  team_size: { type: Number, default: 4 },
  recruitment_deadline: { type: String },
  duration_weeks: { type: Number, default: 8 },
  status: { type: String, enum: ['recruiting', 'recruitment_closed', 'in_progress', 'completed', 'archived'], default: 'recruiting' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

const ApplicationSchema = new mongoose.Schema({
  _id: { type: String },
  id: { type: String },
  project_id: { type: String, required: true },
  applicant_id: { type: String, required: true },
  project_role_id: { type: String, required: true },
  introduction_message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

const TaskSchema = new mongoose.Schema({
  _id: { type: String },
  id: { type: String },
  project_id: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, default: null },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['todo', 'in_progress', 'completed'], default: 'todo' },
  due_date: { type: String, default: null }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

const AnnouncementSchema = new mongoose.Schema({
  _id: { type: String },
  id: { type: String },
  project_id: { type: String, required: true },
  author_id: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: { createdAt: 'created_at' } })

const ResourceSchema = new mongoose.Schema({
  _id: { type: String },
  id: { type: String },
  project_id: { type: String, required: true },
  added_by: { type: String, required: true },
  label: { type: String, required: true },
  url: { type: String, required: true }
}, { timestamps: { createdAt: 'created_at' } })

const MilestoneSchema = new mongoose.Schema({
  _id: { type: String },
  id: { type: String },
  project_id: { type: String, required: true },
  title: { type: String, required: true },
  due_date: { type: String }
}, { timestamps: { createdAt: 'created_at' } })

const NotificationSchema = new mongoose.Schema({
  _id: { type: String },
  id: { type: String },
  user_id: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  notification_type: { type: String, required: true },
  related_project_id: { type: String, default: null },
  is_read: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at' } })

export const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users')
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema, 'projects')
export const ProjectRole = mongoose.models.ProjectRole || mongoose.model('ProjectRole', ProjectRoleSchema, 'project_roles')
export const ProjectSkill = mongoose.models.ProjectSkill || mongoose.model('ProjectSkill', ProjectSkillSchema, 'project_skills')
export const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema, 'applications')
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema, 'tasks')
export const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema, 'announcements')
export const Resource = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema, 'project_resources')
export const Milestone = mongoose.models.Milestone || mongoose.model('Milestone', MilestoneSchema, 'milestones')
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema, 'notifications')
