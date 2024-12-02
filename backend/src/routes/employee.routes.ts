import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';

const router = Router();
const employeeController = new EmployeeController();

// Employee CRUD routes
router.post('/', employeeController.createEmployee);
router.patch('/:id', employeeController.updateEmployee);
router.get('/', employeeController.getEmployees);

// Employee status and role routes
router.patch('/:id/status', employeeController.updateEmployeeStatus);
router.post('/roles', employeeController.createEmployeeRole);

// Time off and break routes
router.post('/timeoff', employeeController.createTimeOff);
router.post('/breaks', employeeController.startBreak);
router.patch('/breaks/:breakId', employeeController.endBreak);

export { router as employeeRoutes };