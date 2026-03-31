import { Program } from '../models/Program.js';

export const programRepository = {
  findAll() {
    return Program.find().sort({ name: 1 });
  },

  findForDropdown() {
    return Program.find().sort({ name: 1 }).select('_id code name categories');
  },

  findById(id) {
    return Program.findById(id);
  },

  create(data) {
    return Program.create(data);
  },

  updateById(id, data) {
    return Program.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return Program.findByIdAndDelete(id);
  },
};
