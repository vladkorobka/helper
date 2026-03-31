import { Employee } from '../models/Employee.js';

export const employeeRepository = {
  findAll(filter = {}) {
    return Employee.find({ ...filter, role: { $ne: 'superadmin' } }).sort({ name: 1 });
  },

  findById(id) {
    return Employee.findById(id);
  },

  findByLogin(identifier) {
    // 'superadmin' username is only allowed for the superadmin role
    if (identifier === 'superadmin') {
      return Employee.findOne({ role: 'superadmin' }).select('+password');
    }
    return Employee.findOne({ email: identifier }).select('+password');
  },

  findByEmail(email) {
    return Employee.findOne({ email });
  },

  // For ticket executor dropdown — active employees only
  findExecutors() {
    return Employee.find({ active: true, role: { $ne: 'superadmin' } })
      .select('_id name surname role')
      .sort({ name: 1 });
  },

  create(data) {
    return Employee.create(data);
  },

  updateById(id, data) {
    return Employee.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return Employee.findByIdAndDelete(id);
  },
};
