import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as dotenv from 'dotenv'
dotenv.config()

const runMigration = async () => {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  const db = drizzle(sql)

  console.log('Creating schema if not exists...')
  await sql`CREATE SCHEMA IF NOT EXISTS user_service;`

  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './src/migrations' })

  await sql.end()
  console.log('Migration completed')
}

runMigration().catch(console.error)