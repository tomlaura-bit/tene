# Manual operativo de TENE

## Activación del servidor de partidas

Antes de abrir salas con dinero real, `/api/health` debe informar `checks.matchProvider.status: "configured"`. El diagnóstico indica el proveedor elegido y enumera únicamente los nombres de las variables faltantes; nunca expone sus valores.

- DatHost requiere `MATCH_PROVIDER=dathost`, `DATHOST_EMAIL`, `DATHOST_PASSWORD`, `DATHOST_GAME_SERVER_ID` y `DATHOST_WEBHOOK_TOKEN`. `DATHOST_SERVER_PASSWORD` es opcional.
- MatchZy requiere `MATCH_PROVIDER=matchzy`, `MATCHZY_API_URL`, `MATCHZY_API_TOKEN` y `MATCHZY_WEBHOOK_SECRET`.
- Realizar una partida cerrada de diez cuentas verificadas y confirmar la secuencia: aprovisionamiento, conexión, inicio, marcador, finalización y revisión del resultado.
- No habilitar liquidación automática hasta verificar webhooks duplicados, tardíos y con firma inválida en el entorno operativo.

Este documento define la operación mínima segura del servicio. Las acciones administrativas deben ejecutarse con una cuenta `owner` o `admin` y quedar registradas en `audit_logs`.

## Controles automáticos

- `GET /api/health` comprueba disponibilidad de D1, R2 e integraciones esenciales.
- Toda escritura web interna bloquea solicitudes explícitamente provenientes de otro origen.
- Las solicitudes de wallet requieren `Idempotency-Key` para evitar duplicados por doble clic o reintentos.
- Los webhooks generan recibos únicos para evitar procesar dos veces el mismo evento.
- Los efectos recuperables se escriben en `outbox_events`; `POST /api/internal/outbox` los procesa con `Authorization: Bearer $CRON_SECRET`.
- El ledger formal exige doble entrada balanceada y no permite editar ni borrar transacciones publicadas.
- La base rechaza saldos negativos, slots fuera del rango 1–10, pagos no positivos y ratings inválidos.
- GitHub Actions ejecuta lint, pruebas, auditoría, compilación y E2E en cada cambio.

## Activación de Yape o Plin

1. Ingresar con la cuenta `owner` y abrir `Finanzas > Cuentas de cobro`.
2. Elegir el método e ingresar exactamente el titular y el celular peruano de nueve dígitos.
3. Subir el QR oficial en PNG, JPEG o WebP y mantener el destino inactivo durante la revisión.
4. Comparar número, titular y QR con la aplicación bancaria usando una transferencia mínima controlada.
5. Cambiar el estado a activo. Desde ese momento aparecerá en la recarga y el backend aceptará comprobantes para ese método.
6. Verificar el evento correspondiente en `audit_logs`.

No activar una cuenta incompleta, de terceros o cuyo QR no haya sido verificado. Para rotarla, cargar primero el nuevo QR y confirmar los datos; el objeto anterior se elimina solamente después de que D1 confirma el cambio.

## Rutina diaria

1. Comprobar que `/api/health` responda `200` y `ok: true`.
2. Revisar solicitudes de recarga y retiro pendientes.
3. Ejecutar `POST /api/staff/reconciliation`.
4. Confirmar que el outbox no tenga eventos `failed` con 10 intentos.
5. Si `status` es `review`, detener nuevas liquidaciones y comparar wallet, retiros pendientes, entradas bloqueadas y ledger.
6. Revisar disputas, verificaciones y alertas de seguridad pendientes.

## Rutina de mantenimiento

Ejecutar `POST /api/staff/maintenance` semanalmente con la cuenta propietaria. La tarea:

- elimina claves de idempotencia vencidas;
- limpia ventanas de rate limiting vencidas;
- elimina recibos antiguos de webhooks;
- borra comprobantes de pago revisados con más de 180 días;
- registra el resultado en la auditoría.

## Antes de una migración

1. Confirmar que GitHub Actions esté en verde.
2. Obtener una exportación o snapshot recuperable de D1 desde el proveedor.
3. Revisar manualmente el SQL nuevo en `drizzle/`.
4. Aplicar primero en un entorno de staging con datos anonimizados.
5. Ejecutar pruebas de humo, conciliación y consultas de integridad.
6. Aplicar en producción durante una ventana controlada.

Nunca editar una migración que ya haya sido aplicada. Una corrección debe introducir una migración posterior.

## Incidente financiero

1. Suspender aprobaciones, retiros y liquidaciones.
2. Guardar el identificador de la operación y el momento del incidente.
3. Ejecutar conciliación sin modificar registros.
4. Consultar `payment_requests`, `wallets`, `ledger_entries` y `audit_logs`.
5. Corregir mediante una operación administrativa trazable; nunca borrar el asiento original.
6. Documentar causa, impacto, corrección y medida preventiva.

## Restauración

La restauración debe ensayarse antes del lanzamiento público:

1. Crear un entorno aislado.
2. Restaurar la copia más reciente de D1 y los objetos correspondientes de R2.
3. Aplicar únicamente migraciones posteriores a la copia.
4. Ejecutar conciliación, pruebas de salud y un recorrido completo de sala.
5. Medir el tiempo de recuperación y registrar cualquier pérdida de datos.

Objetivo inicial recomendado: recuperación en menos de cuatro horas y pérdida máxima de datos de una hora. Estos valores deben revisarse según el volumen real.

## Lanzamiento

No habilitar dinero o partidas reales hasta completar:

- credenciales de producción separadas de desarrollo;
- staging independiente;
- alertas externas sobre salud y errores;
- copia y restauración probadas;
- revisión legal y política de privacidad;
- responsables y escalamiento de incidentes;
- conciliación ejecutada sin diferencias.
