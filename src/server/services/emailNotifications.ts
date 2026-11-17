import { sendEmail } from './dropaphi'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]!)
}

export async function sendEmailNotification(to: string, subject: string, body: string) {
  const sent = await sendEmail(to, subject, `<p>${escapeHtml(body)}</p>`)
  if (!sent) throw new Error(`Could not send notification email to ${to}.`)
}
