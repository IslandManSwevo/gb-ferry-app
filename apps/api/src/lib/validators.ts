/**
 * Maritime Compliance Validators
 * 
 * Implements ISO 27001 A.8.28, A.8.29 (Input Validation & Data Integrity)
 * Used across all data entry points to enforce business rules
 */

// Local interface for passenger data validation
interface PassengerCreateDTO {
  familyName?: string;
  givenNames?: string;
  dateOfBirth?: Date | string;
  nationality?: string;
  gender?: string;
  identityDocType?: string;
  identityDocNumber?: string;
  identityDocExpiry?: Date | string;
  identityDocCountry?: string;
  portOfEmbarkation?: string;
  portOfDisembarkation?: string;
  cabinOrSeat?: string;
  specialInstructions?: string;
  consentGiven?: boolean;
  consentProvidedAt?: string;
}

/**
 * Validation error with field-level detail
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Result of validation with details
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ===========================================
// PASSENGER VALIDATION
// ===========================================

/**
 * Check if passport is valid for sailing date
 * BMA requirement: Passport must not expire before sailing
 */
export function validatePassportExpiry(
  expiryDate: string,
  sailingDate: Date,
): ValidationError | null {
  try {
    const expiry = new Date(expiryDate);
    if (expiry < sailingDate) {
      return {
        field: 'passportExpiryDate',
        message: `Passport expired (${expiryDate}) before sailing date`,
        code: 'PASSPORT_EXPIRED',
      };
    }
    return null;
  } catch {
    return {
      field: 'passportExpiryDate',
      message: 'Invalid date format',
      code: 'INVALID_DATE',
    };
  }
}

/**
 * Check if passport is expiring within 30 days
 * Warning-level check for operational readiness
 */
export function checkPassportExpiringSoon(
  expiryDate: string,
  daysUntilSailing: number = 30,
): ValidationError | null {
  try {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry <= daysUntilSailing && daysUntilExpiry > 0) {
      return {
        field: 'passportExpiryDate',
        message: `Passport expires in ${daysUntilExpiry} days - recommend renewal`,
        code: 'PASSPORT_EXPIRING_SOON',
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate IMO FAL Form 5 required fields
 * See: packages/dto/src/passenger.ts for full schema
 */
export function validatePassengerIMOFields(
  passenger: Partial<PassengerCreateDTO>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required personal details (from IMO FAL Form 5)
  const requiredFields = [
    { field: 'familyName', message: 'Family name is required' },
    { field: 'givenNames', message: 'Given names are required' },
    { field: 'dateOfBirth', message: 'Date of birth is required' },
    { field: 'nationality', message: 'Nationality is required' },
    { field: 'gender', message: 'Gender is required' },
  ];

  requiredFields.forEach(({ field, message }) => {
    if (!passenger[field as keyof PassengerCreateDTO]) {
      errors.push({
        field,
        message,
        code: 'REQUIRED_FIELD_MISSING',
      });
    }
  });

  // Required document details
  const requiredDocFields = [
    { field: 'identityDocType', message: 'Document type is required' },
    { field: 'identityDocNumber', message: 'Document number is required' },
    { field: 'identityDocExpiry', message: 'Document expiry date is required' },
  ];

  requiredDocFields.forEach(({ field, message }) => {
    if (!passenger[field as keyof PassengerCreateDTO]) {
      errors.push({
        field,
        message,
        code: 'REQUIRED_FIELD_MISSING',
      });
    }
  });

  // Port information
  if (!passenger.portOfEmbarkation) {
    errors.push({
      field: 'portOfEmbarkation',
      message: 'Port of embarkation is required',
      code: 'REQUIRED_FIELD_MISSING',
    });
  }

  if (!passenger.portOfDisembarkation) {
    errors.push({
      field: 'portOfDisembarkation',
      message: 'Port of disembarkation is required',
      code: 'REQUIRED_FIELD_MISSING',
    });
  }

  return errors;
}

/**
 * Validate document number format (basic)
 * Each jurisdiction may have specific format requirements
 */
export function validateDocumentNumber(
  docType: string,
  docNumber: string,
): ValidationError | null {
  if (!docNumber || docNumber.trim().length === 0) {
    return {
      field: 'identityDocNumber',
      message: 'Document number cannot be empty',
      code: 'INVALID_DOCUMENT_NUMBER',
    };
  }

  // Passport: typically 6-9 alphanumeric characters
  if (docType === 'PASSPORT' && !/^[A-Z0-9]{6,9}$/.test(docNumber)) {
    return {
      field: 'identityDocNumber',
      message: 'Passport must be 6-9 characters (letters and numbers)',
      code: 'INVALID_PASSPORT_FORMAT',
    };
  }

  // National ID: varies by country, just check length
  if (docType === 'NATIONAL_ID' && docNumber.length < 5) {
    return {
      field: 'identityDocNumber',
      message: 'National ID appears too short',
      code: 'INVALID_NATIONAL_ID_FORMAT',
    };
  }

  return null;
}

/**
 * Age validation - typically 18+ for maritime operations
 */
export function validateMinimumAge(
  dateOfBirth: string,
  minimumAge: number = 18,
): ValidationError | null {
  try {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }

    // Check if age meets minimum requirement
    if (age < minimumAge) {
      return {
        field: 'dateOfBirth',
        message: `Passenger must be at least ${minimumAge} years old`,
        code: 'MINIMUM_AGE_NOT_MET',
      };
    }

    return null;
  } catch {
    return {
      field: 'dateOfBirth',
      message: 'Invalid date format',
      code: 'INVALID_DATE',
    };
  }
}

// ===========================================
// MANIFEST-LEVEL VALIDATION
// ===========================================

/**
 * Comprehensive manifest validation
 * Runs all checks and returns complete validation result
 */
export function validateManifest(
  passengers: Partial<PassengerCreateDTO>[],
  sailingDate: Date,
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  if (passengers.length === 0) {
    allErrors.push({
      field: 'passengers',
      message: 'Manifest must contain at least one passenger',
      code: 'NO_PASSENGERS',
    });
  }

  // Check each passenger
  passengers.forEach((passenger: any, index) => {
    const passengerPrefix = `passengers[${index}]`;

    // IMO FAL Form 5 validation
    const imoErrors = validatePassengerIMOFields(passenger);
    allErrors.push(
      ...imoErrors.map((e) => ({
        ...e,
        field: `${passengerPrefix}.${e.field}`,
      })),
    );

    // Document expiry (use identityDocExpiry)
    const expiryDate = passenger.identityDocExpiry || passenger.passportExpiryDate;
    if (expiryDate) {
      const expiryDateStr = typeof expiryDate === 'string' ? expiryDate : expiryDate.toISOString();
      const expiryError = validatePassportExpiry(
        expiryDateStr,
        sailingDate,
      );
      if (expiryError) {
        allErrors.push({
          ...expiryError,
          field: `${passengerPrefix}.${expiryError.field}`,
        });
      }

      const expiringWarning = checkPassportExpiringSoon(
        expiryDateStr,
      );
      if (expiringWarning) {
        allWarnings.push({
          ...expiringWarning,
          field: `${passengerPrefix}.${expiringWarning.field}`,
        });
      }
    }

    // Document number format
    if (passenger.identityDocType && passenger.identityDocNumber) {
      const docError = validateDocumentNumber(
        passenger.identityDocType,
        passenger.identityDocNumber,
      );
      if (docError) {
        allErrors.push({
          ...docError,
          field: `${passengerPrefix}.${docError.field}`,
        });
      }
    }

    // Age validation
    if (passenger.dateOfBirth) {
      const dobStr = typeof passenger.dateOfBirth === 'string' ? passenger.dateOfBirth : passenger.dateOfBirth.toISOString();
      const ageError = validateMinimumAge(dobStr);
      if (ageError) {
        allErrors.push({
          ...ageError,
          field: `${passengerPrefix}.${ageError.field}`,
        });
      }
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
