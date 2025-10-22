const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://abhiramskumar75_db_user:root@cluster0.bg40zfa.mongodb.net/dsrAnalysisDB?retryWrites=true&w=majority&appName=Cluster0';

console.log("🔍 Testing MongoDB Connection...");
console.log("📍 URI:", MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log("✅ MongoDB connection successful!");
  console.log("✅ Database:", mongoose.connection.name);
  console.log("✅ Host:", mongoose.connection.host);
  console.log("✅ Connection state:", mongoose.connection.readyState);
  console.log("   (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)");
  
  // Test creating a document
  const testSchema = new mongoose.Schema({ test: String, date: Date });
  const TestModel = mongoose.model('Test', testSchema);
  
  const testDoc = new TestModel({ test: 'Connection test', date: new Date() });
  
  return testDoc.save();
})
.then((doc) => {
  console.log("✅ Test document saved successfully!");
  console.log("📄 Document ID:", doc._id);
  console.log("\n🎉 MongoDB is working perfectly!");
  process.exit(0);
})
.catch((err) => {
  console.error("❌ MongoDB connection failed!");
  console.error("❌ Error:", err.message);
  console.error("\n📋 Common issues:");
  console.error("   1. Check if your IP address is whitelisted in MongoDB Atlas");
  console.error("   2. Verify username and password are correct");
  console.error("   3. Ensure network connection is stable");
  console.error("   4. Check if MongoDB Atlas cluster is running");
  console.error("\n🔧 MongoDB Atlas Network Access:");
  console.error("   - Go to: https://cloud.mongodb.com");
  console.error("   - Navigate to: Network Access");
  console.error("   - Add your IP or use 0.0.0.0/0 for testing (allow from anywhere)");
  process.exit(1);
});

