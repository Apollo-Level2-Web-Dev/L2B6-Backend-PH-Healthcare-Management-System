import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { RagController } from "./rag.controller";
import { RagValidation } from "./rag.validation";

const router = Router();

router.post(
    "/query",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.PATIENT),
    validateRequest(RagValidation.queryZodSchema),
    RagController.queryKnowledge,
);

router.post(
    "/ingest",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(RagValidation.ingestZodSchema),
    RagController.ingestDocument,
);

router.post(
    "/reindex",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(RagValidation.reindexZodSchema),
    RagController.reindexKnowledge,
);

router.get(
    "/stats",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    RagController.getStats,
);

export const RagRoutes = router;
