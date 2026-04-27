import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import { ticketRepository } from '../repositories/ticket.repository.js';
import { sendTicketReportEmail } from './email.service.js';

// Compute status from irreversible flags
function computeStatus(reportSent, invoiced) {
  if (invoiced) return 'invoiced';
  if (reportSent) return 'sent';
  return 'waiting';
}

export const ticketService = {
  async list(query) {
    await connectDB();
    const {
      search,
      client,
      executor,
      status,
      date,
      sortField = 'date',
      sortOrder = 'desc',
    } = query;

    const match = {};

    if (date) {
      const [mm, yyyy] = date.split('-');
      const start = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
      const end = new Date(parseInt(yyyy), parseInt(mm), 1);
      match.date = { $gte: start, $lt: end };
    }

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = { $regex: safe, $options: 'i' };
      match.$or = [
        { description: re },
        { 'client.code': re },
        { 'client.name': re },
        { 'client.nip': re },
        { 'client.tags': re },
        { 'executor.name': re },
        { 'executor.surname': re },
      ];
    }

    if (client && mongoose.Types.ObjectId.isValid(client)) {
      match['client._id'] = new mongoose.Types.ObjectId(client);
    }

    if (executor && mongoose.Types.ObjectId.isValid(executor)) {
      match['executor._id'] = new mongoose.Types.ObjectId(executor);
    }

    if (status) match.status = status;

    const sortFieldMap = {
      date: 'date',
      status: 'status',
      client: 'client.name',
      description: 'description',
      executor: 'executor.name',
    };

    const sort = { [sortFieldMap[sortField] || 'date']: sortOrder === 'asc' ? 1 : -1 };

    return ticketRepository.findFiltered({ match, sort });
  },

  async getById(id) {
    await connectDB();
    const ticket = await ticketRepository.findById(id);
    if (!ticket) throw Object.assign(new Error('Zlecenie nie znalezione'), { statusCode: 404 });
    return ticket;
  },

  async create(data, userId) {
    await connectDB();
    const reportSent = data.reportSent || false;
    const invoiced = data.invoiced || false;

    const ticket = await ticketRepository.create({
      ...data,
      reportSent,
      invoiced,
      status: computeStatus(reportSent, invoiced),
      createdBy: userId,
    });

    if (reportSent) {
      const populated = await ticketRepository.findById(ticket._id);
      sendTicketReportEmail({ ticket: populated }).catch((err) =>
        console.error('[email] Błąd wysyłania raportu:', err.message)
      );
    }

    return ticket;
  },

  async update(id, data) {
    await connectDB();
    const existing = await ticketRepository.findById(id);
    if (!existing) throw Object.assign(new Error('Zlecenie nie znalezione'), { statusCode: 404 });

    const wasReportSent = existing.reportSent;

    // Enforce irreversibility of flags
    const reportSent = existing.reportSent || data.reportSent || false;
    const invoiced = existing.invoiced || data.invoiced || false;

    const payload = {
      ...data,
      reportSent,
      invoiced,
      status: computeStatus(reportSent, invoiced),
    };

    const ticket = await ticketRepository.updateById(id, payload);

    // Send email whenever user explicitly requests reportSent (re-send supported)
    if (data.reportSent && reportSent) {
      sendTicketReportEmail({ ticket }).catch((err) =>
        console.error('[email] Błąd wysyłania raportu:', err.message)
      );
    }

    return ticket;
  },

  async exportCsv(date) {
    await connectDB();
    const [mm, yyyy] = date.split('-');
    const start = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
    const end = new Date(parseInt(yyyy), parseInt(mm), 1);
    const tickets = await ticketRepository.findForExport({ date: { $gte: start, $lt: end } });

    const esc = (v) => {
      const s = String(v ?? '').replace(/\r\n|\r|\n/g, ' ');
      return s.includes(';') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const fmt = (d) => {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const header = 'Klient;Data;Czas (w minutach);Kto zlecił;Kto zrobił;Opis;Uwagi;Cena;Kategoria;Dojazd;Typ usługi;Wystawiona faktura';
    const rows = tickets.map((t) =>
      [
        t.client?.name,
        fmt(t.date),
        t.duration,
        t.orderedBy,
        [t.executor?.name, t.executor?.surname].filter(Boolean).join(' '),
        t.description,
        t.note,
        t.priceType,
        t.category,
        t.commute ? 'Tak' : 'Nie',
        t.service_type,
        t.invoiced ? 'Tak' : 'Nie',
      ].map(esc).join(';')
    );

    return '﻿' + [header, ...rows].join('\n');
  },

  async delete(id) {
    await connectDB();
    const ticket = await ticketRepository.deleteById(id);
    if (!ticket) throw Object.assign(new Error('Zlecenie nie znalezione'), { statusCode: 404 });
    return { message: 'Zlecenie usunięte' };
  },
};
