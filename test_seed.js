require('dotenv').config();
const mongoose = require('mongoose');
const seedChargeCategories = require('./seeders/charge_category.seed');

async function run() {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL);
    await seedChargeCategories();
    await mongoose.disconnect();
}
run().catch(console.error);
