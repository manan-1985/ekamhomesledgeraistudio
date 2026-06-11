# Firebase Security Specifications

## 1. Data Invariants
- **Authentication**: A client must be signed in with Google to perform any read or write operation.
- **Tenant Isolation**: Users can only access, create, update, or delete data within their own sandbox subcollections under `/users/{userId}/`. Access to records of other users is strictly blocked.
- **Validation Rules**:
  - **IDs**: All document path IDs must be valid alphanumeric strings of size `<= 128` matching `^[a-zA-Z0-9_\-]+$`.
  - **Resident Fields**: `name`, `roomNumber`, etc., must be non-empty strings of valid size. `monthlyRent` must be a positive number.
  - **Payment Fields**: `amount` must be a positive number, `date` must be a string.
  - **Expense Fields**: `amount` must be a positive number, `date` must be a string.

## 2. The "Dirty Dozen" Threat Vectors & Payloads
Below are 12 malicious payload scenarios designed to be blocked by our FireStore Rules:

1. **Unauthenticated Read**: Attempting to read `/users/userABC/residents/res123` without being logged in. (Expected: `PERMISSION_DENIED`)
2. **Unauthenticated Write**: Attempting to create a resident at `/users/userABC/residents/res123` without a session. (Expected: `PERMISSION_DENIED`)
3. **Cross-Tenant Read Attack**: Logged in as `userXYZ`, attempting to read `/users/userABC/residents/res123`. (Expected: `PERMISSION_DENIED`)
4. **Cross-Tenant Write / Inject Attack**: Logged in as `userXYZ`, attempting to create or modify a resident under `/users/userABC/residents/res123`. (Expected: `PERMISSION_DENIED`)
5. **ID Poisoning / Path injection**: Attempting to create a resident with a long, malicious string as document ID containing special characters (e.g., `../../hack`). (Expected: `PERMISSION_DENIED` via `isValidId()`)
6. **Negative Outlay / Negative Amount Injection**: Attempting to insert a negative expense amount (e.g. `amount: -5000`) or payment (e.g. `amount: -100`) to skew ledger reporting. (Expected: `PERMISSION_DENIED` via validation helper)
7. **Type Poisoning**: Attempting to write a boolean instead of a string or number (e.g. `monthlyRent: true`). (Expected: `PERMISSION_DENIED`)
8. **Omission of Mandatory Fields**: Attempting to initialize a resident without `roomNumber` or `name`. (Expected: `PERMISSION_DENIED`)
9. **Tampering with Enum Values**: Setting `rentCategory` to an unapproved value (e.g., `free_tier_promo`). (Expected: `PERMISSION_DENIED`)
10. **Maliciously Oversized Notes**: Attempting to send an expense notes field containing `10MB` of characters to consume Firestore storage. (Expected: `PERMISSION_DENIED` via string `.size() <= 2000` rule)
11. **Maliciously Oversized Phone Number**: Attempting to inject a huge string in the `phone` attribute. (Expected: `PERMISSION_DENIED` via string `.size() <= 20` rule)
12. **Blanket Query Scraping**: Attempting to run a list query across all user records without checking the matching user context (e.g., `/users/{userId}/residents`). (Expected: `PERMISSION_DENIED` since list checks enforce matched UID paths)
