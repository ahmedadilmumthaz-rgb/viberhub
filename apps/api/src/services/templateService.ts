import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { renderTemplate, TemplateContext } from '@viberhub/shared';

export class TemplateService {
  static async listTemplates(workspaceId: string, category?: string) {
    let templates = Array.from(db.data.templates.values()).filter(
      (t) => t.workspaceId === workspaceId && !t.archivedAt
    );

    if (category) {
      templates = templates.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }

    templates.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return templates;
  }

  static async getTemplateById(workspaceId: string, id: string) {
    const template = db.data.templates.get(id);
    if (!template || template.workspaceId !== workspaceId) {
      const err: any = new Error('Template not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return template;
  }

  static async createTemplate(
    workspaceId: string,
    actorId: string,
    data: { name: string; category?: string; body: string }
  ) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const template = {
      id,
      workspaceId,
      name: data.name.trim(),
      category: data.category ? data.category.trim().toLowerCase() : 'general',
      body: data.body,
      createdBy: actorId,
      updatedBy: actorId,
      archivedAt: null,
      createdAt: now,
      updatedAt: now
    };

    db.data.templates.set(id, template);
    return template;
  }

  static async updateTemplate(
    workspaceId: string,
    id: string,
    actorId: string,
    data: { name?: string; category?: string; body?: string }
  ) {
    const template = db.data.templates.get(id);
    if (!template || template.workspaceId !== workspaceId) {
      const err: any = new Error('Template not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (data.name) template.name = data.name.trim();
    if (data.category) template.category = data.category.trim().toLowerCase();
    if (data.body !== undefined) template.body = data.body;
    template.updatedBy = actorId;
    template.updatedAt = new Date().toISOString();

    return template;
  }

  static async archiveTemplate(workspaceId: string, id: string) {
    const template = db.data.templates.get(id);
    if (!template || template.workspaceId !== workspaceId) {
      const err: any = new Error('Template not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    template.archivedAt = new Date().toISOString();
    return { success: true, id };
  }

  static async previewTemplate(
    workspaceId: string,
    templateBody: string,
    contactId?: string,
    customContext?: TemplateContext
  ) {
    let context: TemplateContext = {
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    if (contactId) {
      const contact = db.data.contacts.get(contactId);
      if (contact && contact.workspaceId === workspaceId) {
        context.name = contact.displayName;
        context.phone = contact.phoneE164 || contact.phoneOriginal;
        context.company = contact.organization || undefined;
      }
    }

    if (customContext) {
      context = { ...context, ...customContext };
    }

    // Default sample values if empty
    if (!contactId && !customContext) {
      context.name = 'Alex Morgan';
      context.phone = '+1 (555) 012-3456';
      context.company = 'Acme Corp';
    }

    return renderTemplate(templateBody, context);
  }
}
