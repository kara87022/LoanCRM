# CSV Upload Feature for Installment Updates

## Overview
This feature allows users to upload installment data in bulk via CSV files, making it easier to update multiple installments at once without manual data entry.

## How to Use

1. Navigate to the **Collections** module and select the **Update Collection** tab.
2. Locate the **Bulk Update via CSV** section at the top of the page.
3. Click the **Choose CSV file** button to select your CSV file.
4. Click the **Upload Installments CSV** button to upload the file.
5. The system will process the file and display a success message with the number of records processed.

## CSV File Format

### Required Columns
- `loan_id`: The unique identifier for the loan
- `installment_number`: The installment number (must be a positive integer)
- `due_date`: The due date in YYYY-MM-DD format
- `amount`: The installment amount (must be a positive number)

### Optional Columns
- `status`: The status of the installment (default is "Pending")

### Sample CSV
A sample CSV template is available for download by clicking the "Download Sample CSV Template" link in the upload section.

## Validation Rules

The system performs the following validations on the uploaded CSV:

1. File must be in CSV format with a .csv extension
2. File size must not exceed 5MB
3. All required columns must be present
4. Installment numbers must be positive integers
5. Amounts must be positive numbers
6. Due dates must be in valid YYYY-MM-DD format

## Error Handling

If there are validation errors in the CSV file, the system will display an error message with details about the issues. Common errors include:

- Missing required fields
- Invalid data types (e.g., non-numeric amounts)
- Invalid date formats

## Technical Implementation

### Backend
- API Endpoint: `/api/installments/upload-csv`
- Method: POST
- Authentication: JWT token required
- File handling: Uses multer for file upload processing
- CSV parsing: Uses csv-parser library

### Frontend
- Component: `CSVUploader.js` - A reusable component for CSV file uploads
- Integration: Added to the UpdateCollection page
- Styling: Custom CSS for the uploader interface

## Testing

A test script (`test-csv-upload.js`) is provided to verify the functionality of the CSV upload feature. To run the test:

1. Ensure the backend server is running
2. Run `node test-csv-upload.js` from the command line
3. The script will create a test CSV file, upload it, and verify the results