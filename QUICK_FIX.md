# 긴급 수정 가이드 (18시 전 제출용)

## 문제: "relation users does not exist" 에러

## 해결 방법 2가지 (빠른 방법 선택)

### 방법 1: Render 환경 변수 확인 (가장 빠름)

Render 대시보드에서:
1. Backend Web Service → Environment
2. 다음 환경 변수 확인/추가:
   - `DB_DATABASE` = `todo_back` (확인)
   - `DB_SCHEMA` = `jinstargram` (없으면 추가)

### 방법 2: DBeaver에서 public 스키마로 테이블 이동 (더 확실함)

DBeaver에서 다음 SQL 실행:

```sql
-- jinstargram 스키마의 users 테이블을 public 스키마로 이동
ALTER TABLE jinstargram.users SET SCHEMA public;
```

그리고 Entity 수정:
- `@Entity('users', { schema: 'jinstargram' })` → `@Entity('users')`

