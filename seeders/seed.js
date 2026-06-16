require('dotenv').config()
const mongoose = require('mongoose')
const seedRBAC = require('./rbac.seed')
const departmetSeed=require('./department.seed')
const designationSeed=require('./designation.seed')
const specializationSeed=require('./specialization.seed')
const labCategorySeed=require('./lab_category.seed')
const radiologySeed=require('./radiology.seed')
const medicineCategorySeed=require('./medicine_category.seed')
const chargeCategorySeed=require('./charge_category.seed')
async function runSeeders() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL)
    console.log('Database connected successfully.')

    console.log('Starting RBAC seeder...')
    await seedRBAC()
    await departmetSeed();
    await designationSeed();
    await specializationSeed();
    await labCategorySeed();
    await radiologySeed();
    await medicineCategorySeed()
    await chargeCategorySeed();
    console.log('All seeders completed successfully!')
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Error running seeders:', error)
    
    // Ensure we disconnect even on error before exiting
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
    }
    process.exit(1)
  }
}

runSeeders()
