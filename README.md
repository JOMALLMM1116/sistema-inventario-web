# Sistema de Gestion de Ventas, Inventario y Atencion al Cliente

Sistema full-stack para una empresa comercial, desarrollado como proyecto
unificado de **Analisis de Sistemas** y **Bases de Datos en SQL Server**.
Toda la logica de negocio vive en SQL Server (stored procedures, funciones,
triggers, transacciones); la aplicacion solo invoca esa logica.

---

## Stack tecnologico

- **Base de datos:** SQL Server (Express)
- **Backend / API:** PHP 8.3 (extension `sqlsrv`)
- **Frontend:** React + Vite
- **IA / Prediccion:** Python 3 con scikit-learn
- **Control de versiones:** Git / GitHub

---

## Caracteristicas principales

### Seguridad
- Autenticacion con usuario y contrasena (hash SHA-256 en SQL Server).
- Roles diferenciados: Administrador, Gerente, Vendedor, Inventario, Compras, Reportes.
- Seguridad en tres capas: menu filtrado por rol, rutas protegidas en el frontend
  y validacion de rol en los stored procedures.
- Bitacora de auditoria que registra inicios de sesion, inserciones,
  modificaciones y eliminaciones.

### Modulos
- **Inventario:** listado de productos con estados de stock (disponible, bajo, sin stock).
- **Catalogos (Clientes, Proveedores, Categorias):** CRUD completo con filtro de
  activos / inactivos.
- **Ventas:** registro con carrito y total en vivo, mas historial.
- **Compras:** registro con carrito e historial (valida que el producto este
  asociado al proveedor).
- **Atencion al cliente:** registro, consulta y cierre de casos.
- **Movimientos:** historial de ajustes de inventario.
- **Reportes:** consultas con CTE, graficos y exportacion a PDF y Excel.
- **Respaldo:** backup de la base de datos desde la aplicacion.
- **Monitoreo de rendimiento:** medicion de tiempos de ejecucion de consultas, con indices.
- **Prediccion (IA):** modelo de regresion lineal (scikit-learn) que predice las
  ventas del proximo mes a partir del historial.
- **Analisis OLAP:** analisis multidimensional sobre un Data Warehouse (esquema
  estrella con una tabla de hechos y cuatro dimensiones).

---

## Estructura del proyecto

```
sistema-inventario-web/
├── backend/
│   ├── api/            endpoints PHP (invocan los stored procedures)
│   ├── config/         conexion a la base de datos
│   ├── lib/            helpers (respuesta JSON, carga de .env)
│   ├── ia/             script Python de prediccion
│   └── .env            credenciales (NO se sube al repo)
├── frontend/
│   └── src/
│       ├── components/ Layout, componentes reutilizables
│       ├── context/    autenticacion y tema
│       ├── pages/      una pagina por modulo
│       ├── services/   cliente de la API
│       └── styles/     temas y estilos
└── (scripts SQL del proyecto, ejecutados en SSMS)
```

---

## Requisitos previos

- SQL Server (Express o superior) con la base de datos creada y los scripts ejecutados.
- PHP 8.3 con las extensiones `sqlsrv` y `pdo_sqlsrv`.
- ODBC Driver 17/18 for SQL Server.
- Node.js (v18 o superior).
- Python 3 con `scikit-learn`, `pandas` y `pyodbc` (para el modulo de prediccion).

> La guia detallada de instalacion del entorno (PHP, drivers, configuracion)
> esta en `CONFIGURACION_BACKEND.md`.

---

## Instalacion y ejecucion

### 1. Base de datos
Ejecutar los scripts SQL en SSMS en orden para crear la base, las tablas,
los stored procedures, los datos de prueba, el Data Warehouse y demas objetos.

### 2. Backend
```bash
cd backend
copy .env.example .env      # luego editar .env con tus credenciales
php -S localhost:8080       # levanta la API en el puerto 8080
```

El archivo `.env` define la conexion:
```
DB_SERVER=TU_INSTANCIA
DB_DATABASE=SistemaInventario
DB_UID=usuario        # vacio para autenticacion de Windows
DB_PWD=password
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # levanta la app en http://localhost:5173
```

Se necesitan ambos servidores corriendo a la vez: el backend (8080) y el
frontend (5173).

### 4. Modulo de prediccion (opcional)
```bash
pip install scikit-learn pandas pyodbc
```
El script `backend/ia/prediccion_ventas.py` se ejecuta automaticamente desde la
app al generar una prediccion.

---

## Usuarios de prueba

| Rol           | Email                        | Contrasena |
|---------------|------------------------------|------------|
| Administrador | manuel.lopez@empresa.com     | Admin123   |
| Vendedor      | ana.gomez@empresa.com        | Vende123   |
| Inventario    | lucia.morales@empresa.com    | Inven123   |
| Compras       | jorge.castillo@empresa.com   | Compra123  |
| Gerente       | maria.hernandez@empresa.com  | Geren123   |
| Reportes      | pedro.diaz@empresa.com       | Repor123   |

---

## Principio de diseno

Toda la logica de negocio (transacciones, validaciones, calculos, auditoria)
reside en SQL Server mediante stored procedures. El backend PHP unicamente los
invoca y devuelve la respuesta en JSON; el frontend React consume esa API. Asi,
las reglas del negocio se centralizan en la base de datos y no se reimplementan
en las capas superiores.