import mongoose from "mongoose";

type CachedConnection = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongo = globalThis as typeof globalThis & {
  mongooseConnection?: CachedConnection;
};

const cached = globalForMongo.mongooseConnection ?? {
  connection: null,
  promise: null,
};

globalForMongo.mongooseConnection = cached;

export async function connectToMongoDB() {
  if (cached.connection) {
    return cached.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  cached.promise ??= mongoose.connect(uri, {
    bufferCommands: false,
  });

  cached.connection = await cached.promise;

  return cached.connection;
}
