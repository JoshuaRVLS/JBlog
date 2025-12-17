export const getVerificationEmailTemplate = (
  name: string,
  verificationCode: string,
  verificationLink: string
): string => {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi JBlog</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                🎉 Selamat Datang di JBlog!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Halo <strong style="color: #667eea;">${name}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 15px; line-height: 1.6;">
                Terima kasih telah mendaftar di JBlog! Untuk menyelesaikan proses registrasi, silakan verifikasi email Anda dengan kode di bawah ini.
              </p>
              
              <!-- Verification Code Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);">
                      <p style="margin: 0 0 15px; color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                        Kode Verifikasi Anda
                      </p>
                      <div style="background-color: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 20px; margin: 15px 0; backdrop-filter: blur(10px);">
                        <p style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${verificationCode}
                        </p>
                      </div>
                      <p style="margin: 15px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 12px;">
                        Kode ini berlaku selama 24 jam
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <p style="margin: 0 0 15px; color: #666666; font-size: 14px;">
                      Atau klik tombol di bawah ini untuk verifikasi langsung:
                    </p>
                    <a href="${verificationLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                      Verifikasi Email
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: #333333; font-size: 14px; font-weight: 600;">
                  🔒 Keamanan
                </p>
                <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.6;">
                  Jangan bagikan kode verifikasi ini kepada siapa pun. Tim JBlog tidak akan pernah meminta kode verifikasi Anda melalui email atau telepon.
                </p>
              </div>
              
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                Jika Anda tidak mendaftar di JBlog, abaikan email ini. Kode verifikasi akan kedaluwarsa secara otomatis.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                <strong style="color: #333333;">JBlog</strong> - Platform Blogging Modern
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Email ini dikirim secara otomatis, mohon jangan membalas email ini.
              </p>
              <p style="margin: 15px 0 0; color: #999999; font-size: 11px;">
                © ${new Date().getFullYear()} JBlog. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

