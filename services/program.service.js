import { connectDB } from '../lib/db.js';
import { programRepository } from '../repositories/program.repository.js';

export const programService = {
  async list() {
    await connectDB();
    return programRepository.findAll();
  },

  async forDropdown() {
    await connectDB();
    return programRepository.findForDropdown();
  },

  async getById(id) {
    await connectDB();
    const program = await programRepository.findById(id);
    if (!program) throw Object.assign(new Error('Program nie znaleziony'), { statusCode: 404 });
    return program;
  },

  async create(data) {
    await connectDB();
    return programRepository.create(data);
  },

  async update(id, data) {
    await connectDB();
    const program = await programRepository.updateById(id, data);
    if (!program) throw Object.assign(new Error('Program nie znaleziony'), { statusCode: 404 });
    return program;
  },

  async delete(id) {
    await connectDB();
    const program = await programRepository.deleteById(id);
    if (!program) throw Object.assign(new Error('Program nie znaleziony'), { statusCode: 404 });
    return { message: 'Program usunięty' };
  },
};
