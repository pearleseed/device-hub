/**
 * Property Test Generators for Device Hub
 *
 * Provides fast-check arbitraries for generating test data
 * used in property-based testing.
 */

import * as fc from "fast-check";
import type { DeviceCategory, RequestStatus } from "../../src/types/api";
import {
  VALID_STATUS_TRANSITIONS,
  DEVICE_CATEGORIES,
  DEPARTMENT_NAMES,
} from "../setup";

// ============================================================================
// Email Generators
// ============================================================================

/**
 * Generate valid email addresses
 */
export const validEmailArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9._-]{0,19}$/),
    fc.stringMatching(/^[a-z][a-z0-9-]{0,9}$/),
    fc.constantFrom("com", "org", "net", "io", "co"),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Generate valid simple usernames for support accounts (no @ required)
 */
export const validUsernameArb: fc.Arbitrary<string> = fc.stringMatching(
  /^[a-zA-Z][a-zA-Z0-9._-]{2,19}$/,
);

/**
 * Generate valid email or username (for signup)
 */
export const validEmailOrUsernameArb: fc.Arbitrary<string> = fc.oneof(
  validEmailArb,
  validUsernameArb,
);

/**
 * Generate invalid email/username formats
 */
export const invalidEmailArb: fc.Arbitrary<string> = fc.oneof(
  // Contains spaces
  fc.stringMatching(/^[a-z]+ [a-z]+$/),
  // Contains invalid special characters
  fc.stringMatching(/^[a-z]+[!@#$%^&*()]+[a-z]+$/),
  // Empty string
  fc.constant(""),
  // Just spaces
  fc.stringMatching(/^\s+$/),
  // Only @ symbol
  fc.constant("@"),
  // Starts with invalid character
  fc.stringMatching(/^[!@#$%][a-z]+$/),
);

// ============================================================================
// Date Range Generators
// ============================================================================

/**
 * Generate valid date ranges (end >= start)
 */
export const validDateRangeArb: fc.Arbitrary<{ start: string; end: string }> =
  fc
    .tuple(
      fc.integer({ min: 2024, max: 2026 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }),
      fc.integer({ min: 0, max: 180 }),
    )
    .map(([year, month, day, daysToAdd]) => {
      // Create start date
      const startDate = new Date(year, month - 1, day);

      // Create end date that is >= start date
      const endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + daysToAdd);

      // Format dates safely
      const formatDate = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
      };

      return {
        start: formatDate(startDate),
        end: formatDate(endDate),
      };
    });

/**
 * Generate invalid date ranges (end < start)
 */
export const invalidDateRangeArb: fc.Arbitrary<{ start: string; end: string }> =
  fc
    .tuple(
      fc.integer({ min: 2024, max: 2026 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }),
      fc.integer({ min: 1, max: 180 }),
    )
    .map(([year, month, day, daysToAdd]) => {
      // Create end date
      const endDate = new Date(year, month - 1, day);

      // Create start date that is AFTER end date
      const startDate = new Date(endDate.getTime());
      startDate.setDate(startDate.getDate() + daysToAdd);

      // Format dates safely
      const formatDate = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
      };

      return {
        start: formatDate(startDate),
        end: formatDate(endDate),
      };
    });

// ============================================================================
// Device Category Generators
// ============================================================================

/**
 * Generate valid device categories
 */
export const validCategoryArb: fc.Arbitrary<DeviceCategory> = fc.constantFrom(
  ...DEVICE_CATEGORIES,
) as fc.Arbitrary<DeviceCategory>;

/**
 * Generate invalid device categories
 */
export const invalidCategoryArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant("invalid_category"),
  fc.constant("computer"),
  fc.constant("phone"),
  fc.constant("LAPTOP"),
  fc.constant("Laptop"),
  fc.constant(""),
  fc.stringMatching(/^[a-z]{10,20}$/),
);

// ============================================================================
// Status Transition Generators
// ============================================================================

type StatusTransition = { from: RequestStatus; to: RequestStatus };

/**
 * Generate valid status transitions
 */
export const validStatusTransitionArb: fc.Arbitrary<StatusTransition> =
  fc.constantFrom(
    ...Object.entries(VALID_STATUS_TRANSITIONS).flatMap(([from, toList]) =>
      toList.map((to) => ({
        from: from as RequestStatus,
        to: to as RequestStatus,
      })),
    ),
  );

/**
 * Generate invalid status transitions
 */
export const invalidStatusTransitionArb: fc.Arbitrary<StatusTransition> = fc
  .tuple(
    fc.constantFrom(
      "pending",
      "approved",
      "active",
      "returned",
      "rejected",
    ) as fc.Arbitrary<RequestStatus>,
    fc.constantFrom(
      "pending",
      "approved",
      "active",
      "returned",
      "rejected",
    ) as fc.Arbitrary<RequestStatus>,
  )
  .filter(([from, to]) => {
    const validTransitions = VALID_STATUS_TRANSITIONS[from] || [];
    return !validTransitions.includes(to);
  })
  .map(([from, to]) => ({ from, to }));

// ============================================================================
// Department Generators
// ============================================================================

/**
 * Generate valid department names
 */
export const validDepartmentNameArb: fc.Arbitrary<string> = fc.constantFrom(
  ...DEPARTMENT_NAMES,
);

/**
 * Generate invalid department names
 */
export const invalidDepartmentNameArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant("InvalidDept"),
  fc.constant(""),
  fc.constant("it"),
  fc.constant("ENGINEERING"),
  fc.stringMatching(/^[A-Z][a-z]{5,15}$/),
);

// ============================================================================
// Password Generators
// ============================================================================

/**
 * Generate valid passwords (6+ characters)
 */
export const validPasswordArb: fc.Arbitrary<string> = fc.stringMatching(
  /^[a-zA-Z0-9!@#$%^&*]{6,20}$/,
);

/**
 * Generate invalid passwords (less than 6 characters)
 */
export const invalidPasswordArb: fc.Arbitrary<string> =
  fc.stringMatching(/^[a-zA-Z0-9]{1,5}$/);

// ============================================================================
// ID Generators
// ============================================================================

/**
 * Generate valid numeric IDs
 */
export const validIdArb: fc.Arbitrary<number> = fc.integer({
  min: 1,
  max: 1000000,
});

/**
 * Generate invalid ID formats (non-numeric strings)
 */
export const invalidIdFormatArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant("abc"),
  fc.constant(""),
  fc.constant("1.5"),
  fc.constant("-1"),
  fc.constant("null"),
  fc.stringMatching(/^[a-z]{1,10}$/),
);

// ============================================================================
// Price Generators
// ============================================================================

/**
 * Generate valid prices
 */
export const validPriceArb: fc.Arbitrary<number> = fc.double({
  min: 0.01,
  max: 100000,
  noNaN: true,
});

/**
 * Generate invalid prices
 */
export const invalidPriceArb: fc.Arbitrary<number> = fc.oneof(
  fc.constant(-1),
  fc.constant(-100),
  fc.constant(0),
);

// ============================================================================
// Device Condition Generators
// ============================================================================

/**
 * Generate valid device conditions
 */
export const validConditionArb: fc.Arbitrary<string> = fc.constantFrom(
  "excellent",
  "good",
  "fair",
  "damaged",
);

/**
 * Generate non-damaged conditions
 */
export const nonDamagedConditionArb: fc.Arbitrary<string> = fc.constantFrom(
  "excellent",
  "good",
  "fair",
);

// ============================================================================
// JWT Token Generators
// ============================================================================

/**
 * Generate invalid JWT tokens
 */
export const invalidTokenArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant(""),
  fc.constant("invalid"),
  fc.constant("Bearer invalid"),
  fc.stringMatching(/^[a-zA-Z0-9]{10,50}$/),
  fc.constant("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"),
);
