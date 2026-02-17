import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import { envVars } from '../config/env';


const connectionString = envVars.DATABASE_URL;

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma };

