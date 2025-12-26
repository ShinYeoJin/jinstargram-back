# 최종 수정 가이드 - "relation jinstargram.users does not exist" 해결

## 문제 원인
TypeORM이 여전히 `jinstargram` 스키마를 찾고 있습니다.

## 해결 방법 (2단계 필수)

### 1단계: DBeaver에서 테이블을 public 스키마로 이동 (필수!)

DBeaver SQL Editor에서 다음 SQL 실행:

```sql
-- jinstargram 스키마의 users 테이블을 public 스키마로 이동
ALTER TABLE jinstargram.users SET SCHEMA public;
```

**실행 방법:**
1. DBeaver에서 Render PostgreSQL 연결
2. SQL Editor 열기 (Ctrl+\])
3. 위 SQL 복사/붙여넣기
4. 실행 (Ctrl+Enter)
5. 성공 메시지 확인

### 2단계: GitHub에 푸시 및 재배포

```bash
cd backend
git add src/config/typeorm.config.ts src/users/entities/user.entity.ts
git commit -m "Fix: Remove schema reference, use public schema"
git push origin master
```

## 확인 사항

### DBeaver에서 테이블 위치 확인:
```sql
-- public 스키마에 users 테이블이 있는지 확인
SELECT * FROM public.users;
```

### 테이블이 어느 스키마에 있는지 확인:
```sql
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'users';
```

결과가 `public | users`로 나와야 합니다.

## 중요!
- **1단계(DBeaver SQL 실행)를 반드시 먼저 해야 합니다!**
- 테이블이 public 스키마에 있어야 TypeORM이 찾을 수 있습니다.
- 코드만 수정하고 테이블을 이동하지 않으면 여전히 에러가 발생합니다.

