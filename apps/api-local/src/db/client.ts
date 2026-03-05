import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('Missing DATABASE_URL')

export const sql = postgres(connectionString)
