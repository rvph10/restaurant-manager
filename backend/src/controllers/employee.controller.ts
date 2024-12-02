import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { AppError } from '../middleware/error.handler';
import { Department, EmployeeStatus, TimeOffType, BreakType } from '@prisma/client';

export class EmployeeController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  // Create Employee
  createEmployee = async (req: Request, res: Response) => {
    try {
      const employee = await this.employeeService.createEmployee({
        ...req.body,
        user: req.body.userId // Assuming we pass the creator's ID
      });

      res.status(201).json({
        status: 'success',
        data: employee
      });
    } catch (error) {
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to create employee');
    }
  };

  // Update Employee
  updateEmployee = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const employee = await this.employeeService.updateEmployee({
        ...req.body,
        id,
        user: req.body.userId
      });

      res.status(200).json({
        status: 'success',
        data: employee
      });
    } catch (error) {
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to update employee');
    }
  };

  // Get Employees
  getEmployees = async (req: Request, res: Response) => {
    try {
      const filters = {
        department: req.query.department as Department[],
        status: req.query.status as EmployeeStatus,
        role: req.query.role as string
      };

      const employees = await this.employeeService.getEmployees(filters);

      res.status(200).json({
        status: 'success',
        data: employees
      });
    } catch (error) {
      throw new AppError(400, 'Failed to get employees');
    }
  };

  // Update Employee Status
  updateEmployeeStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, reason, userId } = req.body;

      const employee = await this.employeeService.updateEmployeeStatus({
        employeeId: id,
        status,
        reason,
        user: userId
      });

      res.status(200).json({
        status: 'success',
        data: employee
      });
    } catch (error) {
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to update employee status');
    }
  };

  // Create Employee Role
  createEmployeeRole = async (req: Request, res: Response) => {
    try {
      const { employeeId, roleId, userId } = req.body;

      const employeeRole = await this.employeeService.createEmployeeRole({
        employeeId,
        roleId,
        user: userId
      });

      res.status(201).json({
        status: 'success',
        data: employeeRole
      });
    } catch (error) {
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to create employee role');
    }
  };
  // Create Time Off Request
  createTimeOff = async (req: Request, res: Response) => {
    try {
      const timeOff = await this.employeeService.createTimeOff({
        ...req.body,
        user: req.body.userId
      });

      res.status(201).json({
        status: 'success',
        data: timeOff
      });
    } catch (error) {
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to create time off request');
    }
  };

  // Start Break
  startBreak = async (req: Request, res: Response) => {
    try {
      const { employeeId, type, userId } = req.body;

      const break_ = await this.employeeService.startEmployeeBreak({
        employeeId,
        type: type as BreakType,
        user: userId
      });

      res.status(200).json({
        status: 'success',
        data: break_
      });
    } catch (error) {
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to start break');
    }
  };

  // End Break
  endBreak = async (req: Request, res: Response) => {
    try {
      const { breakId } = req.params;
      const { userId } = req.body;

      const break_ = await this.employeeService.endEmployeeBreak({
        breakId,
        user: userId
      });

      res.status(200).json({
        status: 'success',
        data: break_
      });
    } catch (error) {
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to end break');
    }
  };
}