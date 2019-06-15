const express = require('express');
const router = express.Router();
const controller = require('../../controllers/controller.plan');
const authMiddleware = require('../../middlewares/middleware.auth');


router.get('/', controller.fetchPlan);

router.post('/',authMiddleware, controller.createPlan);

router.delete('/:id',authMiddleware, controller.deletePlan);

module.exports = router;