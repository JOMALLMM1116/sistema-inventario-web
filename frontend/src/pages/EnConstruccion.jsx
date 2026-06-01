// src/pages/EnConstruccion.jsx
// Placeholder para los modulos que todavia no se han construido.
// Recibe el nombre del modulo para mostrarlo.

export default function EnConstruccion({ nombre }) {
  return (
    <div style={{ padding: 60, textAlign: "center", color: "var(--texto-suave)" }}>
      <div
        style={{
          fontSize: 40,
          marginBottom: 16,
          fontFamily: "Fraunces, serif",
          color: "var(--texto)",
        }}
      >
        {nombre}
      </div>
      <p>Este modulo esta en construccion.</p>
      <p style={{ fontSize: 13, marginTop: 8 }}>
        El backend ya tiene el endpoint listo; falta conectar la interfaz.
      </p>
    </div>
  );
}
