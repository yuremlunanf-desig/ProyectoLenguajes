// Generado por dashboard/exportar_estatico.js: copia fija de los datos. No se edita a mano.
window.DATOS_FIJOS = {
  "proyecto": {
    "generado": "2026-11-17T21:11:55.098Z",
    "lenguajes": [
      {
        "lenguaje": "Python",
        "metricas": {
          "lenguaje": "Python",
          "runtime": "Python 3.14.7",
          "modelo_concurrencia": "asyncio (corrutinas con asyncio.gather)",
          "fecha_ejecucion": "2026-11-13T21:00:38",
          "archivo_entrada": "solicitudes_pequenas.json",
          "pedidos": {
            "leidos": 5,
            "registrados": 4,
            "rechazados": 1
          },
          "rechazos": [
            {
              "id": "PED-005",
              "motivo": "El pedido PED-005 tiene una cantidad inválida (0) en el producto WEB-909: debe ser un entero mayor que 0."
            }
          ],
          "retardo_por_transicion_ms": 100,
          "tiempos_ms": {
            "lectura_json": 0.497,
            "validacion_y_calculo": 0.24,
            "consultas_funcionales": 0.035,
            "cambio_estados_secuencial": 973.349,
            "cambio_estados_concurrente": 333.159,
            "total": 1307.912
          },
          "aceleracion_concurrencia": 2.92,
          "ventas": {
            "subtotal": "7548.30",
            "descuentos": "634.11",
            "iva": "1106.27",
            "envio": "340.00",
            "total": "8360.46"
          },
          "consultas": {
            "cliente": "C001",
            "pedidos_del_cliente": [
              "PED-001",
              "PED-004"
            ],
            "pendientes": [
              "PED-001",
              "PED-002"
            ],
            "orden_por_fecha": [
              "PED-002",
              "PED-004",
              "PED-001",
              "PED-003"
            ],
            "orden_por_prioridad": [
              "PED-002",
              "PED-003",
              "PED-001",
              "PED-004"
            ]
          },
          "estados_iniciales": {
            "PENDIENTE": 2,
            "EN_PROCESO": 1,
            "ENVIADO": 1
          },
          "estados_finales": {
            "ENTREGADO": 4
          },
          "detalle_pedidos": [
            {
              "id": "PED-001",
              "cliente": "Ana Torres",
              "prioridad": "MEDIA",
              "tipo_envio": "ESTANDAR",
              "subtotal": "2148.90",
              "descuento": "214.89",
              "iva": "309.44",
              "envio": "50.00",
              "total": "2293.45",
              "estado_inicial": "PENDIENTE",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "PENDIENTE->EN_PROCESO",
                "EN_PROCESO->ENVIADO",
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 332.984
            },
            {
              "id": "PED-002",
              "cliente": "Luis Méndez",
              "prioridad": "ALTA",
              "tipo_envio": "EXPRESS",
              "subtotal": "885.30",
              "descuento": "44.27",
              "iva": "134.56",
              "envio": "120.00",
              "total": "1095.59",
              "estado_inicial": "PENDIENTE",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "PENDIENTE->EN_PROCESO",
                "EN_PROCESO->ENVIADO",
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 332.987
            },
            {
              "id": "PED-003",
              "cliente": "Sofía Ramírez",
              "prioridad": "ALTA",
              "tipo_envio": "EXPRESS",
              "subtotal": "3749.50",
              "descuento": "374.95",
              "iva": "539.93",
              "envio": "120.00",
              "total": "4034.48",
              "estado_inicial": "EN_PROCESO",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "EN_PROCESO->ENVIADO",
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 220.27
            },
            {
              "id": "PED-004",
              "cliente": "Ana Torres",
              "prioridad": "BAJA",
              "tipo_envio": "ESTANDAR",
              "subtotal": "764.60",
              "descuento": "0.00",
              "iva": "122.34",
              "envio": "50.00",
              "total": "936.94",
              "estado_inicial": "ENVIADO",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 108.653
            }
          ]
        },
        "aviso": null,
        "loc": {
          "codigo": 1732,
          "interfaz": 768,
          "logica": 964,
          "pruebas": 147,
          "archivos": 23,
          "archivosPruebas": 4
        }
      },
      {
        "lenguaje": "Java",
        "metricas": {
          "lenguaje": "Java",
          "runtime": "Java 25.0.4",
          "modelo_concurrencia": "hilos (ExecutorService con CompletableFuture)",
          "fecha_ejecucion": "2026-11-13T21:00:53",
          "archivo_entrada": "solicitudes_pequenas.json",
          "pedidos": {
            "leidos": 5,
            "registrados": 4,
            "rechazados": 1
          },
          "rechazos": [
            {
              "id": "PED-005",
              "motivo": "El pedido PED-005 tiene una cantidad inválida (0) en el producto WEB-909: debe ser un entero mayor que 0."
            }
          ],
          "retardo_por_transicion_ms": 100,
          "tiempos_ms": {
            "lectura_json": 63.846,
            "validacion_y_calculo": 9.317,
            "consultas_funcionales": 3.159,
            "cambio_estados_secuencial": 973.618,
            "cambio_estados_concurrente": 326.439,
            "total": 1382.787
          },
          "aceleracion_concurrencia": 2.98,
          "ventas": {
            "subtotal": "7548.30",
            "descuentos": "634.11",
            "iva": "1106.27",
            "envio": "340.00",
            "total": "8360.46"
          },
          "consultas": {
            "cliente": "C001",
            "pedidos_del_cliente": [
              "PED-001",
              "PED-004"
            ],
            "pendientes": [
              "PED-001",
              "PED-002"
            ],
            "orden_por_fecha": [
              "PED-002",
              "PED-004",
              "PED-001",
              "PED-003"
            ],
            "orden_por_prioridad": [
              "PED-002",
              "PED-003",
              "PED-001",
              "PED-004"
            ]
          },
          "estados_iniciales": {
            "PENDIENTE": 2,
            "EN_PROCESO": 1,
            "ENVIADO": 1
          },
          "estados_finales": {
            "ENTREGADO": 4
          },
          "detalle_pedidos": [
            {
              "id": "PED-001",
              "cliente": "Ana Torres",
              "prioridad": "MEDIA",
              "tipo_envio": "ESTANDAR",
              "subtotal": "2148.90",
              "descuento": "214.89",
              "iva": "309.44",
              "envio": "50.00",
              "total": "2293.45",
              "estado_inicial": "PENDIENTE",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "PENDIENTE->EN_PROCESO",
                "EN_PROCESO->ENVIADO",
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 319.401
            },
            {
              "id": "PED-002",
              "cliente": "Luis Méndez",
              "prioridad": "ALTA",
              "tipo_envio": "EXPRESS",
              "subtotal": "885.30",
              "descuento": "44.27",
              "iva": "134.56",
              "envio": "120.00",
              "total": "1095.59",
              "estado_inicial": "PENDIENTE",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "PENDIENTE->EN_PROCESO",
                "EN_PROCESO->ENVIADO",
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 319.364
            },
            {
              "id": "PED-003",
              "cliente": "Sofía Ramírez",
              "prioridad": "ALTA",
              "tipo_envio": "EXPRESS",
              "subtotal": "3749.50",
              "descuento": "374.95",
              "iva": "539.93",
              "envio": "120.00",
              "total": "4034.48",
              "estado_inicial": "EN_PROCESO",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "EN_PROCESO->ENVIADO",
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 211.196
            },
            {
              "id": "PED-004",
              "cliente": "Ana Torres",
              "prioridad": "BAJA",
              "tipo_envio": "ESTANDAR",
              "subtotal": "764.60",
              "descuento": "0.00",
              "iva": "122.34",
              "envio": "50.00",
              "total": "936.94",
              "estado_inicial": "ENVIADO",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 102.147
            }
          ]
        },
        "aviso": null,
        "loc": {
          "codigo": 2866,
          "interfaz": 1409,
          "logica": 1457,
          "pruebas": 201,
          "archivos": 48,
          "archivosPruebas": 4
        }
      },
      {
        "lenguaje": "JavaScript",
        "metricas": {
          "lenguaje": "JavaScript",
          "runtime": "Node.js 24.21.0",
          "modelo_concurrencia": "async/await (promesas con Promise.all)",
          "fecha_ejecucion": "2026-11-13T21:00:40",
          "archivo_entrada": "solicitudes_pequenas.json",
          "pedidos": {
            "leidos": 5,
            "registrados": 4,
            "rechazados": 1
          },
          "rechazos": [
            {
              "id": "PED-005",
              "motivo": "El pedido PED-005 tiene una cantidad inválida (0) en el producto WEB-909: debe ser un entero mayor que 0."
            }
          ],
          "retardo_por_transicion_ms": 100,
          "tiempos_ms": {
            "lectura_json": 3.759,
            "validacion_y_calculo": 0.506,
            "consultas_funcionales": 0.192,
            "cambio_estados_secuencial": 951.578,
            "cambio_estados_concurrente": 333.12,
            "total": 1289.806
          },
          "aceleracion_concurrencia": 2.86,
          "ventas": {
            "subtotal": "7548.30",
            "descuentos": "634.11",
            "iva": "1106.27",
            "envio": "340.00",
            "total": "8360.46"
          },
          "consultas": {
            "cliente": "C001",
            "pedidos_del_cliente": [
              "PED-001",
              "PED-004"
            ],
            "pendientes": [
              "PED-001",
              "PED-002"
            ],
            "orden_por_fecha": [
              "PED-002",
              "PED-004",
              "PED-001",
              "PED-003"
            ],
            "orden_por_prioridad": [
              "PED-002",
              "PED-003",
              "PED-001",
              "PED-004"
            ]
          },
          "estados_iniciales": {
            "PENDIENTE": 2,
            "EN_PROCESO": 1,
            "ENVIADO": 1
          },
          "estados_finales": {
            "ENTREGADO": 4
          },
          "detalle_pedidos": [
            {
              "id": "PED-001",
              "cliente": "Ana Torres",
              "prioridad": "MEDIA",
              "tipo_envio": "ESTANDAR",
              "subtotal": "2148.90",
              "descuento": "214.89",
              "iva": "309.44",
              "envio": "50.00",
              "total": "2293.45",
              "estado_inicial": "PENDIENTE",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "PENDIENTE->EN_PROCESO",
                "EN_PROCESO->ENVIADO",
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 332.996
            },
            {
              "id": "PED-002",
              "cliente": "Luis Méndez",
              "prioridad": "ALTA",
              "tipo_envio": "EXPRESS",
              "subtotal": "885.30",
              "descuento": "44.27",
              "iva": "134.56",
              "envio": "120.00",
              "total": "1095.59",
              "estado_inicial": "PENDIENTE",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "PENDIENTE->EN_PROCESO",
                "EN_PROCESO->ENVIADO",
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 332.957
            },
            {
              "id": "PED-003",
              "cliente": "Sofía Ramírez",
              "prioridad": "ALTA",
              "tipo_envio": "EXPRESS",
              "subtotal": "3749.50",
              "descuento": "374.95",
              "iva": "539.93",
              "envio": "120.00",
              "total": "4034.48",
              "estado_inicial": "EN_PROCESO",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "EN_PROCESO->ENVIADO",
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 217.581
            },
            {
              "id": "PED-004",
              "cliente": "Ana Torres",
              "prioridad": "BAJA",
              "tipo_envio": "ESTANDAR",
              "subtotal": "764.60",
              "descuento": "0.00",
              "iva": "122.34",
              "envio": "50.00",
              "total": "936.94",
              "estado_inicial": "ENVIADO",
              "estado_final": "ENTREGADO",
              "transiciones": [
                "ENVIADO->ENTREGADO"
              ],
              "duracion_ms": 108.959
            }
          ]
        },
        "aviso": null,
        "loc": {
          "codigo": 3212,
          "interfaz": 1492,
          "logica": 1720,
          "pruebas": 148,
          "archivos": 37,
          "archivosPruebas": 4
        }
      }
    ]
  },
  "volumenes": {
    "generado": "2026-11-14T04:32:29.347Z",
    "equipo": {
      "sistema": "Windows_NT 10.0.26200",
      "procesadores": 32,
      "runtimes": {
        "Python": "Python 3.14.7",
        "Java": "Java 25.0.4",
        "JavaScript": "Node.js 24.21.0"
      }
    },
    "retardo_por_transicion_ms": 100,
    "nota": "Cada volumen repite los pedidos de solicitudes_pequenas.json (el 20 % es inválido y se rechaza). El tiempo secuencial crece con el número de pedidos; el concurrente depende de cuántas tareas puede atender a la vez cada lenguaje.",
    "volumenes": [
      5,
      100,
      200,
      300,
      400
    ],
    "totales_coinciden": true,
    "resultados": {
      "Python": [
        {
          "pedidos": 5,
          "registrados": 4,
          "secuencial_ms": 978.176,
          "concurrente_ms": 320.923,
          "aceleracion": 3.05,
          "total_vendido": "8360.46"
        },
        {
          "pedidos": 100,
          "registrados": 80,
          "secuencial_ms": 19316.177,
          "concurrente_ms": 317.522,
          "aceleracion": 60.83,
          "total_vendido": "167209.20"
        },
        {
          "pedidos": 200,
          "registrados": 160,
          "secuencial_ms": 38951.884,
          "concurrente_ms": 323.819,
          "aceleracion": 120.29,
          "total_vendido": "334418.40"
        },
        {
          "pedidos": 300,
          "registrados": 240,
          "secuencial_ms": 58482.542,
          "concurrente_ms": 328.324,
          "aceleracion": 178.12,
          "total_vendido": "501627.60"
        },
        {
          "pedidos": 400,
          "registrados": 320,
          "secuencial_ms": 77922.604,
          "concurrente_ms": 328.735,
          "aceleracion": 237.04,
          "total_vendido": "668836.80"
        }
      ],
      "Java": [
        {
          "pedidos": 5,
          "registrados": 4,
          "secuencial_ms": 909.515,
          "concurrente_ms": 309.218,
          "aceleracion": 2.94,
          "total_vendido": "8360.46"
        },
        {
          "pedidos": 100,
          "registrados": 80,
          "secuencial_ms": 19212.724,
          "concurrente_ms": 1423.732,
          "aceleracion": 13.49,
          "total_vendido": "167209.20"
        },
        {
          "pedidos": 200,
          "registrados": 160,
          "secuencial_ms": 38954.793,
          "concurrente_ms": 2593.44,
          "aceleracion": 15.02,
          "total_vendido": "334418.40"
        },
        {
          "pedidos": 300,
          "registrados": 240,
          "secuencial_ms": 58493.275,
          "concurrente_ms": 3781.218,
          "aceleracion": 15.47,
          "total_vendido": "501627.60"
        },
        {
          "pedidos": 400,
          "registrados": 320,
          "secuencial_ms": 77771.175,
          "concurrente_ms": 5002.56,
          "aceleracion": 15.55,
          "total_vendido": "668836.80"
        }
      ],
      "JavaScript": [
        {
          "pedidos": 5,
          "registrados": 4,
          "secuencial_ms": 976.014,
          "concurrente_ms": 320.486,
          "aceleracion": 3.05,
          "total_vendido": "8360.46"
        },
        {
          "pedidos": 100,
          "registrados": 80,
          "secuencial_ms": 19138.446,
          "concurrente_ms": 318.802,
          "aceleracion": 60.03,
          "total_vendido": "167209.20"
        },
        {
          "pedidos": 200,
          "registrados": 160,
          "secuencial_ms": 38928.411,
          "concurrente_ms": 320.921,
          "aceleracion": 121.3,
          "total_vendido": "334418.40"
        },
        {
          "pedidos": 300,
          "registrados": 240,
          "secuencial_ms": 58452.051,
          "concurrente_ms": 323.684,
          "aceleracion": 180.58,
          "total_vendido": "501627.60"
        },
        {
          "pedidos": 400,
          "registrados": 320,
          "secuencial_ms": 77923.571,
          "concurrente_ms": 325.939,
          "aceleracion": 239.07,
          "total_vendido": "668836.80"
        }
      ]
    }
  }
};
