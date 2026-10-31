import { Global, Module } from '@nestjs/common';
import { NetlifyRebuildService } from './netlify-rebuild.service';

@Global()
@Module({
  providers: [NetlifyRebuildService],
  exports: [NetlifyRebuildService],
})
export class NetlifyRebuildModule {}
