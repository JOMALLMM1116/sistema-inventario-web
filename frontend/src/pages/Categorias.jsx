// src/pages/Categorias.jsx
import CrudModulo from "../components/CrudModulo";
import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../services/api";

export default function Categorias() {
  return (
    <CrudModulo
      titulo="Categorias"
      idCampo="id_categoria"
      claveLista="categorias"
      columnas={[
        { clave: "nombre", etiqueta: "Nombre" },
        { clave: "descripcion", etiqueta: "Descripcion" },
      ]}
      campos={[
        { clave: "nombre", etiqueta: "Nombre" },
        { clave: "descripcion", etiqueta: "Descripcion" },
      ]}
      cargarLista={listarCategorias}
      crear={crearCategoria}
      actualizar={actualizarCategoria}
      eliminar={eliminarCategoria}
    />
  );
}
