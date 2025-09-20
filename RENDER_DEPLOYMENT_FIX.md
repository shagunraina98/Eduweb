# CRITICAL FIX NEEDED FOR RENDER DEPLOYMENT

## Error Details:
```
List questions error: Error: Unknown column 'q.question_text' in 'field list'
Location: /opt/render/project/src/routes/questions.js:85:31
SQL: SELECT q.id AS question_id, q.`question_text`, q.`subject`, q.`difficulty`, q.`type`
```

## Root Cause:
The deployed backend on Render still has OLD CODE that references `question_text` column, but the database has `text` column.

## FILES THAT MUST BE UPDATED ON RENDER:

### 1. routes/questions.js (Line ~85)
**CHANGE FROM:**
```sql
SELECT q.id AS question_id, q.`question_text`, q.`subject`, q.`difficulty`, q.`type`,
```

**CHANGE TO:**
```sql
SELECT q.id AS question_id, q.`text`, q.`subject`, q.`difficulty`, q.`type`,
```

### 2. routes/questions.js (POST route - Line ~27)
**CHANGE FROM:**
```sql
INSERT INTO `questions` (`question_text`, `text`, `subject`, `difficulty`, `type`) VALUES (?, ?, ?, ?, ?)
```

**CHANGE TO:**
```sql
INSERT INTO `questions` (`text`, `subject`, `difficulty`, `type`) VALUES (?, ?, ?, ?)
```

### 3. routes/questions.js (PUT route - Line ~159)
**CHANGE FROM:**
```javascript
if (text) { fields.push('`question_text` = ?, `text` = ?'); values.push(text, text); }
```

**CHANGE TO:**
```javascript
if (text) { fields.push('`text` = ?'); values.push(text); }
```

### 4. routes/quiz.js (Line ~26)
**CHANGE FROM:**
```sql
SELECT q.id, q.`question_text` AS text, q.`subject`, q.`difficulty`, q.`type`
```

**CHANGE TO:**
```sql
SELECT q.id, q.`text`, q.`subject`, q.`difficulty`, q.`type`
```

## DEPLOYMENT STEPS:
1. ✅ Push updated routes/questions.js and routes/quiz.js to GitHub
2. ⚠️  **REDEPLOY ON RENDER** - This is critical!
3. ✅ Test API endpoints

## CURRENT STATUS:
- ✅ Local code: FIXED (all references corrected)
- ❌ Render deployment: OLD CODE (causing the error)
- ✅ Database schema: CORRECT (uses `text` column)

**THE ERROR WILL PERSIST UNTIL RENDER IS REDEPLOYED WITH THE UPDATED CODE.**