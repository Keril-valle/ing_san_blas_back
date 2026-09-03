import { Injectable } from '@nestjs/common';

@Injectable()
export class LandingService {
  getLandingPage() {
    return {
      message: 'Bienvenido a San Blas',
      version: '1.0.0',
      status: 'online',
    };
  }
}
