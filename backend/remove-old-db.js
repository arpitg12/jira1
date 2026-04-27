import { MongoClient } from 'mongodb';
import { env } from './src/config/env.js';

const removeOldDatabases = async () => {
  const client = new MongoClient(env.mongoAdminUri);

  try {
    await client.connect();
    const admin = client.db('admin').admin();

    console.log('Checking for duplicate databases...\n');

    const databases = await admin.listDatabases();
    const dbNames = databases.databases.map((db) => db.name);

    console.log('Existing databases:');
    dbNames.forEach((name) => console.log(`  - ${name}`));

    if (dbNames.includes(env.legacyDatabaseName)) {
      await client.db(env.legacyDatabaseName).dropDatabase();
      console.log(`\nDropped old ${env.legacyDatabaseName} database`);
    }

    const updatedDbs = await admin.listDatabases();
    const finalDbNames = updatedDbs.databases.map((db) => db.name);

    console.log('\nFinal databases:');
    finalDbNames.forEach((name) => {
      if (name === env.primaryDatabaseName) {
        console.log(`  * ${name} (PRIMARY)`);
      } else {
        console.log(`  - ${name}`);
      }
    });

    console.log('\nDatabase consolidation complete.\n');
  } finally {
    await client.close();
  }
};

removeOldDatabases();
