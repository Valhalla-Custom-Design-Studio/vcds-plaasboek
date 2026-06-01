import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  appName: string = 'Plaasboek™'
): Promise<void> {
  const resetUrl = `${process.env.APP_URL || 'https://plaasboek.vcds.co.za'}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"${appName}" <${process.env.SMTP_USER}>`,
    to,
    subject: `${appName}  -  Wagwoord Herstel Versoek`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#78350F;">${appName}</h2>
        <p>Jy het `n wagwoord herstel versoek. Klik die skakel hieronder om 'n nuwe wagwoord in te stel:</p>`
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#78350F;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          Herstel Wagwoord
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px;">
          Hierdie skakel verval oor 1 uur. As jy nie 'n herstel versoek gedoen het nie, ignoreer hierdie e-pos.
        </p>
        <p style="color:#999;font-size:11px;">VCDS Holdings · Heidelberg, Gauteng, Suid-Afrika</p>
      </div>
    `,
    text: `Herstel jou ${appName} wagwoord: ${resetUrl}\n\nHierdie skakel verval oor 1 uur.`,
  });
}
