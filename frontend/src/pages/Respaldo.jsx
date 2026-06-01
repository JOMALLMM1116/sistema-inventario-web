// src/pages/Respaldo.jsx
// Modulo de respaldo y recuperacion.
// - Backup: se hace desde la app (boton) invocando sp_respaldar_base.
// - Restauracion: NO se automatiza (es delicado y no se puede mientras la app
//   esta conectada a la base). Se muestran las instrucciones para hacerlo
//   desde SSMS, que es la practica correcta y segura.

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/respaldo.css";

export default function Respaldo() {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState(null); // {tipo, texto, ruta}
  const [cargando, setCargando] = useState(false);

  async function respaldar() {
    setEstado(null);
    setCargando(true);
    try {
      const resp = await fetch("http://localhost:8080/api/backup.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: usuario.id }),
      });
      const data = await resp.json();
      if (data.status !== "success") throw new Error(data.message);
      setEstado({ tipo: "exito", texto: data.message, ruta: data.ruta });
    } catch (e) {
      setEstado({ tipo: "error", texto: e.message });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <div className="inv-encabezado">
        <h1 className="inv-titulo">Respaldo y recuperacion</h1>
      </div>

      {/* Tarjeta de backup */}
      <div className="resp-tarjeta">
        <div className="resp-icono">{"\u26C3"}</div>
        <h2>Generar respaldo</h2>
        <p>
          Crea una copia de seguridad completa de la base de datos. El archivo se
          guarda en <code>C:\CopiasSQL\</code> en el servidor, con la fecha y hora
          en el nombre. El evento queda registrado en la bitacora de auditoria.
        </p>

        {estado && (
          <div className={estado.tipo === "exito" ? "resp-ok" : "resp-error"}>
            {estado.texto}
            {estado.ruta && (
              <div className="resp-ruta">
                Archivo: <code>{estado.ruta}</code>
              </div>
            )}
          </div>
        )}

        <button className="crud-boton-nuevo" onClick={respaldar} disabled={cargando}>
          {cargando ? "Generando respaldo..." : "Realizar respaldo ahora"}
        </button>
      </div>

      {/* Tarjeta de recuperacion (instructivo) */}
      <div className="resp-tarjeta">
        <div className="resp-icono">{"\u21BA"}</div>
        <h2>Restaurar la base de datos</h2>
        <p>
          La restauracion no se realiza desde la aplicacion por seguridad: no se
          puede restaurar una base mientras hay conexiones activas usandola, y un
          restore mal hecho puede sobrescribir datos. Por eso se hace de forma
          controlada desde SQL Server Management Studio (SSMS):
        </p>
        <ol className="resp-pasos">
          <li>Abrir SSMS y conectarse a la instancia del servidor.</li>
          <li>
            Click derecho sobre <b>Databases</b> {"\u2192"} <b>Restore Database...</b>
          </li>
          <li>
            En <b>Source</b>, elegir <b>Device</b> y seleccionar el archivo{" "}
            <code>.bak</code> de <code>C:\CopiasSQL\</code>.
          </li>
          <li>
            En <b>Options</b>, marcar <i>Close existing connections to destination
            database</i> para evitar el bloqueo por conexiones activas.
          </li>
          <li>Confirmar con <b>OK</b> y esperar a que termine.</li>
        </ol>
        <p className="resp-nota">
          Tambien existe recuperacion a nivel de registros desde la bitacora de
          auditoria, para revertir cambios puntuales sin restaurar toda la base.
        </p>
      </div>
    </div>
  );
}
