/**
 * Konfigurasi email sender untuk Brevo
 * Domain jblog.space sudah terverifikasi di Brevo
 * Nama sender bisa apa saja selama domain email sudah terverifikasi
 */

export const EMAIL_SENDER = {
  name: "JBlog",
  email: process.env.EMAIL_SENDER || "noreply@jblog.space",
};

/**
 * Get email sender configuration
 * @returns Sender object dengan name dan email
 */
export function getEmailSender() {
  return {
    name: EMAIL_SENDER.name,
    email: EMAIL_SENDER.email,
  };
}

