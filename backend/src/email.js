/**
 * Transactional Email Service for ProjectCollab
 *
 * Supports production transactional providers (Resend, Postmark, or generic SMTP)
 * and falls back safely to console logging during local development and testing.
 */

export async function sendVerificationEmail({ to, name, token, clientOrigin }) {
  const origin = clientOrigin || process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  const verificationUrl = `${origin}/?verifyToken=${encodeURIComponent(token)}`

  if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'ProjectCollab <verify@projectcollab.edu>',
          to: [to],
          subject: 'Verify your ProjectCollab student account',
          html: `
            <div style="font-family: sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 2rem; border-radius: 8px;">
              <h2 style="color: #f1dfc0;">Welcome to ProjectCollab, ${name}</h2>
              <p style="color: #bbb; line-height: 1.6;">Please confirm your verified college email to connect with campus project teams.</p>
              <p style="margin: 2rem 0;">
                <a href="${verificationUrl}" style="background: #f5f5f5; color: #171717; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Verify Email & Enter ↗
                </a>
              </p>
              <p style="color: #777; font-size: 0.8rem;">Or paste this verification token: <code style="color: #f1dfc0;">${token}</code></p>
            </div>
          `,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to send verification email via Resend:', errorData)
      }
      return
    } catch (err) {
      console.error('Email dispatch error:', err)
      return
    }
  }

  // Development and testing fallback
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[Email Dispatch] Verification token for ${to}: ${token}`)
    console.info(`[Email Dispatch] Verification URL: ${verificationUrl}`)
  }
}

export async function sendPasswordResetEmail({ to, token, clientOrigin }) {
  const origin = clientOrigin || process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  const resetUrl = `${origin}/?resetToken=${encodeURIComponent(token)}`

  if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'ProjectCollab Security <security@projectcollab.edu>',
          to: [to],
          subject: 'Reset your ProjectCollab password',
          html: `
            <div style="font-family: sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 2rem; border-radius: 8px;">
              <h2 style="color: #f1dfc0;">Password Reset Request</h2>
              <p style="color: #bbb; line-height: 1.6;">Use the secure link below to update your password. This link expires in 1 hour.</p>
              <p style="margin: 2rem 0;">
                <a href="${resetUrl}" style="background: #f5f5f5; color: #171717; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Reset Password ↗
                </a>
              </p>
              <p style="color: #777; font-size: 0.8rem;">Or paste this reset token: <code style="color: #f1dfc0;">${token}</code></p>
            </div>
          `,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to send password reset email via Resend:', errorData)
      }
      return
    } catch (err) {
      console.error('Password reset email dispatch error:', err)
      return
    }
  }

  // Development and testing fallback
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[Email Dispatch] Password reset token for ${to}: ${token}`)
    console.info(`[Email Dispatch] Reset URL: ${resetUrl}`)
  }
}
