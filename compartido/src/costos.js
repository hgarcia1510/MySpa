const redondear = (valor) => Math.round((Number(valor) || 0) * 100) / 100;

export function calcularCostoTratamiento(productos = []) {
  return redondear(productos.reduce((suma, producto) => suma + Number(producto.precioUso || 0), 0));
}

export function calcularCostoServicio(tratamientos = []) {
  return redondear(
    tratamientos.reduce(
      (suma, tratamiento) => suma + Number(tratamiento.costo ?? calcularCostoTratamiento(tratamiento.productos)),
      0
    )
  );
}

export function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor) || 0);
}

export function formatearFecha(fecha) {
  if (!fecha) return '';
  const objetoFecha = new Date(fecha);
  const dosDigitos = (numero) => String(numero).padStart(2, '0');
  return `${dosDigitos(objetoFecha.getDate())}/${dosDigitos(objetoFecha.getMonth() + 1)}/${objetoFecha.getFullYear()} ${dosDigitos(objetoFecha.getHours())}:${dosDigitos(objetoFecha.getMinutes())}`;
}

export function formatearFechaBd(fecha = new Date()) {
  const dosDigitos = (numero) => String(numero).padStart(2, '0');
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}:${dosDigitos(fecha.getSeconds())}`;
}