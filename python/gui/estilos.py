"""Colores, tipografía y estilos ttk compartidos por todas las vistas.

Responsable: Leonardo (Dashboard).
"""
from __future__ import annotations

import tkinter as tk
from tkinter import font as tkfont
from tkinter import ttk

from modelos import EstadoPedido

FUENTE = "Segoe UI"
FONDO = "#f4f6f8"
SUPERFICIE = "#ffffff"
BORDE = "#d9e2ec"
TEXTO = "#1f2933"
TEXTO_SUAVE = "#52606d"
PRIMARIO = "#2563eb"
PRIMARIO_HOVER = "#1d4ed8"
PELIGRO = "#b42318"
EXITO = "#14532d"

# (color de fondo de la fila, color del texto). El texto oscuro sobre fondo claro mantiene el contraste.
COLORES_ESTADO: dict[EstadoPedido, tuple[str, str]] = {
    EstadoPedido.PENDIENTE: ("#fff4d6", "#7a5200"),
    EstadoPedido.EN_PROCESO: ("#dbeafe", "#1e3a8a"),
    EstadoPedido.ENVIADO: ("#ede9fe", "#4c1d95"),
    EstadoPedido.ENTREGADO: ("#dcfce7", "#14532d"),
    EstadoPedido.CANCELADO: ("#f1f5f9", "#64748b"),
}


def aplicar(raiz: tk.Tk) -> None:
    """Configura el tema una sola vez, antes de crear los widgets."""
    for nombre in ("TkDefaultFont", "TkTextFont", "TkMenuFont", "TkHeadingFont"):
        tkfont.nametofont(nombre).configure(family=FUENTE, size=10)
    tkfont.nametofont("TkFixedFont").configure(family="Consolas", size=10)
    raiz.configure(background=FONDO)

    estilo = ttk.Style(raiz)
    estilo.theme_use("clam")
    estilo.configure(".", background=FONDO, foreground=TEXTO, bordercolor=BORDE, font=(FUENTE, 10))
    estilo.configure("TFrame", background=FONDO)
    estilo.configure("TLabel", background=FONDO, foreground=TEXTO)
    estilo.configure("Suave.TLabel", foreground=TEXTO_SUAVE)
    estilo.configure("Titulo.TLabel", font=(FUENTE, 18, "bold"))
    estilo.configure("Encabezado.TLabel", font=(FUENTE, 14, "bold"))
    estilo.configure("Total.TLabel", font=(FUENTE, 12, "bold"))
    estilo.configure("TLabelframe", background=FONDO, bordercolor=BORDE, padding=8)
    estilo.configure("TLabelframe.Label", background=FONDO, foreground=TEXTO, font=(FUENTE, 10, "bold"))

    estilo.configure("TButton", padding=(10, 5), background=SUPERFICIE, bordercolor=BORDE)
    estilo.map("TButton", background=[("active", "#e8eef5"), ("disabled", FONDO)],
               foreground=[("disabled", "#9aa5b1")])
    estilo.configure("Primario.TButton", background=PRIMARIO, foreground="white", bordercolor=PRIMARIO)
    estilo.map("Primario.TButton", background=[("active", PRIMARIO_HOVER), ("disabled", "#93b4f5")],
               foreground=[("disabled", "white")])
    estilo.configure("Peligro.TButton", foreground=PELIGRO)

    estilo.configure("Tarjeta.TCheckbutton", background=SUPERFICIE)
    estilo.map("Tarjeta.TCheckbutton", background=[("active", SUPERFICIE)])
    estilo.configure("TEntry", padding=4, fieldbackground=SUPERFICIE)
    estilo.configure("TCombobox", padding=4, fieldbackground=SUPERFICIE)
    estilo.configure("TSpinbox", padding=4, fieldbackground=SUPERFICIE)
    estilo.map("TCombobox", fieldbackground=[("readonly", SUPERFICIE)])

    altura_fila = tkfont.nametofont("TkDefaultFont").metrics("linespace") + 8
    estilo.configure("Treeview", background=SUPERFICIE, fieldbackground=SUPERFICIE, rowheight=altura_fila,
                     bordercolor=BORDE)
    estilo.configure("Treeview.Heading", background="#e4e9f0", foreground=TEXTO, padding=(6, 5),
                     font=(FUENTE, 10, "bold"))
    estilo.map("Treeview", background=[("selected", PRIMARIO)], foreground=[("selected", "white")])
    estilo.configure("Horizontal.TProgressbar", background=PRIMARIO, troughcolor="#e4e9f0",
                     bordercolor=BORDE)


def colorear_filas(tabla: ttk.Treeview) -> None:
    """Crea una etiqueta por estado (nombre del enum) con sus colores."""
    for estado, (fondo, texto) in COLORES_ESTADO.items():
        tabla.tag_configure(estado.name, background=fondo, foreground=texto)


def centrar(ventana: tk.Misc, ancho: int, alto: int) -> None:
    """Dimensiona la ventana (sin pasarse de la pantalla) y la centra."""
    ancho = min(ancho, ventana.winfo_screenwidth() - 40)
    alto = min(alto, ventana.winfo_screenheight() - 80)
    x = (ventana.winfo_screenwidth() - ancho) // 2
    y = max(0, (ventana.winfo_screenheight() - alto) // 2 - 20)
    ventana.geometry(f"{ancho}x{alto}+{x}+{y}")
