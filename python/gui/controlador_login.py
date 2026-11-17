"""Controlador del login.

Responsable: Ian (Login).
"""
from __future__ import annotations

from autenticacion import AutenticacionError, ServicioAutenticacion, Usuario


class CamposIncompletosError(AutenticacionError):
    """Falta el usuario o la contraseña: no se llega a consultar el archivo de usuarios."""


class ControladorLogin:
    def __init__(self, servicio: ServicioAutenticacion) -> None:
        self._servicio = servicio

    def iniciar_sesion(self, usuario: str, contrasena: str) -> Usuario:
        """Devuelve el usuario autenticado o lanza una AutenticacionError con el motivo."""
        if not usuario.strip() or not contrasena:
            raise CamposIncompletosError("Escribe tu usuario y tu contraseña.")
        return self._servicio.autenticar(usuario, contrasena)
