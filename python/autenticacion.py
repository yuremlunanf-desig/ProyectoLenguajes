"""Control de acceso: valida usuario y contraseña contra datos/usuarios.json.

Responsable: Ian (Login).

Versión sencilla para estudiar: usuarios.json guarda las contraseñas en texto plano y aquí se
comparan tal cual. Es solo para este proyecto académico: en un sistema real nunca se guarda la
contraseña así, se guarda un hash.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


class AutenticacionError(Exception):
    """No se puede entrar, o el archivo de usuarios no se puede leer. El mensaje se muestra tal cual."""


@dataclass(frozen=True)
class Usuario:
    usuario: str
    nombre: str


class ServicioAutenticacion:
    def __init__(self, ruta: str | Path) -> None:
        """Lee usuarios.json. Si no existe o está mal escrito lanza AutenticacionError."""
        try:
            with open(ruta, encoding="utf-8") as archivo:
                datos = json.load(archivo)
            self.usuarios = datos["usuarios"]
        except FileNotFoundError:
            raise AutenticacionError(f"No se encontró el archivo de usuarios: {ruta}") from None
        except (ValueError, KeyError, TypeError):
            raise AutenticacionError(f"El archivo de usuarios {ruta} tiene un formato inválido.") from None

    def autenticar(self, usuario: str, contrasena: str) -> Usuario:
        """Devuelve el usuario si el nombre y la contraseña coinciden; si no, lanza AutenticacionError."""
        for registro in self.usuarios:
            if registro.get("usuario") == usuario.strip() and registro.get("password") == contrasena:
                return Usuario(registro["usuario"], registro.get("nombre", registro["usuario"]))
        raise AutenticacionError("Usuario o contraseña incorrectos.")
