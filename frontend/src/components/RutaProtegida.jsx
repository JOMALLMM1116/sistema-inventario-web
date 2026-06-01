// src/components/RutaProtegida.jsx
// Envuelve una pagina y solo la muestra si el rol del usuario esta permitido.
// Si el rol no tiene acceso, muestra un aviso (no la pagina). Asi, aunque
// alguien escriba la URL a mano, no puede entrar a un modulo que no le toca.

import { useAuth } from "../context/AuthContext";

export default function RutaProtegida({ roles, children }) {
  const { usuario } = useAuth();

  // si no hay roles definidos, cualquiera con sesion entra
  const permitido = !roles || roles.includes(usuario?.rol);

  if (!permitido) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "var(--texto-suave)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{"\u26D4"}</div>
        <h2 style={{ fontFamily: "Fraunces, serif", color: "var(--texto)", marginBottom: 10 }}>
          Acceso restringido
        </h2>
        <p>Tu rol ({usuario?.rol}) no tiene permiso para ver este modulo.</p>
      </div>
    );
  }

  return children;
}
