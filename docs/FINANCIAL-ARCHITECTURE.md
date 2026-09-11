# Arquitectura financiera operativa de TENE

## Flujo principal

`API Route → autorización por permiso → servicio de aplicación → dominio → repositorio/D1`

La wallet es una proyección rápida para la interfaz. La fuente contable formal está formada por:

- `ledger_accounts`: plan de cuentas en PEN.
- `ledger_transactions`: operación contable en estado `draft`, `posted` o `reversed`.
- `ledger_entries`: débitos y créditos positivos asociados a una transacción.
- `outbox_events`: trabajo durable que puede reintentarse después de una falla parcial.
- `payment_destinations`: cuentas oficiales Yape/Plin visibles para el jugador, versionadas y activables por el propietario.

Una transacción solamente puede pasar a `posted` si tiene como mínimo dos asientos y la suma de débitos es igual a la suma de créditos. D1 impide modificar o borrar sus asientos una vez publicada. Una corrección crea una transacción inversa; nunca altera el historial.

Los registros históricos anteriores a la migración 0027 permanecen como asientos heredados sin `transaction_id`. No se reescriben automáticamente porque una reconstrucción contable exige conciliarlos contra los comprobantes reales.

## Idempotencia

`idempotency_keys` conserva el hash canónico de la solicitud, el código HTTP y el cuerpo original. Repetir clave y payload devuelve exactamente la respuesta previa. Reutilizar la clave con otro payload produce `409 idempotency_payload_conflict`.

## Webhooks

MatchZy admite HMAC-SHA256 sobre `timestamp.body` con ventana de cinco minutos y los encabezados:

- `x-matchzy-signature`
- `x-matchzy-timestamp`
- `x-matchzy-event-id`

Durante la transición se conserva la autenticación heredada `x-matchzy-secret`. DataHost mantiene su token Bearer y registra el identificador externo cuando lo entrega. Ambos guardan `payload_hash`; cien repeticiones causan un solo efecto.

## Permisos financieros

La autorización se evalúa por permiso y admite override individual `allow`/`deny`:

- `payment.review`
- `withdrawal.approve`
- `ledger.read`
- `ledger.adjust`
- `reconciliation.run`
- `reconciliation.close`
- `audit.read`
- `payment.destination.manage`

El rol `admin` no obtiene aprobación de retiros ni ajustes contables por defecto. `owner` conserva todos los permisos. Los overrides explícitos tienen prioridad.

## Cuentas oficiales de cobro

El teléfono, titular, método y estado se guardan en D1. La imagen QR se almacena en R2 y se entrega mediante una ruta controlada; no forma parte del repositorio. Solo `owner` puede crear, reemplazar, activar o desactivar un destino. Cada cambio incrementa su versión, invalida la caché del QR y genera auditoría con el teléfono enmascarado.

Una recarga se rechaza si el método elegido no tiene un destino activo. El servidor valida tanto el MIME como la firma binaria PNG, JPEG o WebP del comprobante y registra su SHA-256 en R2 para preservar evidencia.

## Recuperación y conciliación

Los efectos posteriores a una aprobación se escriben primero en `outbox_events` dentro del mismo batch. El procesador `POST /api/internal/outbox`, protegido por `CRON_SECRET`, reintenta y materializa el ledger. También puede ejecutarlo manualmente el owner desde mantenimiento.

La conciliación compara wallet, ledger, solicitudes y movimientos externos. Genera detalle por operación con estados `MATCHED`, `MISSING_INTERNAL`, `MISSING_EXTERNAL`, `AMOUNT_MISMATCH`, `DUPLICATE`, `PENDING` o `MANUAL_REVIEW`.

## Evidencia reproducible

```bash
npm test
npm run test:db
npm run build
npm audit --audit-level=high
docker compose -f compose.test.yml run --rm tene-tests
```

Las pruebas incluyen propiedades generativas con `fast-check`, capacidad y unicidad concurrente de salas, límites monetarios, publicación balanceada e inmutabilidad del ledger.
