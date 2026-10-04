import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryStorageService } from './Storage/cloudinary-storage.service';

@Global() // global para que cualquier módulo pueda inyectarlo sin importarlo
@Module({
  imports: [ConfigModule],
  providers: [CloudinaryStorageService],
  exports: [CloudinaryStorageService],
})
export class CommonModule {}
