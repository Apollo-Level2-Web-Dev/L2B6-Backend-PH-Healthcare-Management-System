import { Router } from "express";
import { RagController } from "./rag.controller";

const router = Router();

router.get("/stats", RagController.getStats);

//index doctors data
router.post("/ingest-doctors", RagController.ingestDoctors);

// query rag
router.post("/query", RagController.queryRag);

export const RagRoutes = router;
