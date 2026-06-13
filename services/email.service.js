import nodemailer from 'nodemailer';
import path from 'path';

const LOGO_CID = 'lider-logo';
const LOGO_SOURCE_PATH = path.join(process.cwd(), 'public', 'lider_logo.webp');
let logoBufferPromise = null;

async function getLogoBuffer() {
  if (!logoBufferPromise) {
    logoBufferPromise = (async () => {
      try {
        const { default: sharp } = await import('sharp');
        return await sharp(LOGO_SOURCE_PATH)
          .resize({ width: 400 })
          .png()
          .toBuffer();
      } catch (err) {
        console.warn('[email] Failed to prepare Lider logo:', err.message);
        logoBufferPromise = null;
        return null;
      }
    })();
  }
  return logoBufferPromise;
}

const REKLAMACJA_NOTICE_HTML = `
  W przypadku gdy mają Państwo zastrzeżenia do wykonanych prac lub ich wyceny, prosimy o zgłoszenie ich poprzez odpowiedź na niniejszą wiadomość w terminie 7 dni od daty otrzymania protokołu. Brak zastrzeżeń zgłoszonych w powyższym terminie będzie oznaczał akceptację przedstawionego protokołu i wynikłych z tego tytułu skutków finansowych.
  <br><br>
  Według stawki godzinowej liczona będzie każda rozpoczęta godzina pracy serwisanta.
`;

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html, attachments }) {
  const transport = getTransporter();
  return transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    ...(attachments?.length ? { attachments } : {}),
  });
}

export async function sendInviteEmail({ to, name, inviteUrl }) {
  return sendMail({
    to,
    subject: 'Zaproszenie do systemu Helper',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Witaj, ${name}!</h2>
        <p>Zostałeś/aś zaproszony/a do systemu <strong>Helper</strong>.</p>
        <p>Kliknij poniższy przycisk, aby aktywować konto i ustawić hasło:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 8px; font-size: 16px; display: inline-block;">
            Aktywuj konto
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Link jest ważny przez 7 dni.<br>
          Jeśli nie spodziewałeś/aś się tego zaproszenia, zignoruj tę wiadomość.
        </p>
        <hr style="border-color: #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Helper App</p>
      </div>
    `,
  });
}

export async function sendTicketReportEmail({ ticket }) {
  const client = ticket.client || {};
  const executor = ticket.executor
    ? `${ticket.executor.name || ''} ${ticket.executor.surname || ''}`.trim()
    : '—';
  const createdBy = ticket.createdBy
    ? `${ticket.createdBy.name || ''} ${ticket.createdBy.surname || ''}`.trim()
    : '—';

  const totalMinutes = ticket.duration || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const durationStr = hours > 0 && minutes > 0
    ? `${hours} godz ${minutes} min`
    : hours > 0
    ? `${hours} godz`
    : `${minutes} min`;

  const dateObj = ticket.date ? new Date(ticket.date) : new Date();
  const dateStr = dateObj.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const commuteStr = ticket.commute ? 'Tak' : 'Nie';
  const priceStr = ticket.priceType != null ? `${ticket.priceType} zł` : '—';
  const noteHtml = ticket.note
    ? `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; width: 40%; font-weight: 600; color: #374151; vertical-align: top;">Uwagi</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: top;">${ticket.note}</td>
        </tr>`
    : '';

  const to = ticket.email || client.email;

  const logoBuffer = await getLogoBuffer();
  const logoHtml = logoBuffer
    ? `<img src="cid:${LOGO_CID}" width="200" border="0" alt="Lider IT" style="display:block; margin:0 auto 12px; height:auto;">`
    : '';
  const attachments = logoBuffer
    ? [{ filename: 'lider-logo.png', content: logoBuffer, cid: LOGO_CID, contentDisposition: 'inline' }]
    : undefined;

  return sendMail({
    to,
    subject: 'Lider IT Sp. z o.o | Protokół serwisowy',
    attachments,
    html: `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td bgcolor="#1e3a5f" style="background-color: #1e3a5f; background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px 40px; text-align: center;">
              ${logoHtml}
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Protokół serwisowy</h1>
              <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">Lider IT Sp. z o.o</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">

              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">
                Szanowni Państwo,<br><br>
                Poniżej przedstawiamy protokół wykonanych prac serwisowych.
              </p>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; width: 40%; font-weight: 600; color: #374151; vertical-align: top;">Dnia</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: top;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600; color: #374151; vertical-align: top;">Czas</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: top;">${durationStr}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600; color: #374151; vertical-align: top;">Klient</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: top;">${client.name || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600; color: #374151; vertical-align: top;">Osoba zlecająca</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: top;">${ticket.orderedBy || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600; color: #374151; vertical-align: top;">Opiekun zlecenia</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: top;">${executor}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600; color: #374151; vertical-align: top;">Wykonane prace</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: top; line-height: 1.6;">${ticket.description || '—'}</td>
                </tr>
                ${noteHtml}
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600; color: #374151; vertical-align: top;">Dojazd</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: top;">${commuteStr}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; background: #f9fafb; font-weight: 600; color: #374151; vertical-align: top;">Cena usługi za h/szt</td>
                  <td style="padding: 12px 16px; color: #1e3a5f; font-weight: 700; font-size: 16px; vertical-align: top;">${priceStr}</td>
                </tr>
              </table>

              <div style="margin: 20px 0 0 0; padding: 16px 20px; background: #f9fafb; border-left: 3px solid #1e3a5f; border-radius: 0 6px 6px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 700; color: #1e3a5f; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Reklamacja</p>
                <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6;">${REKLAMACJA_NOTICE_HTML}</p>
              </div>

              <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                Protokół sporządził: <strong style="color: #374151;">${createdBy}</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                Lider IT Sp. z o.o &bull; Wiadomość wygenerowana automatycznie przez system Helper
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

export async function sendResetPasswordEmail({ to, name, resetUrl }) {
  return sendMail({
    to,
    subject: 'Resetowanie hasła — Helper',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Resetowanie hasła</h2>
        <p>Cześć ${name},</p>
        <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w systemie <strong>Helper</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc2626; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 8px; font-size: 16px; display: inline-block;">
            Resetuj hasło
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Link jest ważny przez 1 godzinę.<br>
          Jeśli nie prosiłeś/aś o reset hasła, zignoruj tę wiadomość.
        </p>
        <hr style="border-color: #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Helper App</p>
      </div>
    `,
  });
}
