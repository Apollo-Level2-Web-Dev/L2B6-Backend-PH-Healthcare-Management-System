import { Router } from "express";
import { SpecialtyController } from "./specialty.controller";

const router = Router();

router.post('/', SpecialtyController.createSpecialty);
router.get('/', SpecialtyController.getAllSpecialties);
router.delete('/:id', SpecialtyController.deleteSpecialty);

export const SpecialtyRoutes = router;