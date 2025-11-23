/**
 * Email utility for sending transactional emails
 * Uses Resend API for sending emails
 */

import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
// IMPORTANTE: Usa un indirizzo email dal dominio verificato su Resend (es. nomadiqe.com)
// Non serve creare un account email reale su Namecheap!
// L'indirizzo email qui è solo per mostrare come mittente nelle email.
// Resend usa il dominio verificato per inviare, non l'account email reale.
// Il dominio deve essere verificato su Resend (DKIM, SPF, MX records configurati)
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@nomadiqe.com'
const APP_NAME = 'Nomadiqe'
const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Initialize Resend client (only if API key is provided)
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

// Log configuration at startup (only once)
if (typeof window === 'undefined') {
  // Server-side only
  console.log('[EMAIL] Email configuration:', {
    hasApiKey: !!RESEND_API_KEY,
    fromEmail: FROM_EMAIL,
    nodeEnv: process.env.NODE_ENV
  })
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] ⚠️ RESEND_API_KEY not configured - emails will be logged to console only')
  }
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email using Resend API
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  // If no Resend API key, log email to console in development
  if (!RESEND_API_KEY || !resend) {
    console.log('📧 [EMAIL] (Development mode - not sending)')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Body:', text || html)
    console.log('\n---\n')
    
    // In production, throw error if API key is missing
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is required in production')
    }
    return { success: true, id: 'dev-mode' }
  }

  try {
    console.log('[EMAIL] Attempting to send email:', {
      from: FROM_EMAIL,
      to: to,
      hasApiKey: !!RESEND_API_KEY
    })

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })

    if (error) {
      console.error('[EMAIL] Error sending email:', {
        message: error.message,
        name: error.name,
        error: JSON.stringify(error, null, 2)
      })
      throw new Error(error.message || 'Failed to send email')
    }

    console.log('[EMAIL] Email sent successfully:', {
      id: data?.id,
      from: FROM_EMAIL,
      to: to
    })
    return { success: true, id: data?.id }
  } catch (error: any) {
    console.error('[EMAIL] Failed to send email - Full error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      error: error
    })
    throw error
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`
  
  const subject = `Reset della password - ${APP_NAME}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #2563eb; margin: 0;">${APP_NAME}</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-top: 0;">Reset della password</h2>
        
        <p>Ciao,</p>
        
        <p>Abbiamo ricevuto una richiesta per reimpostare la password del tuo account associato all'indirizzo email <strong>${email}</strong>.</p>
        
        <p>Per reimpostare la tua password, clicca sul pulsante qui sotto:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reimposta Password</a>
        </div>
        
        <p>Oppure copia e incolla questo link nel tuo browser:</p>
        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
          ${resetUrl}
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          <strong>Importante:</strong>
        </p>
        <ul style="color: #6b7280; font-size: 14px;">
          <li>Questo link è valido per <strong>1 ora</strong></li>
          <li>Se non hai richiesto il reset della password, puoi ignorare questa email</li>
          <li>La tua password non verrà modificata finché non clicchi sul link sopra</li>
        </ul>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Se non funziona, contatta il supporto di ${APP_NAME}.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. Tutti i diritti riservati.</p>
      </div>
    </body>
    </html>
  `

  const text = `
${APP_NAME} - Reset della password

Ciao,

Abbiamo ricevuto una richiesta per reimpostare la password del tuo account associato all'indirizzo email ${email}.

Per reimpostare la tua password, copia e incolla questo link nel tuo browser:

${resetUrl}

Importante:
- Questo link è valido per 1 ora
- Se non hai richiesto il reset della password, puoi ignorare questa email
- La tua password non verrà modificata finché non clicchi sul link sopra

Se non funziona, contatta il supporto di ${APP_NAME}.

© ${new Date().getFullYear()} ${APP_NAME}. Tutti i diritti riservati.
  `.trim()

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

/**
 * Send add password email for OAuth-only accounts
 */
export async function sendAddPasswordEmail(email: string, token: string) {
  const addPasswordUrl = `${APP_URL}/auth/add-password?token=${token}&email=${encodeURIComponent(email)}`
  
  const subject = `Aggiungi password al tuo account - ${APP_NAME}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Aggiungi Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #2563eb; margin: 0;">${APP_NAME}</h1>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-top: 0;">Aggiungi password al tuo account</h2>
        
        <p>Ciao,</p>
        
        <p>Abbiamo ricevuto una richiesta per aggiungere una password al tuo account associato all'indirizzo email <strong>${email}</strong>.</p>
        
        <p>Attualmente il tuo account è configurato solo per l'accesso tramite Google/Facebook/Apple. Aggiungendo una password, potrai accedere anche con email e password.</p>
        
        <p>Per aggiungere una password al tuo account, clicca sul pulsante qui sotto:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${addPasswordUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Aggiungi Password</a>
        </div>
        
        <p>Oppure copia e incolla questo link nel tuo browser:</p>
        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
          ${addPasswordUrl}
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          <strong>Importante:</strong>
        </p>
        <ul style="color: #6b7280; font-size: 14px;">
          <li>Questo link è valido per <strong>24 ore</strong></li>
          <li>Dopo aver aggiunto la password, potrai accedere con email/password oppure continuare a usare Google/Facebook/Apple</li>
          <li>Se non hai richiesto di aggiungere una password, puoi ignorare questa email</li>
        </ul>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Se non funziona, contatta il supporto di ${APP_NAME}.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ${APP_NAME}. Tutti i diritti riservati.</p>
      </div>
    </body>
    </html>
  `

  const text = `
${APP_NAME} - Aggiungi password al tuo account

Ciao,

Abbiamo ricevuto una richiesta per aggiungere una password al tuo account associato all'indirizzo email ${email}.

Attualmente il tuo account è configurato solo per l'accesso tramite Google/Facebook/Apple. Aggiungendo una password, potrai accedere anche con email e password.

Per aggiungere una password al tuo account, copia e incolla questo link nel tuo browser:

${addPasswordUrl}

Importante:
- Questo link è valido per 24 ore
- Dopo aver aggiunto la password, potrai accedere con email/password oppure continuare a usare Google/Facebook/Apple
- Se non hai richiesto di aggiungere una password, puoi ignorare questa email

Se non funziona, contatta il supporto di ${APP_NAME}.

© ${new Date().getFullYear()} ${APP_NAME}. Tutti i diritti riservati.
  `.trim()

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

