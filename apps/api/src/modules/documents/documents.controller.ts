import { VesselDocument } from '@gbferry/database';
import { DocumentUploadDto } from '@gbferry/dto';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Roles } from 'nest-keycloak-connect';
import { extname } from 'path';
import { AuditService } from '../audit/audit.service';
import { CurrentUser, type KeycloakUser } from '../auth/current-user.decorator';
import { CertificationsService } from '../crew/certifications.service';
import { DocumentQueryService } from './document-query.service';
import { DocumentUploadService } from './document-upload.service';
import { DocumentViewerService } from './document-viewer.service';

interface UploadBody {
  name?: string;
  entityType?: DocumentUploadDto['entityType'];
  entityId?: string;
  documentType?: string;
  expiryDate?: string;
  metadata?: any;
}

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentUploadService: DocumentUploadService,
    private readonly auditService: AuditService,
    private readonly documentQueryService: DocumentQueryService,
    private readonly documentViewerService: DocumentViewerService,
    private readonly certificationsService: CertificationsService
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document with AI metadata extraction' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        name: { type: 'string' },
        entityType: { type: 'string', enum: ['vessel', 'crew'] },
        entityId: { type: 'string', format: 'uuid' },
        documentType: { type: 'string' },
        expiryDate: { type: 'string', format: 'date-time' },
        metadata: { type: 'string', description: 'JSON string of additional metadata' },
      },
      required: ['file', 'name', 'entityType', 'entityId'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        files: 1,
        fileSize: 10 * 1024 * 1024, // 10MB cap to prevent oversized uploads
      },
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
        const extension = extname(file.originalname || '').toLowerCase();

        if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(extension)) {
          return callback(
            new BadRequestException('Invalid file type. Only PDF or image files are allowed.'),
            false
          );
        }

        callback(null, true);
      },
    })
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadBody,
    @CurrentUser() user: KeycloakUser
  ): Promise<{ data: any }> {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const mappedUser = await this.mapUser(user);
    const uploadDto = this.mapUploadDto(body);
    const result = await this.documentUploadService.uploadWithMetadataExtraction(
      file,
      uploadDto,
      mappedUser.id
    );

    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'List vessel documents (search and filter)' })
  @ApiQuery({ name: 'vesselId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['VALID', 'EXPIRING', 'EXPIRED', 'PENDING_REVIEW'],
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Full-text search against title/description/type',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listDocuments(
    @Query('vesselId') vesselId: string | undefined,
    @Query('type') type: string | undefined,
    @Query('status') status: string | undefined,
    @Query('q') q: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @CurrentUser() user?: KeycloakUser
  ): Promise<{
    data: VesselDocument[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const mappedUser = user?.sub
      ? await this.auditService.resolveOrCreateUserFromKeycloak({
          keycloakId: user.sub,
          email: user.email,
          preferredUsername: user.preferredUsername,
          firstName: user.givenName,
          lastName: user.familyName,
          roles: user.roles,
        })
      : null;

    return this.documentQueryService.search(
      { vesselId, type, status, q, page, limit },
      mappedUser?.id
    );
  }

  @Get('certifications/:id/view')
  @ApiOperation({ summary: 'Generate a secure, short-lived URL to view a certification document' })
  @Roles({ roles: ['COMPLIANCE_OFFICER', 'ADMIN', 'SUPERADMIN'] })
  async viewCertification(
    @Param('id') certId: string,
    @CurrentUser() user: KeycloakUser
  ): Promise<{ url: string; expiresAt: string }> {
    const cert = await this.certificationsService.findOne(certId);
    if (!cert) {
      throw new NotFoundException('Certification not found');
    }

    const mappedUser = await this.mapUser(user);

    if (!cert.documentUrl) {
      throw new BadRequestException('No document URL found for this certification');
    }

    return this.documentViewerService.getSignedViewUrl(cert.documentUrl, mappedUser.id, {
      entityType: 'certification',
      entityId: certId,
    });
  }

  private async mapUser(user?: KeycloakUser) {
    if (!user?.sub) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    const mapped = await this.auditService.resolveOrCreateUserFromKeycloak({
      keycloakId: user.sub,
      email: user.email,
      preferredUsername: user.preferredUsername,
      firstName: user.givenName,
      lastName: user.familyName,
      roles: user.roles,
    });

    if (!mapped) {
      throw new UnauthorizedException('Unable to map authenticated user');
    }

    return mapped;
  }

  private mapUploadDto(body: UploadBody): DocumentUploadDto {
    if (!body?.name || !body?.entityType || !body?.entityId) {
      throw new BadRequestException('name, entityType, and entityId are required');
    }

    if (body.entityType !== 'vessel' && body.entityType !== 'crew') {
      throw new BadRequestException('Only vessel and crew documents are supported');
    }

    const expiryDate = body.expiryDate ? new Date(body.expiryDate) : undefined;
    if (expiryDate && Number.isNaN(expiryDate.getTime())) {
      throw new BadRequestException('expiryDate must be a valid date');
    }

    return {
      name: body.name,
      entityType: body.entityType,
      entityId: body.entityId,
      documentType: body.documentType,
      expiryDate,
      metadata: this.parseMetadata(body.metadata),
    };
  }

  private parseMetadata(raw: UploadBody['metadata']): Record<string, any> | undefined {
    if (!raw) return undefined;
    if (typeof raw === 'object') {
      return Array.isArray(raw) ? undefined : (raw as Record<string, any>);
    }
    if (typeof raw !== 'string') return undefined;

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
      throw new Error('metadata must be object');
    } catch {
      throw new BadRequestException('metadata must be valid JSON when provided');
    }
  }
}
