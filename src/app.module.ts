import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './Auth/auth.module';
import { UsuarioModule } from './Users/usuario.module';
import { Usuario } from './Users/Entities/usuario.entity';

@Module({
  imports: [
    // Configuración de TypeORM con SQLite en memoria para desarrollo y pruebas.
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',  // BD en RAM, no requiere servidor
      entities: [Usuario],
      synchronize: true,
    }),
    UsuarioModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
