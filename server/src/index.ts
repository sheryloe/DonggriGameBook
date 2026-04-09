import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { getAllAppOrigins } from "../../packages/world-registry/src";
import { registerHealthRoutes } from "./routes/health";
import { registerSaveRoutes } from "./routes/saves";

const app = Fastify({ logger: true });
const extraOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176"
];

await app.register(cors, {
  origin: [...getAllAppOrigins(), ...extraOrigins],
  credentials: true
});

await registerHealthRoutes(app);
await registerSaveRoutes(app);

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 4000);

await app.listen({ host, port });
