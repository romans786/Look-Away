import nodemailer from 'nodemailer';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const from = process.env.REPORT_FROM_EMAIL;
  const gmassApiKey = process.env.GMASS_API_KEY;
  if (!from || !gmassApiKey) {
    return json(503, { error: 'Email delivery is not configured.' });
  }

  let request;
  try {
    request = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid report request.' });
  }

  const { recipients = [], report, user } = request;
  if (!Array.isArray(recipients)) return json(400, { error: 'Recipients and report are required.' });
  const uniqueRecipients = [...new Set(recipients.filter((recipient) => typeof recipient === 'string' && recipient.trim()))];
  if (!uniqueRecipients.length || !report) return json(400, { error: 'Recipients and report are required.' });

  try {
    const triggerSummary = (report.triggers || []).length
      ? report.triggers.map((entry) => `- ${entry.trigger}${entry.comment ? `: ${entry.comment}` : ''}`).join('\n')
      : 'No triggers logged.';
    const memberName = user?.name || 'Look Away member';
    const startDate = report.startDate;
    const endDate = report.endDate;
    const createdAt = report.createdAt;
    const generalComments = report.generalComments || 'No general comments recorded.';
    const subject = `Look Away report: ${startDate} to ${endDate}`;
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmass.co',
      port: 2525,
      secure: false,
      auth: { user: from, pass: gmassApiKey },
    });

    await transporter.sendMail({
      from,
      to: uniqueRecipients,
      subject,
      text: [
        'Look Away Report',
        `Member: ${memberName}`,
        `Period: ${startDate} to ${endDate}`,
        `Created: ${createdAt}`,
        '',
        'Comments',
        generalComments,
        '',
        'Triggers',
        triggerSummary,
      ].join('\n'),
      html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f1e8;color:#1d2430;font-family:Arial,sans-serif;line-height:1.5;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="background:#101b2b;border-top:4px solid #c9982c;padding:24px;color:#ffffff;">
        <h1 style="margin:0;font-size:24px;">Look Away Report</h1>
        <p style="margin:8px 0 0;color:#e7d59c;">Accountability report</p>
      </div>
      <div style="background:#ffffff;padding:24px;">
        <p><strong>Member:</strong> ${escapeHtml(memberName)}</p>
        <p><strong>Period:</strong> ${escapeHtml(startDate)} to ${escapeHtml(endDate)}</p>
        <p><strong>Created:</strong> ${escapeHtml(createdAt)}</p>
        <h2 style="font-size:17px;color:#765b24;margin:24px 0 8px;">Comments</h2>
        <p style="white-space:pre-line;">${escapeHtml(generalComments)}</p>
        <h2 style="font-size:17px;color:#765b24;margin:24px 0 8px;">Triggers</h2>
        <p style="white-space:pre-line;">${escapeHtml(triggerSummary)}</p>
      </div>
      <p style="font-size:12px;color:#68717d;text-align:center;">Sent by Look Away</p>
    </div>
  </body>
</html>`,
    });

    return json(200, { sent: true, recipients: uniqueRecipients });
  } catch (error) {
    console.error('GMass SMTP delivery failed', error);
    return json(502, { error: 'The report email could not be sent.' });
  }
};
