import * as XLSX from 'xlsx';

export type ImportType = 'members' | 'first_timers' | 'families' | 'groups';

// Separate the row data from metadata
export interface ParsedRowData {
    [key: string]: string | undefined;
}

export interface ParsedRow {
    rowNumber: number;
    data: ParsedRowData;
}

export interface InvalidRow {
    rowNumber: number;
    data: ParsedRowData;
    errors: string[];
}

export interface ValidationResult {
    validRows: ParsedRow[];
    invalidRows: InvalidRow[];
    totalRows: number;
}

export interface ImportConfig {
    templateFileName: string;
    entityName: string;
    headers: string[];
    requiredFields: string[];
    previewColumns: string[];
    sampleData: string[];
    fieldValidators: Record<string, (value: string) => string | null>;
    transformRow: (row: ParsedRowData) => Record<string, any>;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation (basic - allows various formats)
const phoneRegex = /^[\d\s\-+()]{7,20}$/;

// Date validation (YYYY-MM-DD)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const IMPORT_CONFIGS: Record<ImportType, ImportConfig> = {
    members: {
        templateFileName: 'members_import_template.csv',
        entityName: 'Member',
        headers: [
            'first_name',
            'last_name',
            'email',
            'phone',
            'gender',
            'marital_status',
            'date_of_birth',
            'wedding_anniversary',
            'address',
            'city',
            'state',
            'country',
            'postal_code',
            'notes',
        ],
        requiredFields: ['first_name', 'last_name'],
        previewColumns: ['first_name', 'last_name', 'email', 'phone', 'gender'],
        sampleData: [
            'John',
            'Doe',
            'john.doe@example.com',
            '+1234567890',
            'male',
            'married',
            '1990-05-15',
            '2015-06-20',
            '123 Main Street',
            'New York',
            'NY',
            'United States',
            '10001',
            'Sample member note',
        ],
        fieldValidators: {
            first_name: (value: string) => {
                if (!value || value.trim().length < 2) {
                    return 'First name must be at least 2 characters';
                }
                if (value.length > 50) {
                    return 'First name must be less than 50 characters';
                }
                return null;
            },
            last_name: (value: string) => {
                if (!value || value.trim().length < 2) {
                    return 'Last name must be at least 2 characters';
                }
                if (value.length > 50) {
                    return 'Last name must be less than 50 characters';
                }
                return null;
            },
            email: (value: string) => {
                if (value && !emailRegex.test(value)) {
                    return 'Invalid email format';
                }
                return null;
            },
            phone: (value: string) => {
                if (value && !phoneRegex.test(value)) {
                    return 'Invalid phone format';
                }
                return null;
            },
            gender: (value: string) => {
                if (value && !['male', 'female', 'other'].includes(value.toLowerCase())) {
                    return 'Gender must be male, female, or other';
                }
                return null;
            },
            marital_status: (value: string) => {
                if (value && !['single', 'married', 'divorced', 'widowed'].includes(value.toLowerCase())) {
                    return 'Marital status must be single, married, divorced, or widowed';
                }
                return null;
            },
            date_of_birth: (value: string) => {
                if (value && !dateRegex.test(value)) {
                    return 'Date of birth must be in YYYY-MM-DD format';
                }
                if (value) {
                    const date = new Date(value);
                    if (isNaN(date.getTime()) || date > new Date()) {
                        return 'Invalid date of birth';
                    }
                }
                return null;
            },
            wedding_anniversary: (value: string) => {
                if (value && !dateRegex.test(value)) {
                    return 'Wedding anniversary must be in YYYY-MM-DD format';
                }
                if (value) {
                    const date = new Date(value);
                    if (isNaN(date.getTime()) || date > new Date()) {
                        return 'Invalid wedding anniversary date';
                    }
                }
                return null;
            },
        },
        transformRow: (row: ParsedRowData) => ({
            firstName: row.first_name?.trim(),
            lastName: row.last_name?.trim(),
            email: row.email?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            gender: row.gender?.toLowerCase().trim() || undefined,
            maritalStatus: row.marital_status?.toLowerCase().trim() || undefined,
            dateOfBirth: row.date_of_birth?.trim() || undefined,
            weddingAnniversary: row.wedding_anniversary?.trim() || undefined,
            address: row.address?.trim() || undefined,
            city: row.city?.trim() || undefined,
            state: row.state?.trim() || undefined,
            country: row.country?.trim() || undefined,
            postalCode: row.postal_code?.trim() || undefined,
            notes: row.notes?.trim() || undefined,
        }),
    },
    first_timers: {
        templateFileName: 'first_timers_import_template.csv',
        entityName: 'First Timer',
        headers: [
            'first_name',
            'last_name',
            'email',
            'phone',
            'gender',
            'first_visit_date',
            'how_did_you_hear',
            'address',
            'city',
            'state',
            'country',
            'postal_code',
            'notes',
            'prayer_requests',
        ],
        requiredFields: ['first_name', 'last_name', 'first_visit_date'],
        previewColumns: ['first_name', 'last_name', 'email', 'phone', 'first_visit_date'],
        sampleData: [
            'Jane',
            'Smith',
            'jane.smith@example.com',
            '+1987654321',
            'female',
            '2024-01-15',
            'Friend',
            '456 Oak Avenue',
            'Los Angeles',
            'CA',
            'United States',
            '90001',
            'Interested in Bible study',
            'Prayer for family health',
        ],
        fieldValidators: {
            first_name: (value: string) => {
                if (!value || value.trim().length < 2) {
                    return 'First name must be at least 2 characters';
                }
                if (value.length > 50) {
                    return 'First name must be less than 50 characters';
                }
                return null;
            },
            last_name: (value: string) => {
                if (!value || value.trim().length < 2) {
                    return 'Last name must be at least 2 characters';
                }
                if (value.length > 50) {
                    return 'Last name must be less than 50 characters';
                }
                return null;
            },
            email: (value: string) => {
                if (value && !emailRegex.test(value)) {
                    return 'Invalid email format';
                }
                return null;
            },
            phone: (value: string) => {
                if (value && !phoneRegex.test(value)) {
                    return 'Invalid phone format';
                }
                return null;
            },
            gender: (value: string) => {
                if (value && !['male', 'female', 'other'].includes(value.toLowerCase())) {
                    return 'Gender must be male, female, or other';
                }
                return null;
            },
            first_visit_date: (value: string) => {
                if (!value) {
                    return 'First visit date is required';
                }
                if (!dateRegex.test(value)) {
                    return 'First visit date must be in YYYY-MM-DD format';
                }
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return 'Invalid first visit date';
                }
                return null;
            },
            how_did_you_hear: (value: string) => {
                return null; // Allow any value
            },
        },
        transformRow: (row: ParsedRowData) => ({
            firstName: row.first_name?.trim(),
            lastName: row.last_name?.trim(),
            email: row.email?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            gender: row.gender?.toLowerCase().trim() || undefined,
            firstVisitDate: row.first_visit_date?.trim(),
            howDidYouHear: row.how_did_you_hear?.trim() || undefined,
            address: row.address?.trim() || undefined,
            city: row.city?.trim() || undefined,
            state: row.state?.trim() || undefined,
            country: row.country?.trim() || undefined,
            postalCode: row.postal_code?.trim() || undefined,
            notes: row.notes?.trim() || undefined,
            prayerRequests: row.prayer_requests?.trim() || undefined,
        }),
    },
    families: {
        templateFileName: 'families_import_template.csv',
        entityName: 'Family',
        headers: [
            'name',
            'email',
            'home_phone',
            'address',
            'city',
            'state',
            'country',
            'postal_code',
            'wedding_anniversary',
            'notes',
        ],
        requiredFields: ['name'],
        previewColumns: ['name', 'email', 'home_phone', 'city', 'wedding_anniversary'],
        sampleData: [
            'The Smith Family',
            'smithfamily@example.com',
            '+1234567890',
            '123 Family Lane',
            'Chicago',
            'IL',
            'United States',
            '60601',
            '2010-06-15',
            'Active family in church',
        ],
        fieldValidators: {
            name: (value: string) => {
                if (!value || value.trim().length < 2) {
                    return 'Family name must be at least 2 characters';
                }
                if (value.length > 100) {
                    return 'Family name must be less than 100 characters';
                }
                return null;
            },
            email: (value: string) => {
                if (value && !emailRegex.test(value)) {
                    return 'Invalid email format';
                }
                return null;
            },
            home_phone: (value: string) => {
                if (value && !phoneRegex.test(value)) {
                    return 'Invalid phone format';
                }
                return null;
            },
            wedding_anniversary: (value: string) => {
                if (value && !dateRegex.test(value)) {
                    return 'Wedding anniversary must be in YYYY-MM-DD format';
                }
                if (value) {
                    const date = new Date(value);
                    if (isNaN(date.getTime()) || date > new Date()) {
                        return 'Invalid wedding anniversary date';
                    }
                }
                return null;
            },
        },
        transformRow: (row: ParsedRowData) => ({
            name: row.name?.trim(),
            email: row.email?.trim() || undefined,
            homePhone: row.home_phone?.trim() || undefined,
            address: row.address?.trim() || undefined,
            city: row.city?.trim() || undefined,
            state: row.state?.trim() || undefined,
            country: row.country?.trim() || undefined,
            postalCode: row.postal_code?.trim() || undefined,
            weddingAnniversary: row.wedding_anniversary?.trim() || undefined,
            notes: row.notes?.trim() || undefined,
        }),
    },
    groups: {
        templateFileName: 'groups_import_template.csv',
        entityName: 'Group',
        headers: [
            'name',
            'description',
            'group_type',
            'meeting_day',
            'meeting_time',
            'meeting_type',
            'location_address',
            'location_city',
            'max_members',
            'is_public',
        ],
        requiredFields: ['name'],
        previewColumns: ['name', 'description', 'group_type', 'meeting_day', 'meeting_type'],
        sampleData: [
            'Young Adults Fellowship',
            'A group for young adults aged 18-35',
            'Small Group',
            'Wednesday',
            '19:00',
            'hybrid',
            '123 Church Street',
            'New York',
            '30',
            'true',
        ],
        fieldValidators: {
            name: (value: string) => {
                if (!value || value.trim().length < 2) {
                    return 'Group name must be at least 2 characters';
                }
                if (value.length > 100) {
                    return 'Group name must be less than 100 characters';
                }
                return null;
            },
            meeting_day: (value: string) => {
                if (value) {
                    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    if (!validDays.includes(value.toLowerCase())) {
                        return 'Meeting day must be a valid day of the week';
                    }
                }
                return null;
            },
            meeting_time: (value: string) => {
                if (value) {
                    // Validate time format HH:MM
                    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                    if (!timeRegex.test(value)) {
                        return 'Meeting time must be in HH:MM format';
                    }
                }
                return null;
            },
            meeting_type: (value: string) => {
                if (value && !['physical', 'online', 'hybrid'].includes(value.toLowerCase())) {
                    return 'Meeting type must be physical, online, or hybrid';
                }
                return null;
            },
            max_members: (value: string) => {
                if (value) {
                    const num = parseInt(value);
                    if (isNaN(num) || num < 1 || num > 1000) {
                        return 'Max members must be a number between 1 and 1000';
                    }
                }
                return null;
            },
            is_public: (value: string) => {
                if (value && !['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
                    return 'Is public must be true/false, yes/no, or 1/0';
                }
                return null;
            },
        },
        transformRow: (row: ParsedRowData) => ({
            name: row.name?.trim(),
            description: row.description?.trim() || undefined,
            groupTypeName: row.group_type?.trim() || undefined, // Will need to match to groupTypeId
            defaultMeetingDay: row.meeting_day?.toLowerCase().trim() || undefined,
            defaultMeetingTime: row.meeting_time?.trim() || undefined,
            defaultMeetingType: row.meeting_type?.toLowerCase().trim() || 'physical',
            defaultLocationAddress: row.location_address?.trim() || undefined,
            defaultLocationCity: row.location_city?.trim() || undefined,
            maxMembers: row.max_members ? parseInt(row.max_members) : undefined,
            isPublic: row.is_public ? ['true', '1', 'yes'].includes(row.is_public.toLowerCase()) : true,
        }),
    },
};

export async function parseImportFile(
    file: File,
    importType: ImportType
): Promise<ParsedRow[]> {
    const config = IMPORT_CONFIGS[importType];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
        return parseCSV(file, config.headers);
    } else if (['xlsx', 'xls'].includes(extension || '')) {
        return parseExcel(file, config.headers);
    } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
    }
}

async function parseCSV(file: File, expectedHeaders: string[]): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                let text = event.target?.result as string;

                // Remove BOM if present
                if (text.charCodeAt(0) === 0xFEFF) {
                    text = text.slice(1);
                }

                // Normalize line endings
                text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

                const lines = text.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    throw new Error('File must contain at least a header row and one data row');
                }

                // Detect delimiter
                const delimiter = detectDelimiter(lines[0]);

                // Parse header row
                const headers = parseCSVLine(lines[0], delimiter).map(h =>
                    h.toLowerCase().trim().replace(/^["']|["']$/g, '')
                );

                // Parse data rows
                const data: ParsedRow[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i], delimiter);
                    if (values.some(v => v.trim())) {
                        const rowData: ParsedRowData = {};
                        headers.forEach((header, index) => {
                            let value = values[index] || '';
                            value = value.replace(/^["']|["']$/g, '').trim();
                            rowData[header] = value;
                        });
                        data.push({
                            rowNumber: i + 1,
                            data: rowData,
                        });
                    }
                }

                resolve(data);
            } catch (error: any) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file, 'UTF-8');
    });
}

function detectDelimiter(headerLine: string): string {
    const delimiters = [
        { char: ',', count: (headerLine.match(/,/g) || []).length },
        { char: ';', count: (headerLine.match(/;/g) || []).length },
        { char: '\t', count: (headerLine.match(/\t/g) || []).length },
    ];

    const detected = delimiters.sort((a, b) => b.count - a.count)[0];
    return detected.count > 0 ? detected.char : ',';
}

function parseCSVLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            continue;
        }

        if (char === quoteChar && inQuotes) {
            if (line[i + 1] === char) {
                current += char;
                i++;
                continue;
            }
            inQuotes = false;
            quoteChar = '';
            continue;
        }

        if (char === delimiter && !inQuotes) {
            result.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    result.push(current.trim());
    return result;
}

async function parseExcel(file: File, expectedHeaders: string[]): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const arrayBuffer = event.target?.result;
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, {
                    header: 1,
                    defval: '',
                });

                if (jsonData.length < 2) {
                    throw new Error('File must contain at least a header row and one data row');
                }

                const headers = (jsonData[0] as string[]).map(h =>
                    String(h).toLowerCase().trim()
                );

                const parsedData: ParsedRow[] = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const rowArray = jsonData[i] as any[];
                    if (rowArray.some(v => v !== '' && v !== null && v !== undefined)) {
                        const rowData: ParsedRowData = {};
                        headers.forEach((header, index) => {
                            let value = rowArray[index];

                            if (header.includes('date') && typeof value === 'number') {
                                try {
                                    const dateInfo = XLSX.SSF.parse_date_code(value);
                                    if (dateInfo) {
                                        value = `${dateInfo.y}-${String(dateInfo.m).padStart(2, '0')}-${String(dateInfo.d).padStart(2, '0')}`;
                                    }
                                } catch {
                                    // Keep original value
                                }
                            }

                            rowData[header] = String(value ?? '').trim();
                        });
                        parsedData.push({
                            rowNumber: i + 1,
                            data: rowData,
                        });
                    }
                }

                resolve(parsedData);
            } catch (error: any) {
                reject(new Error(error.message || 'Failed to parse Excel file'));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

export function validateImportData(
    data: ParsedRow[],
    importType: ImportType
): ValidationResult {
    const config = IMPORT_CONFIGS[importType];
    const validRows: ParsedRow[] = [];
    const invalidRows: InvalidRow[] = [];

    data.forEach((row) => {
        const errors: string[] = [];

        // Check required fields
        config.requiredFields.forEach(field => {
            const value = row.data[field];
            if (!value || !value.trim()) {
                errors.push(`${field.replace(/_/g, ' ')} is required`);
            }
        });

        // Run field validators
        Object.entries(config.fieldValidators).forEach(([field, validator]) => {
            const value = row.data[field] || '';
            const error = validator(value);
            if (error) {
                errors.push(error);
            }
        });

        if (errors.length > 0) {
            invalidRows.push({
                rowNumber: row.rowNumber,
                data: row.data,
                errors,
            });
        } else {
            validRows.push(row);
        }
    });

    return {
        validRows,
        invalidRows,
        totalRows: data.length,
    };
}

export function transformForApi(
    rows: ParsedRow[],
    importType: ImportType
): Record<string, any>[] {
    const config = IMPORT_CONFIGS[importType];
    return rows.map(row => config.transformRow(row.data));
}