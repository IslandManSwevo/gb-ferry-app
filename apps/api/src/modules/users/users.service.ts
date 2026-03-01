import { PrismaService } from '@gbferry/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        keycloakId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
