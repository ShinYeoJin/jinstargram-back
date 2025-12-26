# DBeaver에서 users 테이블 생성하기

## 1단계: DBeaver에서 Render PostgreSQL 연결

1. DBeaver 실행
2. Database Navigator에서 PostgreSQL 연결 확인
   - 연결이 없다면: 우클릭 → New Database Connection → PostgreSQL 선택
   - Host: Render PostgreSQL 호스트 주소
   - Port: 5432
   - Database: 데이터베이스 이름 (예: jinstargram 또는 todo_back)
   - Username/Password: Render에서 제공한 정보
   - SSL Mode: require

## 2단계: SQL Editor 열기

1. Render PostgreSQL 연결을 우클릭
2. "SQL Editor" → "Open SQL Script" 선택
   - 또는 단축키: Ctrl+\] (Windows) / Cmd+\] (Mac)

## 3단계: SQL 실행

1. `DATABASE_SETUP.sql` 파일의 내용을 SQL Editor에 붙여넣기
2. 전체 SQL 선택 (Ctrl+A)
3. 실행 버튼 클릭 (▶️ 아이콘) 또는 Ctrl+Enter
4. 성공 메시지 확인

## 4단계: 테이블 생성 확인

SQL Editor에서 다음 쿼리 실행:

```sql
SELECT * FROM users;
```

에러가 나지 않고 빈 결과가 나오면 성공!

## 주의사항

- `CREATE TABLE IF NOT EXISTS`를 사용했으므로 테이블이 이미 있어도 에러가 나지 않습니다
- 처음 생성하는 경우 DROP TABLE 구문은 실행하지 마세요 (주석 처리되어 있음)

