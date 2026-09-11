import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandingSection } from './Entities/landing-section.entity';
import { LandingController } from './landing.controller';
import { LandingFileStorageService } from './landing-file-storage.service';
import { LandingService } from './landing.service';

@Module({
  imports: [TypeOrmModule.forFeature([LandingSection])],
  controllers: [LandingController],
  providers: [LandingService, LandingFileStorageService],
})
export class LandingModule {}
