import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * 테스트용 Guard 예시
 * 
 * 이 Guard는 query parameter의 test 값이 "seoul"인지 확인합니다.
 * 
 * 사용 예시:
 * ```typescript
 * @UseGuards(TestGuard)
 * @Get()
 * findAll() {
 *   return this.service.findAll();
 * }
 * ```
 */
@Injectable()
export class TestGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return request.query.test === 'seoul';
  }
}

