import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Employee } from '@core/models/employee.model';
import { EmployeeService } from '@core/services/employee.service';

export const employeeResolver: ResolveFn<Employee> = (route) =>
  inject(EmployeeService).getById(Number(route.paramMap.get('id')));
