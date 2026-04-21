import mongoose from 'mongoose';

const cleanup = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/jira-clone', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to jira-clone database');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📦 Collections in jira-clone:`);
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Clear all collections but keep structure (drop and recreate)
    console.log(`\n🧹 Clearing all data from collections...`);
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`  ✓ Cleared ${collection.name}`);
    }

    console.log(`\n✅ Database cleanup complete!`);
    console.log(`\n📌 All data is now consolidated in: jira-clone`);
    console.log(`📌 All collections are empty and ready for fresh data`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

cleanup();
