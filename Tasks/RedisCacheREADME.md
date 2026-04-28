# Redis Caching Implementation for RAG Module

## Overview

This document describes the implementation of Redis caching for the RAG (Retrieval-Augmented Generation) module in the Healthcare Management System backend.

## What Was Implemented

### 1. Redis Utility Service (`src/app/lib/redis.ts`)

- Created a singleton Redis client using the official `redis` package
- Implemented methods for get, set, update, and delete operations
- Added automatic JSON serialization/deserialization
- Included proper error handling and connection management
- Supports connection via REDIS_URL or individual host/port/password variables
- Graceful degradation - if Redis is unavailable, the app continues to work without caching

### 2. RAG Controller Modifications (`src/app/module/rag/rag.controller.ts`)

- Added caching logic to the `queryRag` handler
- Generates cache keys from query parameters: `rag:query:${query}:${limit}:${sourceType}`
- On cache hit: returns cached response immediately with "Answer retrieved from cache" message
- On cache miss: processes normally and stores result in Redis with 30-minute TTL (1800 seconds)
- Only caches the queryRag endpoint (not getStats) as requested
- Added error handling for Redis operations with fallback to no-cache

## Configuration Required

### 1. Install Redis Package

```bash
pnpm add redis
```

### 2. Add Environment Variables

Add one of the following to your `.env` file:

**Option 1: Using Redis URL (recommended)**

```env
REDIS_URL=redis://localhost:6379
```

**Option 2: Using Individual Parameters**

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_if_any
```

### 3. Ensure Redis Server is Running

- Install and start Redis server locally, or
- Provide access to a Redis instance

## Cache Behavior

### Cache Key Generation

Cache keys are generated using the format:

```
rag:query:${query}:${limit}:${sourceType}
```

Where:

- `query`: The search query string
- `limit`: Number of results to return (default: 5)
- `sourceType`: Optional filter for document source type

### TTL (Time To Live)

- Cached results are stored for 1800 seconds (30 minutes)
- After TTL expires, the next request will be a cache miss and regenerate the cache

### Cache Scope

- Only the `queryRag` endpoint is cached
- The `getStats` and `ingestDoctors` endpoints are not cached
- Cache is bypassed if Redis connection fails

## Error Handling

- Redis connection errors are logged but don't crash the application
- If Redis is unavailable, the system falls back to normal processing without caching
- Cache read/write errors are handled gracefully with fallback to no-cache

## Testing the Implementation

To verify the caching is working correctly:

1. **First Request** (Cache Miss):
   - Make a queryRag request
   - Observe normal processing time
   - Check Redis to see the key was stored

2. **Second Identical Request** (Cache Hit):
   - Make the same queryRag request again
   - Observe faster response time
   - Response will include message: "Answer retrieved from cache"

3. **Different Query Parameters**:
   - Make requests with different query, limit, or sourceType
   - Verify these create different cache keys and don't return cached results

4. **Cache Expiration**:
   - Wait 30 minutes after storing a cache entry
   - Make the same request again
   - Observe it returns to cache miss behavior and regenerates the cache

## Files Modified/Created

### Created:

- `src/app/lib/redis.ts` - Redis utility service

### Modified:

- `src/app/module/rag/rag.controller.ts` - Added caching logic to queryRag handler

## Dependencies

- `redis` package (installed via `pnpm add redis`)
- Redis server accessible at the configured connection details

## Troubleshooting

### Common Issues

1. **"Redis is not defined" Error**:
   - Make sure you ran `pnpm add redis`
   - Check that the import is correct: `import { createClient, RedisClientType } from 'redis';`

2. **Connection Refused**:
   - Verify Redis server is running
   - Check your REDIS_URL or host/port/password settings
   - Test connection with `redis-cli ping`

3. **Cache Not Working**:
   - Check application logs for Redis connection messages
   - Verify cache key generation is consistent
   - Look for cache hit/miss messages in logs

4. **Performance Not Improving**:
   - Ensure you're making identical requests (same query, limit, sourceType)
   - Check that TTL hasn't expired
   - Verify Redis is actually storing data (use `redis-cli keys "rag:*"`)

## Security Considerations

- The Redis service does not authenticate by default - ensure your Redis instance is properly secured
- Consider enabling Redis AUTH if connecting to a remote instance
- Cache keys do not contain sensitive data, only query parameters
- Consider enabling Redis encryption/TLS for production deployments

## Future Improvements

1. Add cache invalidation strategies when underlying data changes
2. Implement cache warming for popular queries
3. Add cache statistics/monitoring
4. Implement different TTL values based on query type
5. Add cache compression for large payloads

## Documentation

For detailed setup and usage, check the official Redis Node.js client documentation:

- [Node Redis Installation Guide](https://redis.js.org/#node-redis-installation)
