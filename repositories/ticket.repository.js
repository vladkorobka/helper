import { Ticket } from '../models/Ticket.js';

const POPULATE_OPTIONS = [
  { path: 'client', select: 'code name email' },
  { path: 'executor', select: 'name surname' },
  { path: 'createdBy', select: 'name surname' },
];

export const ticketRepository = {
  async findFiltered({ match, sort, page = 1, limit = 200 }) {
    // Single efficient aggregation with $lookup instead of double-query
    const pipeline = [
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'employees',
          localField: 'executor',
          foreignField: '_id',
          as: 'executor',
        },
      },
      // preserveNullAndEmptyArrays: true — tickets without executor still show
      { $unwind: { path: '$executor', preserveNullAndEmptyArrays: true } },
      { $match: match },
      { $sort: sort },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          date: 1, status: 1, description: 1, duration: 1,
          toInvoice: 1, invoiceSent: 1, commute: 1,
          'client._id': 1, 'client.code': 1, 'client.name': 1,
          'executor._id': 1, 'executor.name': 1, 'executor.surname': 1,
        },
      },
    ];

    return Ticket.aggregate(pipeline);
  },

  findById(id) {
    return Ticket.findById(id).populate(POPULATE_OPTIONS);
  },

  create(data) {
    return Ticket.create(data);
  },

  updateById(id, data) {
    return Ticket.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(POPULATE_OPTIONS);
  },

  deleteById(id) {
    return Ticket.findByIdAndDelete(id);
  },
};
