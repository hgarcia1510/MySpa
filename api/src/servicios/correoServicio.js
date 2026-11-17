import nodemailer from 'nodemailer';
import { formatearFecha } from '@myspa/compartido';

const hayCorreoConfigurado = () => Boolean(process.env.CORREO_USUARIO && process.env.CORREO_CONTRASENIA);

let transportador;
function obtenerTransportador() {
  transportador ??= nodemailer.createTransport({
    host: process.env.CORREO_HOST,
    port: Number(process.env.CORREO_PUERTO ?? 465),
    secure: Number(process.env.CORREO_PUERTO ?? 465) === 465,
    auth: { user: process.env.CORREO_USUARIO, pass: process.env.CORREO_CONTRASENIA },
  });
  return transportador;
}

/** RF 0706 - Notifica al cliente una nueva reservación o una cancelación. */
export async function enviarCorreoReservacion(reservacion, tipoOperacion) {
  const asunto = `MySPA - ${tipoOperacion}`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#4a4a4a">
      <h2 style="color:#7a9e9f">${tipoOperacion}</h2>
      <p>Hola ${reservacion.nombreCliente}, estos son los datos de tu reservación:</p>
      <ul>
        <li><b>Folio:</b> ${reservacion.idReservacion}</li>
        <li><b>Fecha:</b> ${formatearFecha(reservacion.fecha)}</li>
        <li><b>Sala:</b> ${reservacion.nombreSala}</li>
        <li><b>Sucursal:</b> ${reservacion.nombreSucursal}</li>
        <li><b>Estatus:</b> ${reservacion.estatus}</li>
      </ul>
    </div>`;

  if (!hayCorreoConfigurado()) {
    console.log(`[correo simulado] Para: ${reservacion.correo} | ${asunto}`);
    return;
  }
  try {
    await obtenerTransportador().sendMail({
      from: `"MySPA" <${process.env.CORREO_USUARIO}>`,
      to: reservacion.correo,
      subject: asunto,
      html,
    });
  } catch (error) {
    // Un fallo de correo no debe deshacer la reservación
    console.error('No se pudo enviar el correo:', error.message);
  }
}