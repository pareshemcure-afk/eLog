import { sqliteEngine } from './sqliteEngine';
import { fmtDT, fmtDate } from '../utils/dateTime';

export interface AccessExportOptions {
  includeEquipment?: boolean;
  includeLogs?: boolean;
  includeFields?: boolean;
  includeAudit?: boolean;
  includeUsers?: boolean;
}

/**
 * Generates Microsoft Access XML file with embedded XSD Schema.
 * Supported natively by Microsoft Access: External Data -> XML File -> Import Tables and Data.
 */
export function generateAccessXml(): string {
  const equipment = sqliteEngine.getEquipment();
  const fields = sqliteEngine.getFields();
  const logs = sqliteEngine.getLogEntries();
  const audit = sqliteEngine.getAuditTrail();
  const users = sqliteEngine.getUsers();

  const xmlParts: string[] = [];
  xmlParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  xmlParts.push(`<dataroot xmlns:od="urn:schemas-microsoft-com:officedata" generated="${new Date().toISOString()}">`);

  // Equipment table
  for (const eq of equipment) {
    xmlParts.push(`  <tbl_Equipment>`);
    xmlParts.push(`    <EquipmentID>${escapeXml(eq.id)}</EquipmentID>`);
    xmlParts.push(`    <EquipmentName>${escapeXml(eq.name)}</EquipmentName>`);
    xmlParts.push(`    <Model>${escapeXml(eq.model || '')}</Model>`);
    xmlParts.push(`    <SerialNumber>${escapeXml(eq.serialNo || '')}</SerialNumber>`);
    xmlParts.push(`    <Location>${escapeXml(eq.location || '')}</Location>`);
    xmlParts.push(`    <Status>${escapeXml(eq.status)}</Status>`);
    xmlParts.push(`    <Notes>${escapeXml(eq.notes || '')}</Notes>`);
    xmlParts.push(`    <CreatedAt>${fmtDT(eq.createdAt)}</CreatedAt>`);
    xmlParts.push(`    <UpdatedAt>${fmtDT(eq.updatedAt)}</UpdatedAt>`);
    xmlParts.push(`  </tbl_Equipment>`);
  }

  // Log Fields table
  for (const f of fields) {
    xmlParts.push(`  <tbl_LogFields>`);
    xmlParts.push(`    <FieldID>${escapeXml(f.id)}</FieldID>`);
    xmlParts.push(`    <FieldKey>${escapeXml(f.fieldKey)}</FieldKey>`);
    xmlParts.push(`    <FieldName>${escapeXml(f.name)}</FieldName>`);
    xmlParts.push(`    <FieldType>${escapeXml(f.type)}</FieldType>`);
    xmlParts.push(`    <IsRequired>${f.required ? 'Yes' : 'No'}</IsRequired>`);
    xmlParts.push(`    <IsEnabled>${f.enabled ? 'Yes' : 'No'}</IsEnabled>`);
    xmlParts.push(`    <IsSystem>${f.system ? 'Yes' : 'No'}</IsSystem>`);
    xmlParts.push(`    <SortOrder>${f.sortOrder}</SortOrder>`);
    xmlParts.push(`    <OptionsList>${escapeXml(f.options ? f.options.join(', ') : '')}</OptionsList>`);
    xmlParts.push(`  </tbl_LogFields>`);
  }

  // Log Entries table
  for (const l of logs) {
    const eq = equipment.find(e => e.id === l.equipmentId);
    xmlParts.push(`  <tbl_LogEntries>`);
    xmlParts.push(`    <LogEntryID>${escapeXml(l.id)}</LogEntryID>`);
    xmlParts.push(`    <EquipmentID>${escapeXml(l.equipmentId)}</EquipmentID>`);
    xmlParts.push(`    <EquipmentName>${escapeXml(eq ? eq.name : '')}</EquipmentName>`);
    xmlParts.push(`    <EntryNumber>${escapeXml(l.entryNo)}</EntryNumber>`);
    xmlParts.push(`    <BatchNumber>${escapeXml(l.values.batchNo || '')}</BatchNumber>`);
    xmlParts.push(`    <StartTime>${escapeXml(l.values.startTime || '')}</StartTime>`);
    xmlParts.push(`    <StartUserSign>${escapeXml(l.values.startUser || '')}</StartUserSign>`);
    xmlParts.push(`    <EndTime>${escapeXml(l.values.endTime || '')}</EndTime>`);
    xmlParts.push(`    <EndUserSign>${escapeXml(l.values.endUser || '')}</EndUserSign>`);
    xmlParts.push(`    <RoomTemp>${escapeXml(l.values.roomTemp || '')}</RoomTemp>`);
    xmlParts.push(`    <PressureDiff>${escapeXml(l.values.pressureDiff || '')}</PressureDiff>`);
    xmlParts.push(`    <Remark>${escapeXml(l.values.remark || '')}</Remark>`);
    xmlParts.push(`    <CreatedBy>${escapeXml(l.createdBy)}</CreatedBy>`);
    xmlParts.push(`    <CreatedAt>${fmtDT(l.createdAt)}</CreatedAt>`);
    xmlParts.push(`  </tbl_LogEntries>`);
  }

  // Audit Trail table
  for (const a of audit) {
    xmlParts.push(`  <tbl_AuditTrail>`);
    xmlParts.push(`    <AuditID>${escapeXml(a.id)}</AuditID>`);
    xmlParts.push(`    <Timestamp>${escapeXml(a.dtDisplay)}</Timestamp>`);
    xmlParts.push(`    <UserName>${escapeXml(a.user)}</UserName>`);
    xmlParts.push(`    <Action>${escapeXml(a.action)}</Action>`);
    xmlParts.push(`    <EntityType>${escapeXml(a.entityType)}</EntityType>`);
    xmlParts.push(`    <EntityName>${escapeXml(a.entityName || '')}</EntityName>`);
    xmlParts.push(`    <Details>${escapeXml(a.details || '')}</Details>`);
    xmlParts.push(`  </tbl_AuditTrail>`);
  }

  // Users table
  for (const u of users) {
    xmlParts.push(`  <tbl_Users>`);
    xmlParts.push(`    <UserID>${escapeXml(u.id)}</UserID>`);
    xmlParts.push(`    <Username>${escapeXml(u.username)}</Username>`);
    xmlParts.push(`    <FullName>${escapeXml(u.fullName)}</FullName>`);
    xmlParts.push(`    <Role>${escapeXml(u.role)}</Role>`);
    xmlParts.push(`    <CreatedAt>${fmtDate(u.createdAt)}</CreatedAt>`);
    xmlParts.push(`  </tbl_Users>`);
  }

  xmlParts.push(`</dataroot>`);
  return xmlParts.join('\n');
}

/**
 * Generates Microsoft Access VBA Auto-Builder Script (.bas).
 * Can be pasted into MS Access Visual Basic Editor (Alt + F11) -> Insert Module -> Run
 * to create the complete Access ACCDB database with Tables, Relations, and Queries automatically.
 */
export function generateAccessVbaScript(): string {
  const equipment = sqliteEngine.getEquipment();
  const fields = sqliteEngine.getFields();
  const logs = sqliteEngine.getLogEntries();
  const audit = sqliteEngine.getAuditTrail();
  const users = sqliteEngine.getUsers();

  return `' =========================================================================
' eLOG System - Microsoft Access Auto-Builder Module
' Paste this module into Microsoft Access (Alt + F11 -> Insert -> Module)
' Run Sub BuildElogAccessDatabase() to construct tables, relationships & data.
' =========================================================================
Option Compare Database
Option Explicit

Public Sub BuildElogAccessDatabase()
    Dim db As DAO.Database
    Dim tdf As DAO.TableDef
    Dim rel As DAO.Relation
    Dim fld As DAO.Field
    Dim rs As DAO.Recordset
    
    Set db = CurrentDb
    On Error Resume Next

    ' 1. Create tbl_Equipment
    db.Execute "DROP TABLE tbl_Equipment;"
    db.Execute "CREATE TABLE tbl_Equipment (" & _
               "EquipmentID VARCHAR(50) PRIMARY KEY, " & _
               "EquipmentName VARCHAR(255) NOT NULL, " & _
               "Model VARCHAR(150), " & _
               "SerialNumber VARCHAR(100), " & _
               "Location VARCHAR(150), " & _
               "Status VARCHAR(50), " & _
               "Notes LONGTEXT, " & _
               "CreatedAt DATETIME, " & _
               "UpdatedAt DATETIME);"

    ' 2. Create tbl_LogFields
    db.Execute "DROP TABLE tbl_LogFields;"
    db.Execute "CREATE TABLE tbl_LogFields (" & _
               "FieldID VARCHAR(50) PRIMARY KEY, " & _
               "FieldKey VARCHAR(100) NOT NULL, " & _
               "FieldName VARCHAR(255) NOT NULL, " & _
               "FieldType VARCHAR(50), " & _
               "IsRequired YESNO, " & _
               "IsEnabled YESNO, " & _
               "IsSystem YESNO, " & _
               "SortOrder INTEGER, " & _
               "OptionsList LONGTEXT);"

    ' 3. Create tbl_LogEntries
    db.Execute "DROP TABLE tbl_LogEntries;"
    db.Execute "CREATE TABLE tbl_LogEntries (" & _
               "LogEntryID VARCHAR(50) PRIMARY KEY, " & _
               "EquipmentID VARCHAR(50) REFERENCES tbl_Equipment(EquipmentID), " & _
               "EntryNumber VARCHAR(20), " & _
               "BatchNumber VARCHAR(100), " & _
               "StartTime VARCHAR(30), " & _
               "StartUserSign VARCHAR(150), " & _
               "EndTime VARCHAR(30), " & _
               "EndUserSign VARCHAR(150), " & _
               "RoomTemp VARCHAR(50), " & _
               "PressureDiff VARCHAR(50), " & _
               "Remark LONGTEXT, " & _
               "CreatedBy VARCHAR(150), " & _
               "CreatedAt DATETIME);"

    ' 4. Create tbl_AuditTrail
    db.Execute "DROP TABLE tbl_AuditTrail;"
    db.Execute "CREATE TABLE tbl_AuditTrail (" & _
               "AuditID VARCHAR(50) PRIMARY KEY, " & _
               "Timestamp VARCHAR(30), " & _
               "UserName VARCHAR(150), " & _
               "Action VARCHAR(50), " & _
               "EntityType VARCHAR(50), " & _
               "EntityName VARCHAR(255), " & _
               "Details LONGTEXT);"

    ' 5. Create tbl_Users
    db.Execute "DROP TABLE tbl_Users;"
    db.Execute "CREATE TABLE tbl_Users (" & _
               "UserID VARCHAR(50) PRIMARY KEY, " & _
               "Username VARCHAR(100) NOT NULL, " & _
               "FullName VARCHAR(150), " & _
               "Role VARCHAR(50), " & _
               "CreatedAt DATETIME);"

    On Error GoTo ErrHandler

    ' Populate Equipment
    Set rs = db.OpenRecordset("tbl_Equipment", dbOpenDynaset)
${equipment
  .map(
    eq => `    rs.AddNew
    rs!EquipmentID = "${escapeVba(eq.id)}"
    rs!EquipmentName = "${escapeVba(eq.name)}"
    rs!Model = "${escapeVba(eq.model || '')}"
    rs!SerialNumber = "${escapeVba(eq.serialNo || '')}"
    rs!Location = "${escapeVba(eq.location || '')}"
    rs!Status = "${escapeVba(eq.status)}"
    rs!Notes = "${escapeVba(eq.notes || '')}"
    rs.Update`
  )
  .join('\n')}
    rs.Close

    ' Populate Log Entries
    Set rs = db.OpenRecordset("tbl_LogEntries", dbOpenDynaset)
${logs
  .map(
    l => `    rs.AddNew
    rs!LogEntryID = "${escapeVba(l.id)}"
    rs!EquipmentID = "${escapeVba(l.equipmentId)}"
    rs!EntryNumber = "${escapeVba(l.entryNo)}"
    rs!BatchNumber = "${escapeVba(l.values.batchNo || '')}"
    rs!StartTime = "${escapeVba(l.values.startTime || '')}"
    rs!StartUserSign = "${escapeVba(l.values.startUser || '')}"
    rs!EndTime = "${escapeVba(l.values.endTime || '')}"
    rs!EndUserSign = "${escapeVba(l.values.endUser || '')}"
    rs!RoomTemp = "${escapeVba(l.values.roomTemp || '')}"
    rs!PressureDiff = "${escapeVba(l.values.pressureDiff || '')}"
    rs!Remark = "${escapeVba(l.values.remark || '')}"
    rs!CreatedBy = "${escapeVba(l.createdBy)}"
    rs.Update`
  )
  .join('\n')}
    rs.Close

    ' Populate Users
    Set rs = db.OpenRecordset("tbl_Users", dbOpenDynaset)
${users
  .map(
    u => `    rs.AddNew
    rs!UserID = "${escapeVba(u.id)}"
    rs!Username = "${escapeVba(u.username)}"
    rs!FullName = "${escapeVba(u.fullName)}"
    rs!Role = "${escapeVba(u.role)}"
    rs.Update`
  )
  .join('\n')}
    rs.Close

    ' Create Access Saved Queries
    db.Execute "CREATE VIEW qry_EquipmentActiveLogs AS " & _
               "SELECT E.EquipmentName, E.Location, E.Status, L.EntryNumber, L.BatchNumber, L.StartTime, L.StartUserSign, L.EndTime, L.EndUserSign, L.Remark " & _
               "FROM tbl_Equipment AS E INNER JOIN tbl_LogEntries AS L ON E.EquipmentID = L.EquipmentID;"

    MsgBox "eLOG Microsoft Access Database Structure and Data successfully built!", vbInformation, "eLOG MS Access Engine"
    Exit Sub

ErrHandler:
    MsgBox "Error: " & Err.Description, vbCritical, "Build Error"
End Sub
`;
}

/**
 * Generates Jet / ACE SQL statements for MS Access.
 */
export function generateAccessSqlScript(): string {
  const equipment = sqliteEngine.getEquipment();
  const fields = sqliteEngine.getFields();
  const logs = sqliteEngine.getLogEntries();
  const audit = sqliteEngine.getAuditTrail();
  const users = sqliteEngine.getUsers();

  const lines: string[] = [
    '-- ==============================================================',
    '-- Microsoft Access SQL Schema & Data Export Script',
    '-- Target: Microsoft Access 2016 / 2019 / 2021 / Microsoft 365',
    `-- Exported At: ${fmtDT(new Date())}`,
    '-- ==============================================================\n'
  ];

  lines.push(`CREATE TABLE tbl_Equipment (`);
  lines.push(`  EquipmentID VARCHAR(50) PRIMARY KEY,`);
  lines.push(`  EquipmentName VARCHAR(255) NOT NULL,`);
  lines.push(`  Model VARCHAR(150),`);
  lines.push(`  SerialNumber VARCHAR(100),`);
  lines.push(`  Location VARCHAR(150),`);
  lines.push(`  Status VARCHAR(50),`);
  lines.push(`  Notes LONGTEXT`);
  lines.push(`);\n`);

  lines.push(`CREATE TABLE tbl_LogFields (`);
  lines.push(`  FieldID VARCHAR(50) PRIMARY KEY,`);
  lines.push(`  FieldKey VARCHAR(100) NOT NULL,`);
  lines.push(`  FieldName VARCHAR(255) NOT NULL,`);
  lines.push(`  FieldType VARCHAR(50),`);
  lines.push(`  IsRequired YESNO,`);
  lines.push(`  IsEnabled YESNO,`);
  lines.push(`  IsSystem YESNO,`);
  lines.push(`  SortOrder INTEGER,`);
  lines.push(`  OptionsList LONGTEXT`);
  lines.push(`);\n`);

  lines.push(`CREATE TABLE tbl_LogEntries (`);
  lines.push(`  LogEntryID VARCHAR(50) PRIMARY KEY,`);
  lines.push(`  EquipmentID VARCHAR(50) REFERENCES tbl_Equipment(EquipmentID),`);
  lines.push(`  EntryNumber VARCHAR(20),`);
  lines.push(`  BatchNumber VARCHAR(100),`);
  lines.push(`  StartTime VARCHAR(30),`);
  lines.push(`  StartUserSign VARCHAR(150),`);
  lines.push(`  EndTime VARCHAR(30),`);
  lines.push(`  EndUserSign VARCHAR(150),`);
  lines.push(`  RoomTemp VARCHAR(50),`);
  lines.push(`  PressureDiff VARCHAR(50),`);
  lines.push(`  Remark LONGTEXT,`);
  lines.push(`  CreatedBy VARCHAR(150)`);
  lines.push(`);\n`);

  lines.push(`CREATE TABLE tbl_AuditTrail (`);
  lines.push(`  AuditID VARCHAR(50) PRIMARY KEY,`);
  lines.push(`  Timestamp VARCHAR(30),`);
  lines.push(`  UserName VARCHAR(150),`);
  lines.push(`  Action VARCHAR(50),`);
  lines.push(`  EntityType VARCHAR(50),`);
  lines.push(`  EntityName VARCHAR(255),`);
  lines.push(`  Details LONGTEXT`);
  lines.push(`);\n`);

  lines.push(`CREATE TABLE tbl_Users (`);
  lines.push(`  UserID VARCHAR(50) PRIMARY KEY,`);
  lines.push(`  Username VARCHAR(100) NOT NULL,`);
  lines.push(`  FullName VARCHAR(150),`);
  lines.push(`  Role VARCHAR(50)`);
  lines.push(`);\n`);

  // Inserts
  for (const eq of equipment) {
    lines.push(
      `INSERT INTO tbl_Equipment (EquipmentID, EquipmentName, Model, SerialNumber, Location, Status, Notes) VALUES ('${escapeSql(eq.id)}', '${escapeSql(eq.name)}', '${escapeSql(eq.model || '')}', '${escapeSql(eq.serialNo || '')}', '${escapeSql(eq.location || '')}', '${escapeSql(eq.status)}', '${escapeSql(eq.notes || '')}');`
    );
  }

  for (const l of logs) {
    lines.push(
      `INSERT INTO tbl_LogEntries (LogEntryID, EquipmentID, EntryNumber, BatchNumber, StartTime, StartUserSign, EndTime, EndUserSign, RoomTemp, PressureDiff, Remark, CreatedBy) VALUES ('${escapeSql(l.id)}', '${escapeSql(l.equipmentId)}', '${escapeSql(l.entryNo)}', '${escapeSql(l.values.batchNo || '')}', '${escapeSql(l.values.startTime || '')}', '${escapeSql(l.values.startUser || '')}', '${escapeSql(l.values.endTime || '')}', '${escapeSql(l.values.endUser || '')}', '${escapeSql(l.values.roomTemp || '')}', '${escapeSql(l.values.pressureDiff || '')}', '${escapeSql(l.values.remark || '')}', '${escapeSql(l.createdBy)}');`
    );
  }

  return lines.join('\n');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function escapeVba(str: string): string {
  return str.replace(/"/g, '""').replace(/\n/g, ' ');
}
