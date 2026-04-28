/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, RedisClientType } from "redis";
import { envVars } from "../config/env";

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      // Try to get Redis URL from environment variables
      const redisUrl = envVars.REDIS_URL;
      // console.log({ redisUrl });

      if (redisUrl) {
        this.client = createClient({ url: redisUrl });
      } else {
        // Fallback to individual parameters
        const host = process.env.REDIS_HOST || "localhost";
        const port = parseInt(process.env.REDIS_PORT || "6379", 10);
        const password = process.env.REDIS_PASSWORD || undefined;

        this.client = createClient({
          socket: {
            host,
            port,
          },
          ...(password && { password }),
        });
      }

      // Handle connection events
      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis Client Connected");
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        console.log("Redis Client Ready");
        this.isConnected = true;
      });

      this.client.on("end", () => {
        console.log("Redis Client Disconnected");
        this.isConnected = false;
      });

      // Reconnect strategy
      this.client.on("reconnecting", () => {
        console.log("Redis Client Reconnecting");
      });

      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.isConnected = false;
      // Don't throw here - we want the app to work even if Redis is unavailable
    }
  }

  private ensureConnection(): RedisClientType {
    if (!this.client) {
      throw new Error("Redis client not initialized. Call connect() first.");
    }
    if (!this.isConnected) {
      throw new Error("Redis client not connected.");
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = this.ensureConnection();
      return await client.get(key);
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  }

  async set(key: string, value: any, ttlInSeconds: number): Promise<void> {
    try {
      const client = this.ensureConnection();
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      await client.set(key, stringValue, { EX: ttlInSeconds });
    } catch (error) {
      console.error("Redis SET error:", error);
    }
  }

  async update(key: string, value: any, ttlInSeconds: number): Promise<void> {
    // Update is the same as set in Redis
    await this.set(key, value, ttlInSeconds);
  }

  async delete(key: string): Promise<void> {
    try {
      const client = this.ensureConnection();
      await client.del(key);
    } catch (error) {
      console.error("Redis DELETE error:", error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = this.ensureConnection();
      await client.ping();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export a singleton instance
export const redisService = new RedisService();

// Connect on module import (optional - can also connect manually)
// redisService.connect().catch(console.error);
