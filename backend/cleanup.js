import mongoose from 'mongoose';
import { env } from './src/config/env.js';

const cleanup = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log(`Connected to ${env.primaryDatabaseName} database`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\nCollections in ${env.primaryDatabaseName}:`);
    collections.forEach((collection) => console.log(`  - ${collection.name}`));

    console.log('\nClearing all data from collections...');
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`  Cleared ${collection.name}`);
    }

    console.log('\nDatabase cleanup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

cleanup();
