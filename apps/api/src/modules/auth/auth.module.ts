import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  KeycloakConnectModule,
  PolicyEnforcementMode,
  ResourceGuard,
  RoleGuard,
  TokenValidation,
} from 'nest-keycloak-connect';
import { AuditModule } from '../audit/audit.module';
import { LoggingAuthGuard } from './logging-auth.guard';

@Global()
@Module({
  imports: [
    AuditModule,
    KeycloakConnectModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        authServerUrl: configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080'),
        realm: configService.get<string>('KEYCLOAK_REALM', 'gbferry'),
        clientId: configService.get<string>('KEYCLOAK_CLIENT_ID', 'gbferry-api'),
        secret: configService.get<string>(
          'KEYCLOAK_CLIENT_SECRET',
          'dev-api-secret-change-in-production'
        ),

        // Policy enforcement mode
        policyEnforcement: PolicyEnforcementMode.PERMISSIVE,

        // Token validation
        tokenValidation: TokenValidation.ONLINE,

        // Log level
        logLevels: ['warn', 'error'],
      }),
    }),
  ],
  providers: [
    // Global authentication guard
    {
      provide: APP_GUARD,
      useClass: LoggingAuthGuard,
    },
    // Role-based guard
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    // Resource-based guard
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
  ],
  exports: [KeycloakConnectModule],
})
export class AuthModule {}
