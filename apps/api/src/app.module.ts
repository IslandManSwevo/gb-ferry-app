import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { CrewModule } from './modules/crew/crew.module';
import { DatabaseModule } from './modules/database/database.module';
import { PassengersModule } from './modules/passengers/passengers.module';
import { VesselsModule } from './modules/vessels/vessels.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Authentication (Keycloak)
    AuthModule,

    // Database
    DatabaseModule,

    // Feature modules
    PassengersModule,
    CrewModule,
    VesselsModule,
    ComplianceModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
