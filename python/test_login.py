"""Prueba del login (autenticacion.py y ControladorLogin).

Responsable: Ian (Login).

Ejecutar desde la carpeta python/:  python -m pytest -v
"""
from __future__ import annotations

from pathlib import Path

import pytest

from autenticacion import AutenticacionError, ServicioAutenticacion
from gui.controlador_login import CamposIncompletosError, ControladorLogin

RUTA_USUARIOS = Path(__file__).resolve().parent.parent / "datos" / "usuarios.json"


def test_login_acepta_al_usuario_valido_y_rechaza_los_demas_casos():
    servicio = ServicioAutenticacion(RUTA_USUARIOS)

    assert servicio.autenticar("admin", "1234").nombre == "Administrador"
    with pytest.raises(AutenticacionError, match="incorrectos"):
        servicio.autenticar("admin", "contraseña-mala")
    with pytest.raises(AutenticacionError, match="incorrectos"):
        servicio.autenticar("nadie", "1234")
    with pytest.raises(CamposIncompletosError):  # usuario y contraseña vacíos
        ControladorLogin(servicio).iniciar_sesion("", "")
