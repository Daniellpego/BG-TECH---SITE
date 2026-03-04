import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, params?: { accountId?: string }) {
    return this.prisma.contact.findMany({
      where: {
        tenantId,
        ...(params?.accountId && { accountId: params.accountId }),
      },
      include: { account: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
      include: { account: true },
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  async create(tenantId: string, data: {
    name: string;
    accountId?: string;
    email?: string;
    phone?: string;
    role?: string;
    department?: string;
    linkedinUrl?: string;
    meta?: any;
  }) {
    return this.prisma.contact.create({ data: { ...data, tenantId } });
  }

  async update(tenantId: string, id: string, data: {
    name?: string;
    accountId?: string;
    email?: string;
    phone?: string;
    role?: string;
    department?: string;
    linkedinUrl?: string;
    meta?: any;
  }) {
    await this.findById(tenantId, id);
    return this.prisma.contact.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.contact.delete({ where: { id } });
  }
}
