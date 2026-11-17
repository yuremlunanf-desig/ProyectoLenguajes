/**
 * Pantalla de login: valida los campos, llama a POST /api/login y muestra los errores como alertas.
 *
 * Responsable: Ian (Login).
 */
import { api, avisarCampo, mostrarError } from './comun.js';

const formulario = document.getElementById('form-login');
const campoUsuario = document.getElementById('usuario');
const campoContrasena = document.getElementById('contrasena');
const mostrar = document.getElementById('mostrar');
const boton = document.getElementById('btn-ingresar');

mostrar.addEventListener('change', () => {
  campoContrasena.type = mostrar.checked ? 'text' : 'password';
});

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const usuario = campoUsuario.value.trim();
  const contrasena = campoContrasena.value;

  // Validación en el navegador (respuesta inmediata); el servidor vuelve a validar.
  if (usuario === '' && contrasena === '') {
    avisarCampo(campoUsuario, 'Escribe tu usuario y tu contraseña.');
    return;
  }
  if (usuario === '') {
    avisarCampo(campoUsuario, 'Escribe tu usuario.');
    return;
  }
  if (contrasena === '') {
    avisarCampo(campoContrasena, 'Escribe tu contraseña.');
    return;
  }

  boton.disabled = true; // evita enviar dos veces mientras el servidor verifica
  try {
    await api('/api/login', { metodo: 'POST', cuerpo: { usuario, contrasena }, sinRedireccion: true });
    location.assign('/dashboard.html');
  } catch (error) {
    mostrarError(error);
    campoContrasena.value = '';
    campoContrasena.focus();
    boton.disabled = false;
  }
});

// Si ya había una sesión abierta no hace falta volver a escribir la contraseña.
api('/api/sesion', { sinRedireccion: true })
  .then(() => location.replace('/dashboard.html'))
  .catch(() => {});
