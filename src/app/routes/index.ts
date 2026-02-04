import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { SpecialtyRoutes } from "../module/specialty/specialty.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/specialties", SpecialtyRoutes)


export const IndexRoutes = router;