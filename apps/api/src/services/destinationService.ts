import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { DestinationType, AccountStatus } from '@viberhub/shared';

export class DestinationService {
  static async listDestinations(workspaceId: string, type?: DestinationType) {
    let destinations = Array.from(db.data.destinations.values()).filter(
      (d) => d.workspaceId === workspaceId && d.status === AccountStatus.ACTIVE
    );

    if (type) {
      destinations = destinations.filter((d) => d.type === type);
    }

    // Attach contact details if applicable
    const enriched = destinations.map((d) => {
      const contact = d.contactId ? db.data.contacts.get(d.contactId) : null;
      return {
        ...d,
        contact: contact || null
      };
    });

    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return enriched;
  }

  static async getDestinationById(workspaceId: string, id: string) {
    const destination = db.data.destinations.get(id);
    if (!destination || destination.workspaceId !== workspaceId) {
      const err: any = new Error('Destination not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const contact = destination.contactId ? db.data.contacts.get(destination.contactId) : null;
    return {
      ...destination,
      contact: contact || null
    };
  }

  static async createDestination(
    workspaceId: string,
    data: {
      type: DestinationType;
      displayName: string;
      description?: string | null;
      contactId?: string | null;
      notes?: string | null;
      status?: AccountStatus;
    }
  ) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const destination = {
      id,
      workspaceId,
      type: data.type,
      displayName: data.displayName.trim(),
      description: data.description ? data.description.trim() : null,
      contactId: data.contactId || null,
      notes: data.notes ? data.notes.trim() : null,
      status: data.status || AccountStatus.ACTIVE,
      createdAt: now
    };

    db.data.destinations.set(id, destination);
    return this.getDestinationById(workspaceId, id);
  }

  static async updateDestination(workspaceId: string, id: string, data: any) {
    const destination = db.data.destinations.get(id);
    if (!destination || destination.workspaceId !== workspaceId) {
      const err: any = new Error('Destination not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (data.type) destination.type = data.type;
    if (data.displayName) destination.displayName = data.displayName.trim();
    if (data.description !== undefined) destination.description = data.description ? data.description.trim() : null;
    if (data.contactId !== undefined) destination.contactId = data.contactId || null;
    if (data.notes !== undefined) destination.notes = data.notes ? data.notes.trim() : null;
    if (data.status) destination.status = data.status;

    return this.getDestinationById(workspaceId, id);
  }

  static async deleteDestination(workspaceId: string, id: string) {
    const destination = db.data.destinations.get(id);
    if (!destination || destination.workspaceId !== workspaceId) {
      const err: any = new Error('Destination not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    destination.status = AccountStatus.INACTIVE;
    return { success: true, id };
  }
}
