import nodemailer from "nodemailer"
import { appConfig } from "@/data/config"
import { pterodactylConfig } from "@/data/config"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: appConfig.emailSender.auth.user,
    pass: appConfig.emailSender.auth.pass,
  },
})

export async function sendPanelDetailsEmail(
  to: string,
  username: string,
  password: string,
  serverId: number,
  planName: string,
) {
  const panelUrl = pterodactylConfig.domain

  const mailOptions = {
    from: appConfig.emailSender.from,
    to,
    subject: `Detail Akun Panel Pterodactyl ${appConfig.nameHost}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="background: linear-gradient(to right, #e53e3e, #c53030); padding: 15px; border-radius: 5px 5px 0 0;">
          <h2 style="color: white; margin: 0; text-align: center;">${appConfig.nameHost} - Detail Panel Pterodactyl</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <p style="margin-bottom: 20px;">Halo,</p>
          <p>Terima kasih telah membeli panel Pterodactyl di ${appConfig.nameHost}. Berikut adalah detail akun panel Anda:</p>
          
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p><strong>Paket:</strong> ${planName}</p>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong> <code style="background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px;">${password}</code></p>
            <p><strong>Server ID:</strong> ${serverId}</p>
            <p><strong>URL Panel:</strong> <a href="${panelUrl}" style="color: #e53e3e;">${panelUrl}</a></p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${panelUrl}" style="background-color: #e53e3e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Sekarang</a>
          </div>
          
          <p>Silakan login ke panel dengan kredensial di atas. Jika Anda memiliki pertanyaan atau membutuhkan bantuan, jangan ragu untuk menghubungi tim dukungan kami.</p>
          
          <p>Anda juga dapat bergabung dengan grup WhatsApp kami untuk mendapatkan informasi terbaru dan dukungan:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${
              appConfig.whatsappGroupLink
            }" style="background-color: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Gabung Grup WhatsApp</a>
          </div>
          
          <p style="margin-top: 30px;">Salam,<br>Tim ${appConfig.nameHost}</p>
        </div>
        
        <div style="background-color: #2d3748; color: white; text-align: center; padding: 10px; border-radius: 0 0 5px 5px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${appConfig.nameHost}. All rights reserved.</p>
        </div>
      </div>
    `,
  }

  try {
    console.log(`Attempting to send email to ${to}...`)
    console.log(`Using email credentials: ${appConfig.emailSender.auth.user}`)

    await transporter.verify()
    console.log("SMTP server connection verified")

    const info = await transporter.sendMail(mailOptions)
    console.log(`Email sent successfully: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
