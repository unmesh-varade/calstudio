const { env } = require('../config/env');

let transportPromise;

async function getTransport() {
  if (!env.smtp) {
    return null;
  }

  if (!transportPromise) {
    transportPromise = import('nodemailer').then(({ default: nodemailer }) =>
      nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,
        auth:
          env.smtp.user && env.smtp.pass
            ? {
                user: env.smtp.user,
                pass: env.smtp.pass,
              }
            : undefined,
      }),
    );
  }

  return transportPromise;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAnswers(answers) {
  if (!answers?.length) {
    return {
      text: 'Custom responses: none provided',
      html: '<p><strong>Custom responses:</strong> none provided</p>',
    };
  }

  return {
    text: answers.map((answer) => `- ${answer.questionLabel}: ${answer.value}`).join('\n'),
    html: `<ul>${answers
      .map(
        (answer) =>
          `<li><strong>${escapeHtml(answer.questionLabel)}:</strong> ${escapeHtml(answer.value)}</li>`,
      )
      .join('')}</ul>`,
  };
}

async function deliverEmail(message) {
  const transport = await getTransport();

  if (!transport) {
    console.log('[email notification skipped: smtp not configured]', {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    return;
  }

  await transport.sendMail({
    from: env.emailFrom,
    ...message,
  });
}

function logEmailFailures(results) {
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('[email delivery failed]', result.reason);
    }
  });
}

async function sendBookingCreatedEmails(booking) {
  const answerBlock = renderAnswers(booking.answers);
  const title = booking.eventType.title;
  const timeLabel = booking.localStart.label;
  const attendeeText = [
    `Hi ${booking.attendeeName},`,
    '',
    `Your ${title} is confirmed for ${timeLabel}.`,
    `Organizer: ${booking.eventType.organizer.name} (${booking.eventType.organizer.email})`,
    `Timezone: ${booking.eventType.timezone}`,
    '',
    answerBlock.text,
  ].join('\n');
  const organizerText = [
    `New booking for ${title}.`,
    '',
    `Attendee: ${booking.attendeeName} <${booking.attendeeEmail}>`,
    `When: ${timeLabel}`,
    `Attendee timezone: ${booking.attendeeTimezone || 'Not shared'}`,
    '',
    answerBlock.text,
  ].join('\n');

  const results = await Promise.allSettled([
    deliverEmail({
      to: booking.attendeeEmail,
      subject: `Booking confirmed: ${title}`,
      text: attendeeText,
      html: `
        <p>Hi ${escapeHtml(booking.attendeeName)},</p>
        <p>Your <strong>${escapeHtml(title)}</strong> is confirmed for <strong>${escapeHtml(timeLabel)}</strong>.</p>
        <p>Organizer: ${escapeHtml(booking.eventType.organizer.name)} (${escapeHtml(
          booking.eventType.organizer.email,
        )})</p>
        <p>Timezone: ${escapeHtml(booking.eventType.timezone)}</p>
        ${answerBlock.html}
      `,
    }),
    deliverEmail({
      to: booking.eventType.organizer.email,
      subject: `New booking: ${title}`,
      text: organizerText,
      html: `
        <p>New booking for <strong>${escapeHtml(title)}</strong>.</p>
        <p>Attendee: ${escapeHtml(booking.attendeeName)} (${escapeHtml(booking.attendeeEmail)})</p>
        <p>When: ${escapeHtml(timeLabel)}</p>
        <p>Attendee timezone: ${escapeHtml(booking.attendeeTimezone || 'Not shared')}</p>
        ${answerBlock.html}
      `,
    }),
  ]);

  logEmailFailures(results);
}

async function sendBookingCancelledEmails(booking) {
  const title = booking.eventType.title;
  const timeLabel = booking.localStart.label;
  const attendeeText = [
    `Hi ${booking.attendeeName},`,
    '',
    `Your ${title} scheduled for ${timeLabel} has been cancelled.`,
  ].join('\n');
  const organizerText = [
    `${title} has been cancelled.`,
    '',
    `Attendee: ${booking.attendeeName} <${booking.attendeeEmail}>`,
    `When: ${timeLabel}`,
  ].join('\n');

  const results = await Promise.allSettled([
    deliverEmail({
      to: booking.attendeeEmail,
      subject: `Booking cancelled: ${title}`,
      text: attendeeText,
      html: `
        <p>Hi ${escapeHtml(booking.attendeeName)},</p>
        <p>Your <strong>${escapeHtml(title)}</strong> scheduled for <strong>${escapeHtml(
          timeLabel,
        )}</strong> has been cancelled.</p>
      `,
    }),
    deliverEmail({
      to: booking.eventType.organizer.email,
      subject: `Booking cancelled: ${title}`,
      text: organizerText,
      html: `
        <p><strong>${escapeHtml(title)}</strong> has been cancelled.</p>
        <p>Attendee: ${escapeHtml(booking.attendeeName)} (${escapeHtml(booking.attendeeEmail)})</p>
        <p>When: ${escapeHtml(timeLabel)}</p>
      `,
    }),
  ]);

  logEmailFailures(results);
}

module.exports = {
  sendBookingCancelledEmails,
  sendBookingCreatedEmails,
};
