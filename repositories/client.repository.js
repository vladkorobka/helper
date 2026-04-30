import { Client } from '../models/Client.js';
// Ensure Program schema is registered for populate('programs.program')
import '../models/Program.js';

export const clientRepository = {
  findAll(search = '') {
    const filter = search
      ? {
          $or: [
            {
              name: {
                $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                $options: 'i',
              },
            },
            {
              code: {
                $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                $options: 'i',
              },
            },
            {
              nip: {
                $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                $options: 'i',
              },
            },
            { tags: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    return Client.find(filter).sort({ name: 1 }).select('-programs');
  },

  findById(id) {
    return Client.findById(id).populate({
      path: 'programs.program',
      select: 'code name categories',
    });
  },

  findForDropdown() {
    return Client.find()
      .sort({ name: 1 })
      .select('_id code name nip email contactPerson tags');
  },

  create(data) {
    return Client.create(data);
  },

  updateById(id, data) {
    return Client.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  },

  deleteById(id) {
    return Client.findByIdAndDelete(id);
  },
};
