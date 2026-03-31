import nodemailer from 'nodemailer';

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

export async function sendMail({ to, subject, html }) {
  const transport = getTransporter();
  return transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
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

  return sendMail({
    to,
    subject: 'Lider IT Sp. z o.o | Protokół serwisowy',
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
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 4px 0; color: rgba(255,255,255,0.75); font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">Lider IT Sp. z o.o</p>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Protokół serwisowy</h1>
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

              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
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
