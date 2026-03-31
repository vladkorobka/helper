import { connectDB } from '../lib/db.js';
import { clientRepository } from '../repositories/client.repository.js';

export const clientService = {
  async list(search) {
    await connectDB();
    return clientRepository.findAll(search);
  },

  async forDropdown() {
    await connectDB();
    return clientRepository.findForDropdown();
  },

  async getById(id) {
    await connectDB();
    const client = await clientRepository.findById(id);
    if (!client) throw Object.assign(new Error('Klient nie znaleziony'), { statusCode: 404 });
    return client;
  },

  async create(data) {
    await connectDB();
    return clientRepository.create(data);
  },

  async update(id, data) {
    await connectDB();
    const client = await clientRepository.updateById(id, data);
    if (!client) throw Object.assign(new Error('Klient nie znaleziony'), { statusCode: 404 });
    return client;
  },

  async delete(id) {
    await connectDB();
    const client = await clientRepository.deleteById(id);
    if (!client) throw Object.assign(new Error('Klient nie znaleziony'), { statusCode: 404 });
    return { message: 'Klient usunięty' };
  },
};
