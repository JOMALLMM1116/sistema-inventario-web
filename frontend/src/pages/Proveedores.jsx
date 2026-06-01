// src/pages/Proveedores.jsx
import CrudModulo from "../components/CrudModulo";
import {
  listarProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
} from "../services/api";

export default function Proveedores() {
  return (
    <CrudModulo
      titulo="Proveedores"
      idCampo="id_proveedor"
      claveLista="proveedores"
      columnas={[
        { clave: "nombre", etiqueta: "Nombre" },
        { clave: "contacto", etiqueta: "Contacto" },
        { clave: "email", etiqueta: "Email" },
        { clave: "telefono", etiqueta: "Telefono" },
        { clave: "nit", etiqueta: "NIT" },
      ]}
      campos={[
        { clave: "nombre", etiqueta: "Nombre" },
        { clave: "contacto", etiqueta: "Persona de contacto" },
        { clave: "telefono", etiqueta: "Telefono" },
        { clave: "email", etiqueta: "Email", tipo: "email" },
        { clave: "direccion", etiqueta: "Direccion" },
        { clave: "nit", etiqueta: "NIT" },
      ]}
      cargarLista={listarProveedores}
      crear={crearProveedor}
      actualizar={actualizarProveedor}
      eliminar={eliminarProveedor}
    />
  );
}
