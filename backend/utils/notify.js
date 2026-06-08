const nodemailer = require("nodemailer");
const { db } = require("../models/db");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user, pass },
  });

  return transporter;
}

async function sendEmail(to, subject, text, html) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[mail skipped] ${to} :: ${subject}`);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

async function getUsersByIds(userIds) {
  const uniqueIds = [...new Set((userIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  if (!uniqueIds.length) return [];

  const placeholders = uniqueIds.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT id, username, email
     FROM users
     WHERE is_active = 1 AND id IN (${placeholders})`,
    uniqueIds
  );
  return rows;
}

async function createNotifications({
  userIds,
  notificationKey,
  type,
  title,
  body,
  link = null,
  sendMail = false,
  mailSubject,
  mailText,
  mailHtml,
}) {
  const recipients = await getUsersByIds(userIds);
  if (!recipients.length) return [];

  const notificationRows = recipients.map((user) => [
    user.id,
    notificationKey(user.id),
    type,
    title,
    body || null,
    link,
  ]);

  await db.query(
    `INSERT IGNORE INTO notifications
       (user_id, notification_key, type, title, body, link)
     VALUES ?`,
    [notificationRows]
  );

  if (sendMail) {
    await Promise.all(
      recipients
        .filter((user) => user.email)
        .map(async (user) => {
          try {
            await sendEmail(
              user.email,
              mailSubject || title,
              typeof mailText === "function" ? mailText(user) : mailText || body || title,
              typeof mailHtml === "function" ? mailHtml(user) : mailHtml || `<p>${body || title}</p>`
            );
          } catch (err) {
            console.error(`Failed to send notification email to ${user.email}:`, err.message);
          }
        })
    );
  }

  return recipients;
}

module.exports = {
  createNotifications,
  sendEmail,
};
