import { Equipment, LogField, LogEntry, User, AuditRecord } from '../types';
import { hashPassword, fmtDT } from '../utils/dateTime';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    fullName: 'System Administrator',
    passwordHash: hashPassword('admin123'),
    role: 'Admin',
    createdAt: Date.now() - 86400000 * 30
  },
  {
    id: 'usr_sarah',
    username: 'sjenkins',
    fullName: 'Dr. Sarah Jenkins',
    passwordHash: hashPassword('pass123'),
    role: 'Operator',
    createdAt: Date.now() - 86400000 * 20
  },
  {
    id: 'usr_mark',
    username: 'mchen',
    fullName: 'Mark Chen (Lead Chemist)',
    passwordHash: hashPassword('pass123'),
    role: 'Operator',
    createdAt: Date.now() - 86400000 * 15
  }
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq_autoclave_1',
    name: 'Autoclave Sterilizer A-01',
    model: 'Tuttnauer 3870EL',
    serialNo: 'SN-948201-B',
    location: 'Cleanroom Suite B-2',
    status: 'Active',
    notes: 'Calibrated annually. Temperature sensor PT100 verified.',
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    id: 'eq_hplc_1260',
    name: 'HPLC Agilent 1260 Infinity II',
    model: 'G7111B Quaternary Pump',
    serialNo: 'DE-AG7723-QC',
    location: 'QC Analytical Lab 4',
    status: 'Active',
    notes: 'Equipped with DAD UV-Vis Detector and Temperature Controlled Autosampler.',
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    id: 'eq_bsc_04',
    name: 'Biosafety Cabinet BSC-04',
    model: 'Thermo Forma Class II A2',
    serialNo: 'TH-662901-MB',
    location: 'Microbiology Clean Bay',
    status: 'Active',
    notes: 'HEPA filter certified until Dec 2026. UV lamp cycle logged.',
    createdAt: Date.now() - 86400000 * 18,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: 'eq_tablet_press',
    name: 'Tablet Compression Press 2090i',
    model: 'Fette Compacting 2090i',
    serialNo: 'FT-884129-SD',
    location: 'Solid Dosage Production 1',
    status: 'Maintenance',
    notes: 'Scheduled periodic die turret cleaning and force transducer recalibration.',
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: 'eq_centrifuge_5810',
    name: 'Refrigerated Centrifuge 5810R',
    model: 'Eppendorf 5810R-15A',
    serialNo: 'EP-102938-SP',
    location: 'Sample Prep Lab',
    status: 'Active',
    notes: 'Fixed-angle rotor FA-45-6-30 inspected. Maximum RPM 14,000.',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 3
  }
];

export const INITIAL_FIELDS: LogField[] = [
  {
    id: 'batchNo',
    fieldKey: 'batchNo',
    name: 'Batch No.',
    type: 'text',
    required: true,
    enabled: true,
    system: true,
    sortOrder: 1
  },
  {
    id: 'startTime',
    fieldKey: 'startTime',
    name: 'Start Time',
    type: 'time',
    required: true,
    enabled: true,
    system: true,
    sortOrder: 2
  },
  {
    id: 'startUser',
    fieldKey: 'startUser',
    name: 'User Sign (Start)',
    type: 'sign',
    required: true,
    enabled: true,
    system: true,
    sortOrder: 3
  },
  {
    id: 'endTime',
    fieldKey: 'endTime',
    name: 'End Time',
    type: 'time',
    required: true,
    enabled: true,
    system: true,
    sortOrder: 4
  },
  {
    id: 'endUser',
    fieldKey: 'endUser',
    name: 'User Sign (End)',
    type: 'sign',
    required: true,
    enabled: true,
    system: true,
    sortOrder: 5
  },
  {
    id: 'roomTemp',
    fieldKey: 'roomTemp',
    name: 'Room Temp (°C)',
    type: 'number',
    required: false,
    enabled: true,
    system: false,
    sortOrder: 6
  },
  {
    id: 'pressureDiff',
    fieldKey: 'pressureDiff',
    name: 'Pressure Diff (Pa)',
    type: 'number',
    required: false,
    enabled: true,
    system: false,
    sortOrder: 7
  },
  {
    id: 'remark',
    fieldKey: 'remark',
    name: 'Remark / Status',
    type: 'text',
    required: false,
    enabled: true,
    system: true,
    sortOrder: 8
  }
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log_001',
    equipmentId: 'eq_autoclave_1',
    entryNo: '0001',
    values: {
      batchNo: 'BAT-2026-0811',
      startTime: '16/08/26 08.30',
      startUser: 'Dr. Sarah Jenkins',
      endTime: '16/08/26 10.45',
      endUser: 'Dr. Sarah Jenkins',
      roomTemp: '21.4',
      pressureDiff: '15',
      remark: 'Steam sterilization cycle 121°C for 20 mins completed successfully with chemical indicator pass.'
    },
    createdBy: 'Dr. Sarah Jenkins',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2
  },
  {
    id: 'log_002',
    equipmentId: 'eq_autoclave_1',
    entryNo: '0002',
    values: {
      batchNo: 'BAT-2026-0814',
      startTime: '17/08/26 13.15',
      startUser: 'Mark Chen (Lead Chemist)',
      endTime: '17/08/26 15.30',
      endUser: 'Mark Chen (Lead Chemist)',
      roomTemp: '22.0',
      pressureDiff: '18',
      remark: 'Sterilization of liquid media bottles (500mL x 12). Cycle complete, chamber vented.'
    },
    createdBy: 'Mark Chen (Lead Chemist)',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: 'log_003',
    equipmentId: 'eq_hplc_1260',
    entryNo: '0001',
    values: {
      batchNo: 'QC-HPLC-4412',
      startTime: '17/08/26 09.00',
      startUser: 'Dr. Sarah Jenkins',
      endTime: '17/08/26 17.20',
      endUser: 'Dr. Sarah Jenkins',
      roomTemp: '20.8',
      pressureDiff: '12',
      remark: 'Assay and Related Substances run (C18 4.6x150mm column). Backpressure stable at 145 bar.'
    },
    createdBy: 'Dr. Sarah Jenkins',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: 'log_004',
    equipmentId: 'eq_bsc_04',
    entryNo: '0001',
    values: {
      batchNo: 'MB-PLATE-9902',
      startTime: '18/08/26 07.45',
      startUser: 'Mark Chen (Lead Chemist)',
      endTime: '18/08/26 11.00',
      endUser: 'Mark Chen (Lead Chemist)',
      roomTemp: '21.2',
      pressureDiff: '20',
      remark: 'Aseptic environmental monitoring plating. 70% IPA surface sanitization before & after run.'
    },
    createdBy: 'Mark Chen (Lead Chemist)',
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4
  }
];

export const INITIAL_AUDIT: AuditRecord[] = [
  {
    id: 'aud_001',
    timestamp: Date.now() - 86400000 * 30,
    dtDisplay: fmtDT(Date.now() - 86400000 * 30),
    user: 'System Administrator',
    action: 'Add',
    entityType: 'User',
    entityName: 'System Administrator',
    details: 'Initial SQLite database bootstrap and administrative root account setup'
  },
  {
    id: 'aud_002',
    timestamp: Date.now() - 86400000 * 25,
    dtDisplay: fmtDT(Date.now() - 86400000 * 25),
    user: 'System Administrator',
    action: 'Add',
    entityType: 'Equipment',
    entityName: 'Autoclave Sterilizer A-01',
    details: 'Registered equipment in SQLite relational table tbl_Equipment'
  },
  {
    id: 'aud_003',
    timestamp: Date.now() - 86400000 * 2,
    dtDisplay: fmtDT(Date.now() - 86400000 * 2),
    user: 'Dr. Sarah Jenkins',
    action: 'Add',
    entityType: 'Log Entry',
    entityName: 'Autoclave Sterilizer A-01 #0001',
    details: 'Recorded equipment log with electronic start & end signatures'
  },
  {
    id: 'aud_004',
    timestamp: Date.now() - 3600000 * 4,
    dtDisplay: fmtDT(Date.now() - 3600000 * 4),
    user: 'Mark Chen (Lead Chemist)',
    action: 'Add',
    entityType: 'Log Entry',
    entityName: 'Biosafety Cabinet BSC-04 #0001',
    details: 'Logged microbiological aseptic operations batch MB-PLATE-9902'
  }
];
