# Metadata Creator

Metadata Creator is a web-based GUI tool designed to help users create and manage metadata for image datasets. The application allows you to upload metadata files, associate images and product manuals, preview content, and download metadata in JSONL format with a timestamp. 

## Features

- **Upload Section**: Supports uploading existing JSONL metadata files, image URLs (via CSV), and product manuals (PDFs).
- **Metadata Entry Form**: Create new entries or edit existing metadata, including filename, manual name, questions, answers, and hints.
- **Preview Section**: Preview associated images and product manuals (PDFs) within the app.
- **Download JSONL**: Download metadata entries in JSONL format with a date-time stamp for version tracking.
- **User Guide**: An integrated "How to Use" guide accessible from within the app.

## Getting Started

To set up the Metadata Creator application locally, follow these steps:

### Prerequisites

- A modern web browser that supports JavaScript (e.g., Chrome, Firefox, Safari).
- Internet connection (for loading Bootstrap and other external resources).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/metadata-creator.git
   cd metadata-creator
   ´´´

## File Structure

```
metadata-creator/
├── index.html          # Main application file
├── app.js              # JavaScript for handling app functions
├── how-to-use.html     # User guide for the application
├── README.md           # Documentation
└── styles.css          # (Optional) Custom styles if any
```

## Usage

1. Upload Section

	•	Existing Metadata File: Select an existing .jsonl file to load metadata entries into the application.
	•	Image CSV: Upload a CSV file containing image filenames and URLs to associate images with entries.
	•	Product Manuals (PDFs): Upload multiple PDF files for product manuals. The application will attempt to match the filenames with metadata entries.

2. Edit Form

	•	Add New Entry: Fill in the fields (Filename, Manual, Questions, Answers, and Hint) and click “Add Entry” to add a new entry.
	•	Edit Existing Entry: Click a row in the entries table to load it into the form. Modify the details and click “Update Entry” to save changes.

3. Viewing Entries

	•	Entries are listed in a table. Click on any entry to load it into the form for editing.

4. Preview Section

	•	Image Preview: Displays the associated image, if available, for the selected entry.
	•	PDF Preview: Displays the closest-matching PDF file for the selected entry.

5. Downloading JSONL

	•	Click “Download JSONL” to save the metadata entries in JSONL format. The file will be named with a date-time stamp for easy version tracking.

6. User Guide

	•	Click the “How to Use” button to view the detailed user guide for the application.

## Technologies Used

	•	HTML: For structuring the web interface.
	•	JavaScript: For handling data processing, file interactions, and DOM manipulation.
	•	Bootstrap: For styling and responsive layout.

## Contributing

Contributions are welcome! Please follow these steps to contribute:
	1.	Fork the repository.
	2.	Create a new branch for your feature or bugfix.
	3.	Commit your changes and push to your fork.
	4.	Open a pull request with a description of your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

## Acknowledgements

Special thanks to all contributors and open-source libraries used in this project, including Bootstrap for styling.
