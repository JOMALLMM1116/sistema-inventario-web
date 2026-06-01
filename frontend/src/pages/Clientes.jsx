// src/pages/Clientes.jsx
import CrudModulo from "../components/CrudModulo";
import {
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "../services/api";

export default function Clientes() {
  return (
    <CrudModulo
      titulo="Clientes"
      idCampo="id_cliente"
      claveLista="clientes"
      columnas={[
        { clave: "nombre", etiqueta: "Nombre" },
        { clave: "apellido", etiqueta: "Apellido" },
        { clave: "email", etiqueta: "Email" },
        { clave: "telefono", etiqueta: "Telefono" },
        { clave: "nit", etiqueta: "NIT" },
        { clave: "tipo_cliente", etiqueta: "Tipo" },
      ]}
      campos={[
        { clave: "nombre", etiqueta: "Nombre" },
        { clave: "apellido", etiqueta: "Apellido" },
        { clave: "telefono", etiqueta: "Telefono" },
        { clave: "email", etiqueta: "Email", tipo: "email" },
        { clave: "direccion", etiqueta: "Direccion" },
        { clave: "nit", etiqueta: "NIT" },
        { clave: "tipo_cliente", etiqueta: "Tipo de cliente", opciones: ["regular", "mayorista", "vip"] },
      ]}
      cargarLista={listarClientes}
      crear={crearCliente}
      actualizar={actualizarCliente}
      eliminar={eliminarCliente}
    />
  );
}
