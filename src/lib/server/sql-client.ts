import sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function readRequiredEnv(variableName: string): string {
  const value = process.env[variableName];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${variableName} para conectarse a Azure SQL.`);
  }

  return value;
}

function buildConfig(): sql.config {
  return {
    server: readRequiredEnv("AZURE_SQL_SERVER"),
    database: readRequiredEnv("AZURE_SQL_DATABASE"),
    user: readRequiredEnv("AZURE_SQL_USER"),
    password: readRequiredEnv("AZURE_SQL_PASSWORD"),
    port: Number(process.env.AZURE_SQL_PORT ?? 1433),
    options: {
      encrypt: true,
      trustServerCertificate: false
    },
    pool: {
      max: 20,
      min: 0,
      idleTimeoutMillis: 30000
    },
    connectionTimeout: 15000,
    requestTimeout: 120000
  };
}

export async function getSqlPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(buildConfig()).connect().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
}

export { sql };
