import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

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

const createReportPdf = ({ memberName, startDate, endDate, createdAt, generalComments, triggers }) => new Promise((resolve, reject) => {
  const document = new PDFDocument({ size: 'A4', margin: 48, info: { Title: 'Look Away Report', Author: 'Look Away' } });
  const chunks = [];

  document.on('data', (chunk) => chunks.push(chunk));
  document.on('end', () => resolve(Buffer.concat(chunks)));
  document.on('error', reject);

  document.rect(0, 0, document.page.width, 92).fill('#101b2b');
  document.fillColor('#e7d59c').fontSize(10).font('Helvetica-Bold').text('LOOK AWAY', 48, 27, { characterSpacing: 2 });
  document.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Accountability Report', 48, 47);
  document.fillColor('#765b24').fontSize(10).font('Helvetica').text('PRIVATE REPORT', 48, 112, { characterSpacing: 1.5 });

  document.fillColor('#1d2430').fontSize(11).font('Helvetica-Bold').text('Report details', 48, 142);
  document.moveTo(48, 160).lineTo(547, 160).lineWidth(1).stroke('#c9982c');
  document.font('Helvetica-Bold').fontSize(10).fillColor('#68717d').text('MEMBER', 48, 178);
  document.font('Helvetica').fontSize(12).fillColor('#1d2430').text(memberName, 48, 193);
  document.font('Helvetica-Bold').fontSize(10).fillColor('#68717d').text('PERIOD', 310, 178);
  document.font('Helvetica').fontSize(12).fillColor('#1d2430').text(`${startDate} to ${endDate}`, 310, 193);
  document.font('Helvetica-Bold').fontSize(10).fillColor('#68717d').text('CREATED', 48, 225);
  document.font('Helvetica').fontSize(12).fillColor('#1d2430').text(createdAt, 48, 240);

  document.font('Helvetica-Bold').fontSize(15).fillColor('#765b24').text('Comments', 48, 290);
  document.font('Helvetica').fontSize(11).fillColor('#1d2430').text(generalComments, 48, 314, { width: 499, lineGap: 5 });

  const commentsBottom = document.y;
  document.font('Helvetica-Bold').fontSize(15).fillColor('#765b24').text('Triggers', 48, commentsBottom + 30);
  const triggerRows = triggers.length ? triggers : [{ trigger: 'No triggers logged.', comment: '' }];
  let triggerY = document.y + 12;
  triggerRows.forEach(({ trigger, comment }) => {
    if (triggerY > 730) {
      document.addPage();
      triggerY = 54;
    }
    document.circle(56, triggerY + 6, 3).fill('#c9982c');
    document.font('Helvetica-Bold').fontSize(11).fillColor('#1d2430').text(trigger, 68, triggerY, { width: 479 });
    triggerY = document.y;
    if (comment) {
      document.font('Helvetica-Oblique').fontSize(10).fillColor('#68717d').text(comment, 68, triggerY + 2, { width: 479 });
      triggerY = document.y;
    }
    triggerY += 12;
  });

  document.font('Helvetica').fontSize(9).fillColor('#68717d').text('Sent by Look Away', 48, 780, { align: 'center', width: 499 });
  document.end();
});

const getDeliveryError = (error) => {
  if (error?.code === 'EAUTH' || error?.responseCode === 535) return 'SMTP authentication failed. Check REPORT_FROM_EMAIL and GMASS_API_KEY.';
  if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNECTION' || error?.code === 'ESOCKET') return 'Could not connect to the GMass SMTP server.';
  if (error?.code === 'EENVELOPE') return 'GMass rejected one or more recipient addresses.';
  if (error?.name === 'Error' && error?.message?.includes('PDF')) return 'The PDF report could not be generated.';
  return 'The report email could not be sent.';
};

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
    const triggers = Array.isArray(report.triggers) ? report.triggers : [];
    const subject = `Look Away report: ${startDate} to ${endDate}`;
    const pdf = await createReportPdf({
      memberName,
      startDate,
      endDate,
      createdAt,
      generalComments,
      triggers,
    });
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmass.co',
      port: 2525,
      secure: false,
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: { user: from, pass: gmassApiKey },
    });

    await transporter.verify();
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
        <div style="border-top:1px solid #eee7d5;">${triggers.length
          ? triggers.map(({ trigger, comment }) => `<div style="padding:12px 0;border-bottom:1px solid #eee7d5;"><strong>${escapeHtml(trigger)}</strong>${comment ? `<div style="margin-top:4px;color:#68717d;">${escapeHtml(comment)}</div>` : ''}</div>`).join('')
          : '<div style="padding:12px 0;color:#68717d;">No triggers logged.</div>'}</div>
      </div>
      <p style="font-size:12px;color:#68717d;text-align:center;">Sent by Look Away</p>
    </div>
  </body>
</html>`,
      attachments: [{
        filename: `look-away-report-${startDate}-to-${endDate}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      }],
    });

    return json(200, { sent: true, recipients: uniqueRecipients });
  } catch (error) {
    console.error('GMass SMTP delivery failed', {
      code: error?.code,
      responseCode: error?.responseCode,
      command: error?.command,
      message: error?.message,
    });
    return json(502, { error: getDeliveryError(error) });
  }
};
