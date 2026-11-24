import { MongoClient } from 'mongodb'

let connection
export async function database() {
  if (!connection) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('Missing MongoDB configuration')
    const client = new MongoClient(uri, {appName:'Portfolio', serverSelectionTimeoutMS:8000, maxPoolSize:5})
    connection = client.connect().catch(async error => {
      connection = undefined
      await client.close()
      throw error
    })
  }
  return (await connection).db(process.env.MONGODB_DB_NAME || 'Traker')
}
export const workspaces = async () => (await database()).collection('taskforge_workspaces')
