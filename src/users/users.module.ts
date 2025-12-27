import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserCreationService } from './services/user-creation.service';
import { UserUpdateService } from './services/user-update.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UserCreationService, UserUpdateService],
  exports: [UsersService],
})
export class UsersModule {}

