const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM =
  process.env.EMAIL_FROM || 'TopoPro FC <onboarding@resend.dev>';


// ======================================================
// CORREO DE VERIFICACIÓN
// ======================================================

async function enviarCorreoVerificacion(
  destinatario,
  token,
  nombre = ''
) {

  const apiUrl =
    process.env.API_URL || 'http://localhost:3000';

  const enlace =
    apiUrl +
    '/api/auth/verificar-email?token=' +
    String(token);


  const { data, error } =
    await resend.emails.send({

      from: EMAIL_FROM,

      to: [destinatario],

      subject:
        'Verifica tu cuenta en TopoPro FC',

      html:
        '<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto;">' +

        '<h2>Bienvenido a TopoPro FC ' +
        nombre +
        '</h2>' +

        '<p>Se registró una nueva cuenta en TopoPro FC.</p>' +

        '<p><strong>Correo registrado:</strong> ' +
        destinatario +
        '</p>' +

        '<p>Para activar esta cuenta haz clic en el siguiente botón:</p>' +

        '<a href="' +
        enlace +
        '" style="background:#2563eb;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">' +

        'Verificar correo' +

        '</a>' +

        '<p style="color:#666;font-size:13px;margin-top:16px;">' +
        'Este enlace expira en 24 horas.' +
        '</p>' +

        '<p>Si el botón no funciona, copia este enlace:</p>' +

        '<p style="word-break:break-all;color:#2563eb;">' +
        enlace +
        '</p>' +

        '<hr>' +

        '<small>Equipo TopoPro FC</small>' +

        '</div>'
    });


  if (error) {

    console.error('');
    console.error(
      '================ ERROR RESEND VERIFICACIÓN ================'
    );

    console.error(
      'STATUS:',
      error.statusCode
    );

    console.error(
      'NAME:',
      error.name
    );

    console.error(
      'MESSAGE:',
      error.message
    );

    console.error(
      'ERROR COMPLETO:',
      error
    );

    console.error(
      '============================================================'
    );

    throw new Error(
      'No se pudo enviar el correo de verificación'
    );
  }


  console.log(
    '📧 Correo de verificación enviado:',
    data.id
  );

}


// ======================================================
// RECUPERACIÓN DE CONTRASEÑA
// ======================================================

async function enviarCorreoRecuperacion(
  destinatario,
  token
) {

  const enlace =
    (process.env.APP_URL || 'http://localhost:4200') +
    '/restablecer-password?token=' +
    String(token);


  const { data, error } =
    await resend.emails.send({

      from: EMAIL_FROM,

      to: [destinatario],

      subject:
        'Recuperación de contraseña - TopoPro FC',

      html:
        '<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto;">' +

        '<h2>Recuperación de contraseña</h2>' +

        '<p>Recibimos una solicitud para cambiar tu contraseña.</p>' +

        '<p><strong>Cuenta:</strong> ' +
        destinatario +
        '</p>' +

        '<p style="color:#666;font-size:13px;margin-top:8px;">' +
        'Este enlace expira en 30 minutos.' +
        '</p>' +

        '<p>Si realizaste esta solicitud puedes continuar:</p>' +

        '<a href="' +
        enlace +
        '" style="background:#dc2626;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">' +

        'Restablecer contraseña' +

        '</a>' +

        '<p>Si no solicitaste este cambio puedes ignorar este correo.</p>' +

        '<p style="word-break:break-all;color:#dc2626;">' +
        enlace +
        '</p>' +

        '<hr>' +

        '<small>Equipo TopoPro FC</small>' +

        '</div>'
    });


  if (error) {

    console.error('');
    console.error(
      '================ ERROR RESEND RECUPERACIÓN ================'
    );

    console.error(
      'STATUS:',
      error.statusCode
    );

    console.error(
      'NAME:',
      error.name
    );

    console.error(
      'MESSAGE:',
      error.message
    );

    console.error(
      'ERROR COMPLETO:',
      error
    );

    console.error(
      '============================================================'
    );

    throw new Error(
      'No se pudo enviar el correo de recuperación'
    );
  }


  console.log(
    '📧 Correo de recuperación enviado:',
    data.id
  );

}



// ======================================================
// CONTACTO PROFESIONAL
// ======================================================

async function enviarCorreoContacto({
  destinatario,
  nombreDestinatario,
  nombreRemitente,
  correoRemitente,
  asunto,
  mensaje
}) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [destinatario],
    replyTo: correoRemitente,
    subject: asunto || `Nuevo contacto profesional en TopoPro FC`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto;">
      <h2>Nuevo contacto profesional</h2>
      <p>Hola ${nombreDestinatario || ''},</p>
      <p><strong>${nombreRemitente}</strong> quiere ponerse en contacto contigo a través de TopoPro FC.</p>
      <p><strong>Correo:</strong> ${correoRemitente}</p>
      ${asunto ? `<p><strong>Asunto:</strong> ${asunto}</p>` : ''}
      <div style="background:#f5f7fb;padding:16px;border-radius:8px;white-space:pre-wrap;">${mensaje}</div>
      <p>Puedes responder directamente a este correo.</p>
      <hr><small>Equipo TopoPro FC</small>
    </div>`
  });
  if (error) {
    console.error('Error enviando contacto profesional:', error);
    throw new Error('No se pudo enviar la notificación de contacto');
  }
  console.log('📧 Notificación de contacto enviada:', data?.id);
}

// ======================================================
// EXPORTACIONES
// ======================================================

module.exports = {

  enviarCorreoVerificacion,

  enviarCorreoRecuperacion,
  enviarCorreoContacto

};
