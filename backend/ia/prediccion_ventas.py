#!/usr/bin/env python
# backend/ia/prediccion_ventas.py
#
# Modelo predictivo de tendencia de ventas.
# Esta es la "mitad Python" de la IA: lee el historial de ventas por mes desde
# SQL Server, entrena una regresion lineal (scikit-learn) para aprender la
# tendencia, predice el proximo mes, y guarda el resultado de vuelta en SQL.
#
# SQL Server sirve los datos y guarda la prediccion (SP). Python solo calcula.
#
# Uso:  python prediccion_ventas.py <id_usuario>
#   <id_usuario> = el usuario que dispara la prediccion (debe ser gerencia/admin)
#
# Lee las credenciales del backend/.env para no hardcodearlas.

import sys
import os
import json

import pyodbc
import numpy as np
from sklearn.linear_model import LinearRegression


def cargar_env():
    """Lee backend/.env (esta en la carpeta padre de /ia)."""
    env = {}
    ruta = os.path.join(os.path.dirname(__file__), "..", ".env")
    ruta = os.path.abspath(ruta)
    if not os.path.exists(ruta):
        raise FileNotFoundError(f"No se encontro .env en {ruta}")
    with open(ruta, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not linea or linea.startswith("#") or "=" not in linea:
                continue
            clave, valor = linea.split("=", 1)
            env[clave.strip()] = valor.strip()
    return env


def conectar(env):
    """Abre conexion a SQL Server con los datos del .env."""
    server = env.get("DB_SERVER", "")
    base = env.get("DB_DATABASE", "")
    uid = env.get("DB_UID", "")
    pwd = env.get("DB_PWD", "")

    # si hay usuario/clave, login SQL; si no, autenticacion de Windows
    if uid:
        cadena = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};DATABASE={base};UID={uid};PWD={pwd};"
            f"TrustServerCertificate=yes;"
        )
    else:
        cadena = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};DATABASE={base};Trusted_Connection=yes;"
            f"TrustServerCertificate=yes;"
        )
    return pyodbc.connect(cadena)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Falta el id_usuario como argumento."}))
        return

    id_usuario = int(sys.argv[1])

    try:
        env = cargar_env()
        conn = conectar(env)
        cur = conn.cursor()

        # 1. LEER los datos historicos (ventas por mes) via el SP
        cur.execute("{CALL sp_datos_entrenamiento_ventas (?)}", id_usuario)
        filas = cur.fetchall()

        # necesitamos al menos 2 meses para trazar una tendencia
        if len(filas) < 2:
            print(json.dumps({
                "error": "No hay suficientes datos historicos para predecir "
                         "(se necesitan al menos 2 meses con ventas)."
            }))
            return

        # armar los vectores: X = periodo (1,2,3...), y = total del mes
        periodos = np.array([int(f.periodo) for f in filas]).reshape(-1, 1)
        totales = np.array([float(f.total_mes) for f in filas])

        # 2. ENTRENAR la regresion lineal (aprende la tendencia)
        modelo = LinearRegression()
        modelo.fit(periodos, totales)

        # 3. PREDECIR el proximo periodo
        siguiente = np.array([[int(periodos[-1][0]) + 1]])
        prediccion = float(modelo.predict(siguiente)[0])
        if prediccion < 0:
            prediccion = 0.0

        # R^2 como medida de que tan bien ajusta el modelo (0 a 1)
        r2 = float(modelo.score(periodos, totales))
        # lo usamos como "probabilidad"/confianza (acotado 0..1)
        confianza = max(0.0, min(1.0, r2))

        # texto descriptivo de la tendencia
        pendiente = float(modelo.coef_[0])
        if pendiente > 0:
            tendencia = "creciente"
        elif pendiente < 0:
            tendencia = "decreciente"
        else:
            tendencia = "estable"

        etiqueta = f"Ventas proximo mes (tendencia {tendencia})"
        detalles = json.dumps({
            "meses_analizados": len(filas),
            "pendiente_mensual": round(pendiente, 2),
            "r2": round(r2, 4),
            "historico": [
                {"periodo": int(f.periodo), "anio": int(f.anio),
                 "mes": int(f.mes), "total": float(f.total_mes)}
                for f in filas
            ],
        })

        # 4. GUARDAR la prediccion via el SP
        cur.execute(
            "{CALL sp_guardar_prediccion (?, ?, ?, ?, ?)}",
            id_usuario, prediccion, etiqueta, confianza, detalles,
        )
        conn.commit()

        print(json.dumps({
            "ok": True,
            "valor_predicho": round(prediccion, 2),
            "etiqueta": etiqueta,
            "confianza": round(confianza, 4),
            "tendencia": tendencia,
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()
