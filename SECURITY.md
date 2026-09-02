# Seguridad de TENE

## Reporte responsable

No publiques vulnerabilidades, credenciales ni datos personales en un issue público. Repórtalos de forma privada al propietario del repositorio e incluye pasos de reproducción, impacto y evidencia mínima sin datos reales de terceros.

## Alcance de seguridad

- Las decisiones de autorización se realizan en el servidor.
- Las cuentas administrativas se separan por roles y las acciones sensibles se auditan.
- Los comprobantes de pago se entregan únicamente a `owner` y `admin`, sin caché pública.
- Los secretos pertenecen al entorno de hosting y nunca al repositorio.
- Los webhooks requieren secreto y procesamiento idempotente.
- El navegador recibe CSP, HSTS, protección contra iframes, `nosniff` y una política restrictiva de permisos.

## Gestión de secretos

- Utiliza credenciales diferentes para desarrollo, staging y producción.
- Rota inmediatamente cualquier secreto expuesto.
- Otorga a cada integración el mínimo permiso necesario.
- No copies valores reales a `.env.example`, logs, capturas, incidencias o fixtures.

## Datos personales

Los usuarios pueden descargar sus datos desde `GET /api/me/export` y registrar solicitudes de exportación o eliminación en `POST /api/me/privacy/requests`. Los comprobantes revisados se conservan por un máximo técnico de 180 días mediante la tarea de mantenimiento, sujeto a la política legal definitiva.

Una solicitud de eliminación no debe borrar movimientos financieros exigidos por obligaciones legales o prevención de fraude. En esos casos se deben anonimizar los datos no necesarios y documentar la base de retención.

