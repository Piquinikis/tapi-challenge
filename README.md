# tapi-challenge


## Contexto:

- Tenemos una base de datos con una tabla que guarda N registros, distinguidos por proveedor.
- Cada registro de la tabla indica que hay que hacer una consulta específica a una API interna.
- Evitar que dos consultas al mismo proveedor se ejecuten al mismo tiempo (no concurrencia por proveedor).
- Las consultas deben hacerse de manera distribuida a lo largo del día, no todas juntas.
- Almacenar los resultados y gestionar los errores.

## Necesidades que necesitamos resolver:
- Escalabilidad:
El proceso tiene que funcionar tanto con 1K como con 1 millón de registros.
- Distribución temporal:
No conviene lanzar todas las consultas al mismo tiempo (por carga, costos o límites de la API).
- No concurrencia por proveedor:
Si varios registros usan el mismo proveedor, NO pueden ejecutarse consultas a ese proveedor en paralelo, osea que no haya solapamientos.
- Reintentos inteligentes:
Ante errores temporales (red, timeout), el sistema debe poder reintentar.
Ante errores definitivos (datos defectuosos), debe dejar de intentar y registrar el fallo para análisis.
- Trazabilidad y persistencia:
Es importante guardar todos los resultados para poder revisar qué paso con cada consulta.

## Proposal
La propuesta para poder afrontar los requerimientos mencionados anteriormente, es la siguiente:
- Disparar un proceso diario utilizamos EventBridge Scheduler, el cual nos permite programar la tarea para la ejecución.
- Configurar EventBridge con una Lambda. Entonces al invocar la función la misma lee todos los registros en estado `pending` desde la base de datos.
- Por cada registro, se envía un mensaje a una cola SQS del tipo FIFO. Este tipo de queue nos facilita la unicidad de mensajes, entonces podemos usar el provider como unico (MessageGroupId = provider_id).
- Procesamos los mensajes de la queue con otra Lambda, la cual realiza la request a la API, y evaluan el resultado.
    - Si la API falla, debemos evaluar el error recibido.
    - Si el error es transitorio (timeout red, error 5xx del sistema), la Lambda puede reintentar internamente (exponential backoff) antes de fallar en serio.
    - Si el limite de reintentos es superado, es un error "irrecuperable" y el mensaje es enviado a una Dead Letter Queue.
    - Si obtenemos una respuesta exitosa de la API se postea un mensaje en un tópico de SNS.
- Los mensajes que se postean al SNS son encolados en SQS y procesados por otra Lambda.
- Esta Lambda evalua el tipo de mensaje:
    - Si es exitoso, actualiza el registro en la base de datos cambiando su estado a `success` por ejemplo.
    - Además, almacena el resultado en otra base de datos.

![alt text](/images/diagram-1.png "Proposal")