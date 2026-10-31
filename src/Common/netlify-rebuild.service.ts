import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Dispara un build de Netlify (prerender) cuando cambia contenido público.
 * Requiere NETLIFY_BUILD_HOOK_URL en el entorno (Site settings → Build hooks).
 */
@Injectable()
export class NetlifyRebuildService {
  private readonly logger = new Logger(NetlifyRebuildService.name);

  constructor(private readonly config: ConfigService) {}

  triggerPublicContentRebuild(reason: string): void {
    const url = this.config.get<string>('NETLIFY_BUILD_HOOK_URL')?.trim();
    if (!url) {
      this.logger.debug(
        `Sin NETLIFY_BUILD_HOOK_URL — no se dispara rebuild (${reason})`,
      );
      return;
    }

    void fetch(url, { method: 'POST' })
      .then((res) => {
        if (!res.ok) {
          this.logger.warn(
            `Build hook HTTP ${res.status} al pedir rebuild (${reason})`,
          );
          return;
        }
        this.logger.log(`Build hook Netlify disparado (${reason})`);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Build hook falló (${reason}): ${msg}`);
      });
  }
}
