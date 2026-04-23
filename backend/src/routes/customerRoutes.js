const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', roleMiddleware(['admin', 'staff']), customerController.getAllCustomers);
router.get('/:id', roleMiddleware(['admin', 'staff']), customerController.getCustomerById);

router.use(roleMiddleware(['admin']));
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.put('/:id/trash', customerController.moveCustomerToTrash);
router.put('/:id/restore', customerController.restoreCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
