// src/pages/Login.jsx
// Pantalla de inicio de sesion. Diseno partido: panel de marca a la izquierda,
// formulario a la derecha. Conectado al backend real (login.php).

import { useState } from "react";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTema } from "../context/useTema";
import "../styles/login.css";

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [tema, setTema] = useTema();

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");

    // validacion minima antes de llamar a la API
    if (!email || !contrasena) {
      setError("Ingresa tu email y contrasena.");
      return;
    }

    setCargando(true);
    try {
      const resp = await login(email, contrasena);
      // login.php devuelve el usuario dentro de resp.usuario
      iniciarSesion(resp.usuario);
      // (al iniciar sesion, App mostrara el sistema en vez del login)
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-pantalla">
      {/* Panel izquierdo: marca */}
      <div className="login-marca">
        <div className="login-marca-contenido">
          <div className="login-logo">SI</div>
          <h1 className="login-titulo">Sistema de Inventario</h1>
          <p className="login-subtitulo">
            Gestion de ventas, inventario y atencion al cliente
          </p>
        </div>
        <div className="login-marca-pie">
          Toda la operacion de tu empresa, en un solo lugar.
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="login-formulario-lado">
        {/* selector de tema arriba a la derecha */}
        <div className="login-tema">
          {["claro", "oscuro", "gris"].map((t) => (
            <button
              key={t}
              type="button"
              className={tema === t ? "activo" : ""}
              onClick={() => setTema(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <form className="login-formulario" onSubmit={manejarSubmit}>
          <h2>Bienvenido</h2>
          <p className="login-instruccion">Inicia sesion para continuar</p>

          {error && <div className="login-error">{error}</div>}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              autoComplete="username"
            />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="********"
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="login-boton" disabled={cargando}>
            {cargando ? "Ingresando..." : "Iniciar sesion"}
          </button>
        </form>
      </div>
    </div>
  );
}
