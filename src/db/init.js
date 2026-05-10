import { pathToFileURL } from 'node:url';
import { config } from '../config.js';
import { connectDatabase, disconnectDatabase } from './connection.js';
import { Domain } from './models/Domain.js';

export async function ensureDefaultDomains() {
  const operations = config.defaultDomains.map((name) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name, active: true } },
      upsert: true
    }
  }));

  if (operations.length > 0) {
    await Domain.bulkWrite(operations, { ordered: false });
  }

  return config.defaultDomains;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await connectDatabase();
  const domains = await ensureDefaultDomains();
  console.log(`MongoDB ready with domains: ${domains.join(', ')}`);
  await disconnectDatabase();
}
