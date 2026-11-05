-- ============================================================================
-- Snowflake x TVM hackathon: 2-minute preflight check
-- Run in a SQL worksheet with your dev role and dev warehouse selected.
-- 1. Fill in the three values below.  2. Run all (Cmd/Ctrl + Shift + Enter).
-- ============================================================================
SET TEAM         = '1';               -- your team number: 1, 2, 3 or 4
SET MARTS_DB     = '<MARTS_DB>';      -- database with TVM's mart tables
SET MARTS_SCHEMA = '<MARTS_SCHEMA>';  -- schema with TVM's mart tables

EXECUTE IMMEDIATE $$
DECLARE
  team      VARCHAR DEFAULT $TEAM;
  mdb       VARCHAR DEFAULT $MARTS_DB;
  msch      VARCHAR DEFAULT $MARTS_SCHEMA;
  role_name VARCHAR DEFAULT CURRENT_ROLE();
  wh        VARCHAR DEFAULT CURRENT_WAREHOUSE();
  db        VARCHAR;
  sch       VARCHAR;
  n_tables  INTEGER DEFAULT 0;
  tbls      VARCHAR DEFAULT '';
  first_tbl VARCHAR;
  ok_schema BOOLEAN DEFAULT FALSE;
  res       RESULTSET;
  r         ARRAY DEFAULT ARRAY_CONSTRUCT();
BEGIN

  -- 1 role + warehouse
  r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(1, 'Role', IFF(:role_name IS NULL, 'RED', 'GREEN'), COALESCE(:role_name, 'No role selected')));
  r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(2, 'Warehouse', IFF(:wh IS NULL, 'RED', 'GREEN'), COALESCE(:wh, 'Select a warehouse at the top right of the worksheet')));

  -- 2 Cortex
  BEGIN
    LET tok INTEGER := (SELECT SNOWFLAKE.CORTEX.COUNT_TOKENS('mistral-7b', 'hello TVM'));
    r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(3, 'Cortex', 'GREEN', 'Cortex functions work'));
  EXCEPTION WHEN OTHER THEN
    r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(3, 'Cortex', 'RED', LEFT(:sqlerrm, 120) || ' (Admin fix A)'));
  END;

  -- 3 read the marts
  BEGIN
    EXECUTE IMMEDIATE 'SHOW TABLES IN SCHEMA IDENTIFIER(''' || :mdb || '.' || :msch || ''')';
    SELECT COUNT(*), LISTAGG('      - name: ' || LOWER("name"), '\n') WITHIN GROUP (ORDER BY "name"), MIN(LOWER("name"))
      INTO :n_tables, :tbls, :first_tbl FROM TABLE(RESULT_SCAN(LAST_QUERY_ID()));
    EXECUTE IMMEDIATE 'SHOW VIEWS IN SCHEMA IDENTIFIER(''' || :mdb || '.' || :msch || ''')';
    LET qv VARCHAR := LAST_QUERY_ID();
    LET nv INTEGER := (SELECT COUNT(*) FROM TABLE(RESULT_SCAN(:qv)));
    LET vl VARCHAR := (SELECT LISTAGG('      - name: ' || LOWER("name"), '\n') WITHIN GROUP (ORDER BY "name") FROM TABLE(RESULT_SCAN(:qv)));
    IF (nv > 0) THEN tbls := IFF(:tbls = '' OR :tbls IS NULL, vl, :tbls || '\n' || vl); n_tables := :n_tables + nv; END IF;
    r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(5, 'Read the marts', IFF(:n_tables > 0, 'GREEN', 'RED'),
      :n_tables || ' tables/views visible in ' || :mdb || '.' || :msch || IFF(:n_tables > 0, '', ' (wrong name, or Admin fix B)')));
  EXCEPTION WHEN OTHER THEN
    r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(5, 'Read the marts', 'RED', :mdb || '.' || :msch || ': ' || LEFT(:sqlerrm, 150) || ' (check the name, or Admin fix B)'));
  END;

  -- 4 team schema: create HACK_TEAM_n in the current database, else fall back to the current schema
  db  := CURRENT_DATABASE();
  sch := 'HACK_TEAM_' || :team;
  BEGIN
    IF (:db IS NULL) THEN db := :mdb; END IF;
    EXECUTE IMMEDIATE 'CREATE SCHEMA IF NOT EXISTS IDENTIFIER(''' || :db || '.' || :sch || ''') COMMENT = ''Snowflake x TVM hackathon, team ' || :team || '''';
    ok_schema := TRUE;
    r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(6, 'Team schema', 'GREEN', :db || '.' || :sch || ' is ready'));
  EXCEPTION WHEN OTHER THEN
    r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(6, 'Team schema', 'RED', 'Cannot create ' || :db || '.' || :sch || ': ' || LEFT(:sqlerrm, 120) || ' (Admin fix C, or use a dev schema you own)'));
  END;

  -- 5 build test: semantic view + agent in the team schema, then clean up
  IF (:ok_schema AND :n_tables > 0) THEN
    BEGIN
      EXECUTE IMMEDIATE 'CREATE OR REPLACE SEMANTIC VIEW "' || :db || '"."' || :sch || '".PREFLIGHT_SV TABLES (t AS "' || :mdb || '"."' || :msch || '".' || :first_tbl || ') METRICS (t.row_count AS COUNT(*))';
      r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(7, 'Create a semantic view', 'GREEN', 'Test view on ' || :first_tbl || ' created and dropped'));
      EXECUTE IMMEDIATE 'DROP SEMANTIC VIEW IF EXISTS "' || :db || '"."' || :sch || '".PREFLIGHT_SV';
    EXCEPTION WHEN OTHER THEN
      r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(7, 'Create a semantic view', 'RED', LEFT(:sqlerrm, 160)));
    END;
    BEGIN
      EXECUTE IMMEDIATE 'CREATE OR REPLACE AGENT "' || :db || '"."' || :sch || '".PREFLIGHT_AGENT FROM SPECIFICATION $' || '$models:\n  orchestration: auto$' || '$';
      r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(8, 'Create an agent', 'GREEN', 'Test agent created and dropped'));
      EXECUTE IMMEDIATE 'DROP AGENT IF EXISTS "' || :db || '"."' || :sch || '".PREFLIGHT_AGENT';
    EXCEPTION WHEN OTHER THEN
      r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(8, 'Create an agent', 'RED', LEFT(:sqlerrm, 160) || ' (Admin fix A)'));
    END;
  ELSE
    r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(7, 'Create a semantic view', 'SKIPPED', 'Needs checks 5 and 6'));
    r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(8, 'Create an agent', 'SKIPPED', 'Needs checks 5 and 6'));
  END IF;

  -- 6 the two files to paste into your project
  r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(9, 'PASTE INTO dbt_projects_profiles.yml', 'COPY',
    'tvm_hackathon:\n  target: team_' || :team || '\n  outputs:\n    team_' || :team || ':\n      type: snowflake\n      account: ''not needed''\n      user: ''not needed''\n' ||
    '      role: ' || COALESCE(:role_name, '<DEV_ROLE>') || '\n      warehouse: ' || COALESCE(:wh, '<DEV_WH>') || '\n      database: ' || COALESCE(:db, '<DEV_DB>') ||
    '\n      schema: ' || :sch || '\n      threads: 4\n      query_tag: tvm_hackathon\n'));
  r := ARRAY_APPEND(r, ARRAY_CONSTRUCT(10, 'PASTE INTO models/_marts_sources.yml', 'COPY',
    'version: 2\nsources:\n  - name: tvm_marts\n    database: ' || :mdb || '\n    schema: ' || :msch || '\n    tables:\n' || COALESCE(:tbls, '      - name: <table>') || '\n'));

  LET js VARCHAR := TO_JSON(:r);
  res := (SELECT v.value[0]::INT AS "#", v.value[1]::VARCHAR AS "Check", v.value[2]::VARCHAR AS "Status", v.value[3]::VARCHAR AS "Detail / what to copy"
          FROM TABLE(FLATTEN(INPUT => PARSE_JSON(:js))) v ORDER BY 1);
  RETURN TABLE(res);
END;
$$;

-- ============================================================================
-- Anything RED with "Admin fix"? Send this to the TVM admin (2 minutes, ACCOUNTADMIN or SECURITYADMIN):
--   A) GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER       TO ROLE <DEV_ROLE>;
--      GRANT DATABASE ROLE SNOWFLAKE.CORTEX_AGENT_USER TO ROLE <DEV_ROLE>;
--   B) GRANT USAGE ON DATABASE <MARTS_DB> TO ROLE <DEV_ROLE>;
--      GRANT USAGE ON SCHEMA <MARTS_DB>.<MARTS_SCHEMA> TO ROLE <DEV_ROLE>;
--      GRANT SELECT ON ALL TABLES IN SCHEMA <MARTS_DB>.<MARTS_SCHEMA> TO ROLE <DEV_ROLE>;
--   C) GRANT CREATE SCHEMA ON DATABASE <DEV_DB> TO ROLE <DEV_ROLE>;
-- ============================================================================
