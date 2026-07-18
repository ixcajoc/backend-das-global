-- Script para la base de datos DAS Global
-- Estructura: empresa -> sucursales -> colaboradores

CREATE DATABASE das_global;

-- Tabla empresa
CREATE TABLE empresa (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(255) NOT NULL,
    pais    VARCHAR(255)
);

-- Tabla sucursal (relación con empresa)
CREATE TABLE sucursal (
    id          SERIAL PRIMARY KEY,
    empresa_id  INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nombre      VARCHAR(255) NOT NULL,
    direccion   VARCHAR(255),
    telefono    VARCHAR(50)
);

-- Tabla colaborador (relación con sucursal)
CREATE TABLE colaborador (
    id           SERIAL PRIMARY KEY,
    sucursal_id  INTEGER NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
    nombre       VARCHAR(255) NOT NULL,
    cui          VARCHAR(50)
);

