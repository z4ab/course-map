import { NextResponse } from 'next/server';
import { MongoClient, ServerApiVersion } from 'mongodb';

// Note: Replace with your MongoDB connection string
// For production, use environment variables
const pwd = process.env.MONGODB_PASSWORD || '';
const uri = `mongodb+srv://zaid:${pwd}@course-map.1ampwar.mongodb.net/?retryWrites=true&w=majority&appName=course-map`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function POST(request) {
  try {
    const body = await request.json();
    const courses = body.courses;
    
    // Connect the client to the server
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

    const db = client.db('data');
    const collection = db.collection('selection');

    const insertResult = await collection.insertOne({
      user: "main",
      course_list: courses,
      timestamp: new Date()
    });
    
    console.log('Inserted documents =>', insertResult);
    
    await client.close();
    
    return NextResponse.json({ success: true, insertedId: insertResult.insertedId });
  } catch (error) {
    console.error('Error saving selection:', error);
    return NextResponse.json({ error: 'Failed to save selection' }, { status: 500 });
  }
}
