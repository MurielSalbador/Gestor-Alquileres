-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('DUENO', 'INQUILINO', 'GARANTE');

-- CreateEnum
CREATE TYPE "TipoPropiedad" AS ENUM ('DEPARTAMENTO', 'CASA', 'LOCAL', 'OFICINA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoIndice" AS ENUM ('ICL', 'IPC', 'CASA_PROPIA', 'FIJO');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('ARS', 'USD');

-- CreateEnum
CREATE TYPE "EstadoAjuste" AS ENUM ('aplicado', 'pendiente', 'sin_datos');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('pendiente', 'pagado', 'vencido');

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoPersona" NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propiedad" (
    "id" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "tipo" "TipoPropiedad" NOT NULL,
    "propietarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "propiedadId" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "garanteId" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "montoInicial" DECIMAL(14,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'ARS',
    "indice" "TipoIndice" NOT NULL,
    "frecuenciaMeses" INTEGER NOT NULL,
    "porcentajeFijo" DECIMAL(6,2),
    "diaPago" INTEGER NOT NULL DEFAULT 10,
    "comisionPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ajuste" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "montoAnterior" DECIMAL(14,2) NOT NULL,
    "coeficiente" DECIMAL(10,6) NOT NULL,
    "montoNuevo" DECIMAL(14,2) NOT NULL,
    "estado" "EstadoAjuste" NOT NULL,

    CONSTRAINT "Ajuste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "periodo" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "estado" "EstadoPago" NOT NULL DEFAULT 'pendiente',
    "reciboUrl" TEXT,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValorIndice" (
    "id" TEXT NOT NULL,
    "tipo" "TipoIndice" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(14,6) NOT NULL,

    CONSTRAINT "ValorIndice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liquidacion" (
    "id" TEXT NOT NULL,
    "propietarioId" TEXT NOT NULL,
    "periodo" TIMESTAMP(3) NOT NULL,
    "bruto" DECIMAL(14,2) NOT NULL,
    "comision" DECIMAL(14,2) NOT NULL,
    "neto" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "Liquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Propiedad_propietarioId_idx" ON "Propiedad"("propietarioId");

-- CreateIndex
CREATE INDEX "Contrato_propiedadId_idx" ON "Contrato"("propiedadId");

-- CreateIndex
CREATE INDEX "Contrato_inquilinoId_idx" ON "Contrato"("inquilinoId");

-- CreateIndex
CREATE INDEX "Contrato_fechaFin_idx" ON "Contrato"("fechaFin");

-- CreateIndex
CREATE INDEX "Ajuste_fecha_idx" ON "Ajuste"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Ajuste_contratoId_fecha_key" ON "Ajuste"("contratoId", "fecha");

-- CreateIndex
CREATE INDEX "Pago_periodo_idx" ON "Pago"("periodo");

-- CreateIndex
CREATE INDEX "Pago_estado_idx" ON "Pago"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_contratoId_periodo_key" ON "Pago"("contratoId", "periodo");

-- CreateIndex
CREATE INDEX "ValorIndice_tipo_fecha_idx" ON "ValorIndice"("tipo", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ValorIndice_tipo_fecha_key" ON "ValorIndice"("tipo", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Liquidacion_propietarioId_periodo_key" ON "Liquidacion"("propietarioId", "periodo");

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_garanteId_fkey" FOREIGN KEY ("garanteId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ajuste" ADD CONSTRAINT "Ajuste_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidacion" ADD CONSTRAINT "Liquidacion_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
