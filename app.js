// ------------------------------
// Initialization of Global Variables
// ------------------------------

// Array to store entries (metadata entries created or loaded)
let entries = [];

// Index of the currently selected entry in the entries array
let selectedIndex = -1; 

// Object to map image filenames to their respective URLs
let imageMappings = {};

// Object to store PDF file references by their filenames
let pdfFilesMap = {};

// Reference to the previously selected table row for highlighting
let previousSelectedRow = null;

// DB object
let db;

// Reference to IndexDB name MetadaDB
const request = indexedDB.open("MetadataDB", 1);

// ------------------------------
// Functions for Save data to IndexDB
// ------------------------------

// function to handle the saving of each file type in the uploads store.
function saveFileToIndexedDB(type, fileName, content) {
    const transaction = db.transaction("uploads", "readwrite");
    const store = transaction.objectStore("uploads");

    const fileData = { type, fileName, content }; // Save as {type, fileName, content}
    store.put(fileData); // Use `put` to add or update entry
    //console.log('File saved to DB: ' + fileData)
}

// Function to save input form entries to DB
function saveEntryToIndexedDB(entry) {
    const transaction = db.transaction("entries", "readwrite");
    const store = transaction.objectStore("entries");
    store.put(entry); // `put` will update the entry if the ID already exists
    console.log("Entry updated in DB ", entry)
}

// ------------------------------
// Functions load data from LocalDB(IndexDB)
// ------------------------------

// Function to load any previously uploaded files from the uploads store and process them accordingly
function loadUploadsFromIndexedDB() {
    const transaction = db.transaction("uploads", "readonly");
    const store = transaction.objectStore("uploads");
    const request = store.getAll();

    request.onsuccess = function(event) {
        const files = event.target.result;

        files.forEach(file => {
            if (file.type === "metadata") {
                // Load JSONL metadata by parsing each line
                entries = file.content
                    .split("\n")                    // Split content into lines
                    .filter(line => line.trim() !== "") // Remove empty lines
                    .map(line => JSON.parse(line.trim())); // Parse each line as JSON
                displayEntries(); // Display entries in the table
                // Display the metadata file name in the upload section
                document.getElementById("metadataFileName").textContent = `Loaded file from DB: ${file.fileName}`;
            } else if (file.type === "images") {
                // Parse CSV for image mappings
                parseImageCSV(file.content);
                // Display the csv file name in the upload section
                document.getElementById("imageCSVFileName").textContent = `Loaded file from DB: ${file.fileName}`;
            } else if (file.type === "pdfs") {
                // Restore PDFs to pdfFilesMap
                const pdfBlob = new Blob([file.content], { type: "application/pdf" });
                pdfFilesMap[file.fileName] = pdfBlob; // Store each PDF in pdfFilesMap by fileName
                populatePDFDropdown();
            }
        });
    };
}

// Function to load jsonl file entries from DB
function loadEntriesFromIndexedDB() {
    const transaction = db.transaction("entries", "readonly");
    const store = transaction.objectStore("entries");
    const request = store.getAll();

    request.onsuccess = function(event) {
        entries = event.target.result;
        displayEntries(); // Display entries in the table
        populateColumnDropdown();  // Populate the column dropdown
    };
}

// ------------------------------
// Functions for Entry Management
// ------------------------------

// Function to add a new entry or update an existing entry in entries array
function addOrUpdateEntry() {
    /* const filename = document.getElementById("filename").value.trim();
    const manual = document.getElementById("manual").value.trim();
    const questions = document.getElementById("questions").value.trim().split(",").map(item => item.trim());
    const answers = document.getElementById("answers").value.trim().split(",").map(item => item.trim());
    const hint = document.getElementById("hint").value.trim();

    const entry = {
        id: selectedIndex === -1 ? Date.now() : entries[selectedIndex].id, // Use existing ID or new unique ID for new entries
        filename: filename,
        manual: manual,
        questions: questions,
        answers: answers,
        hint: hint
    }; */
    if (selectedIndex === -1) {
        alert("No entry is selected for editing.");
        return;
    }

    // Get the form container and extract updated values
    const formContainer = document.getElementById("editEntryFormContainer");
    const updatedEntry = {};
    const inputs = formContainer.querySelectorAll("input");

    inputs.forEach(input => {
        updatedEntry[input.name] = input.value; // Use input name as the key
    });

    if (selectedIndex === -1) {
        // Add new entry
        entries.push(updatedEntry);
        saveEntryToIndexedDB(updatedEntry);
        showBootstrapPopupAlert("Entry added");
    } else {
        // Update existing entry
        entries[selectedIndex] = updatedEntry; // Update in-memory array
        saveEntryToIndexedDB(updatedEntry);    // Save the updated entry to IndexedDB
        showBootstrapPopupAlert("Entry updated");
        selectedIndex = -1; // Reset selectedIndex after update
        document.getElementById("addUpdateButton").innerText = "Add Entry";
    }

    // Reset form and refresh the display
    resetForm();
    displayEntries();
}

// Function to display all entries in the HTML table
function displayEntries() {
    const tableBody = document.getElementById("entriesTable").querySelector("tbody");
    tableBody.innerHTML = ""; // Clear existing rows

    // Get all unique column keys from entries
    const allKeys = entries.reduce((keys, entry) => {
        Object.keys(entry).forEach(key => keys.add(key));
        return keys;
    }, new Set());

    // Update table headers dynamically
    const tableHead = document.getElementById("entriesTable").querySelector("thead");
    tableHead.innerHTML = ""; // Clear existing headers
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>#</th>`;
    allKeys.forEach(key => {
        const th = document.createElement("th");
        th.textContent = key;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // Populate table rows
    entries.forEach((entry, index) => {
        const row = document.createElement("tr");

        // Add row number
        row.innerHTML = `<td>${index + 1}</td>`;

        // Add all key-value pairs dynamically
        allKeys.forEach(key => {
            const td = document.createElement("td");
            td.textContent = entry[key] || ""; // Display empty if the key doesn't exist in the entry
            row.appendChild(td);
        });

        // Add click event for editing the entry
        row.addEventListener("click", function() {
            loadEntryIntoForm(index);
        });

        tableBody.appendChild(row);
    });
}

// Function to load an entry's data into the form fields for editing
function loadEntryIntoForm(index) {
    generateEditEntryForm(index); // Dynamically generate the form
    showBootstrapPopupAlert(`Editing entry #${index + 1}`); // Optional feedback for the user

    /* const entry = entries[index];
    selectedIndex = index;

    document.getElementById("filename").value = entry.filename;
    document.getElementById("manual").value = entry.manual;
    document.getElementById("questions").value = entry.questions.join(", ");
    document.getElementById("answers").value = entry.answers.join(", ");
    document.getElementById("hint").value = entry.hint;
 */
    document.getElementById("addUpdateButton").innerText = "Update Entry";
    highlightSelectedRow(index);
    
}

// Function to reset the form and clear selectedIndex
function resetForm() {
    document.getElementById("entryForm").reset();
    selectedIndex = -1;
    document.getElementById("addUpdateButton").innerText = "Add Entry";
    document.getElementById("imagePreview").style.display = "none";
}

// ------------------------------
// Functions for Adding deleting Columns
// ------------------------------

// Function to add new column to the metadata
function addNewColumn() {
    const newColumnName = document.getElementById("newColumnName").value.trim();
    const newColumnValue = document.getElementById("newColumnValue").value.trim();

    if (!newColumnName) {
        alert("Please enter a column name.");
        return;
    }

    // Add the new column to all entries in memory
    entries = entries.map(entry => ({
        ...entry, // Copy existing key-value pairs
        [newColumnName]: newColumnValue // Add the new column with default value
    }));

    // Save updated entries to IndexedDB
    saveAllEntriesToIndexedDB();

    // Refresh the display
    displayEntries();
    // Refresh the delete columns dropdown menu
    populateColumnDropdown();

    // Show success message
    showBootstrapPopupAlert(`New column '${newColumnName}' added with default value '${newColumnValue}'.`);

    // Clear the inputs
    document.getElementById("newColumnName").value = "";
    document.getElementById("newColumnValue").value = "";
}

// Save all entries to IndexedDB
function saveAllEntriesToIndexedDB() {
    const transaction = db.transaction("entries", "readwrite");
    const store = transaction.objectStore("entries");

    entries.forEach(entry => store.put(entry)); // Use `put` to update all entries
}

// Function to populate the delete columns dropdown menu
function populateColumnDropdown() {
    console.log("Current entries:", entries); // Debugging: Check the entries array

    const dropdown = document.getElementById("deleteColumnSelect");
    dropdown.innerHTML = '<option value="">Select a column</option>'; // Reset dropdown

    // Ensure entries have data
    if (entries.length === 0) {
        console.warn("No entries available to populate dropdown.");
        return;
    }

    // Get all unique keys (column names) from the entries
    const allKeys = entries.reduce((keys, entry) => {
        Object.keys(entry).forEach(key => keys.add(key));
        return keys;
    }, new Set());

    // Populate the dropdown with keys
    allKeys.forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key;
        dropdown.appendChild(option);
    });

    console.log("Dropdown populated with keys:", [...allKeys]); // Debugging: Check added keys
}

// Delete columns function
function deleteColumn() {
    const dropdown = document.getElementById("deleteColumnSelect");
    const columnName = dropdown.value;

    if (!columnName) {
        alert("Please select a column to delete.");
        return;
    }

    // Remove the selected column from all entries
    entries = entries.map(entry => {
        const { [columnName]: _, ...rest } = entry; // Remove the column using destructuring
        return rest;
    });

    // Save updated entries to IndexedDB
    saveAllEntriesToIndexedDB();

    // Refresh the display and dropdown
    displayEntries();
    populateColumnDropdown();

    // Show success message
    showBootstrapPopupAlert(`Column '${columnName}' deleted successfully.`);
}


// ------------------------------
// Functions for Image and PDF Handling
// ------------------------------

// Function to display image preview if available
function showImagePreview(filename) {
    const imageUrl = imageMappings[filename];
    const imagePreview = document.getElementById("imagePreview");
    const loadedImageName = document.getElementById("loadedImageName");

    if (imageUrl) {
        imagePreview.src = imageUrl;
        imagePreview.style.display = "block";
        loadedImageName.textContent = `(${filename})`;
    } else {
        imagePreview.style.display = "none";
        loadedImageName.textContent = "";
    }
}

// Function to load the closest matching PDF file based on filename
function loadPDFBasedOnFilename(filename) {
    const baseName = filename.split('_')[0].trim();
    let closestMatch = null;
    let highestScore = 0;
    const loadedPDFName = document.getElementById("loadedPDFName");

    for (const pdfFileName in pdfFilesMap) {
        const similarityScore = getSimilarityScore(baseName, pdfFileName.replace(".pdf", ""));
        if (similarityScore > highestScore) {
            highestScore = similarityScore;
            closestMatch = pdfFilesMap[pdfFileName];
        }
    }

    if (closestMatch && highestScore > 0.5) {
        displayPDF(closestMatch);
        loadedPDFName.textContent = `(${Object.keys(pdfFilesMap).find(name => pdfFilesMap[name] === closestMatch)})`;
    } else {
        console.log(`No close match found for PDF file: ${baseName}.pdf`);
        document.getElementById("pdfPreview").style.display = "none";
        loadedPDFName.textContent = "";
    }
}

// Function to display a selected PDF in an iframe
async function displayPDF(file) {
    const pdfBlob = new Blob([await file.arrayBuffer()], { type: "application/pdf" });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const pdfPreview = document.getElementById("pdfPreview");
    pdfPreview.src = pdfUrl;
    pdfPreview.style.display = "block";
}

// Load and preview the selected PDF file in the iframe
async function loadPDFPreview() {
    const pdfSelect = document.getElementById("pdfFiles");
    const fileName = pdfSelect.value;

    if (!fileName) {
        document.getElementById("pdfPreview").style.display = "none";
        return; // No file selected
    }

    const file = pdfFilesMap[fileName];
    const pdfBlob = new Blob([await file.arrayBuffer()], { type: "application/pdf" });
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Display the PDF in the iframe
    const pdfPreview = document.getElementById("pdfPreview");
    pdfPreview.src = pdfUrl;
    pdfPreview.style.display = "block";
}


// ------------------------------
// File Handling Functions
// ------------------------------

// Load and parse JSONL file for metadata entries
document.getElementById("existingMetadata").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file && file.name.endsWith(".jsonl")) {
        const reader = new FileReader();
        reader.onload = function(e) {

            // load data in the table
            const lines = e.target.result.split("\n").filter(line => line.trim() !== "");
            entries = lines.map(line => JSON.parse(line));
            displayEntries();

            // Save to loaded data to IndexedDB
            const content = e.target.result;
            saveFileToIndexedDB("metadata", file.name, content); 
        };
        reader.readAsText(file);
        showBootstrapPopupAlert("Metadata JSONL loaded successfully");
    } else {
        alert("Please upload a valid JSONL file.");
    }
});

// Load and parse CSV file for image mappings
document.getElementById("imageCSV").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file && file.name.endsWith(".csv")) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split("\n").filter(line => line.trim() !== "");
            imageMappings = {};
            lines.forEach(line => {
                const [filename, url] = line.split(",").map(item => item.trim());
                if (filename && url) {
                    imageMappings[filename] = url;
                }
            });
            showBootstrapPopupAlert("Image CSV loaded successfully");
            // Save to IndexedDB
            const content = e.target.result;
            saveFileToIndexedDB("images", file.name, content); 
        };
        reader.readAsText(file);
    } else {
        alert("Please upload a valid CSV file.");
    }
});


// Load multiple PDF files, populate PDF file mappings and save to DB
function loadPDFFiles() {
    // Clear existing PDF files in the database
    clearExistingPDFsInIndexedDB();

    const pdfInput = document.getElementById("pdfFilesInput");
    const pdfPaths = {}; // Create an object to store PDF paths

    for (const file of pdfInput.files) {
        if (file.type === "application/pdf") {
            pdfFilesMap[file.name] = file;
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;

                // Save each PDF file to IndexedDB and in-memory map
                saveFileToIndexedDB("pdfs", file.name, content);
                
                // Also add to the in-memory pdfFilesMap
                //pdfFilesMap[file.name] = new Blob([content], { type: "application/pdf" });
            };
            reader.readAsArrayBuffer(file); // Read as ArrayBuffer for PDFs
        }
    }
    populatePDFDropdown();
    showBootstrapPopupAlert("PDF files loaded successfully!");
}

// Populate dropdown with PDF filenames
function populatePDFDropdown() {
    const pdfSelect = document.getElementById("pdfFiles");
    pdfSelect.innerHTML = '<option value="">Select a PDF file</option>';
    for (const fileName in pdfFilesMap) {
        const option = document.createElement("option");
        option.value = fileName;
        option.textContent = fileName;
        pdfSelect.appendChild(option);
    }
}

// ------------------------------
// Functions to generate edit-form dynamically
// ------------------------------

// generate form function
function generateEditEntryForm(index) {
    const entry = entries[index]; // Get the selected entry
    const formContainer = document.getElementById("editEntryFormContainer");
    formContainer.innerHTML = ""; // Clear existing form fields

    // Dynamically create input fields for each key-value pair
    Object.keys(entry).forEach(key => {
        const formGroup = document.createElement("div");
        formGroup.className = "mb-3";

        // Create label
        const label = document.createElement("label");
        label.htmlFor = key;
        label.className = "form-label";
        label.textContent = key;

        // Create input
        const input = document.createElement("input");
        input.type = "text";
        input.className = "form-control";
        input.id = key;
        input.name = key;
        input.value = entry[key] || ""; // Set the current value of the entry

        // Append to form group
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        formContainer.appendChild(formGroup);
    });

    // Store the selected index for saving
    selectedIndex = index;

    showImagePreview(entry.filename);
    loadPDFBasedOnFilename(entry.filename);
}

// ------------------------------
// Utility Functions
// ------------------------------

// Show alert popup with custom message
function showBootstrapPopupAlert(message) {
    const popupAlert = document.getElementById("popupAlert");
    const popupAlertMessage = document.getElementById("popupAlertMessage");

    if (popupAlert && popupAlertMessage) {
        popupAlertMessage.textContent = message;
        popupAlert.style.display = "block";
        popupAlert.classList.add("show");

        setTimeout(() => {
            popupAlert.classList.remove("show");
            popupAlert.style.display = "none";
        }, 5000);
    } else {
        console.error("Popup alert elements not found in the DOM.");
    }
}

// Highlight selected row in entries table
function highlightSelectedRow(index) {
    const tableBody = document.getElementById("entriesTable").querySelector("tbody");
    const rows = tableBody.getElementsByTagName("tr");

    if (previousSelectedRow) {
        previousSelectedRow.classList.remove("selected-row");
    }

    const selectedRow = rows[index];
    selectedRow.classList.add("selected-row");
    previousSelectedRow = selectedRow;
}

// Calculate Levenshtein distance for similarity scoring
function getLevenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, // deletion
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return matrix[a.length][b.length];
}

// Calculate similarity score based on Levenshtein distance
function getSimilarityScore(str1, str2) {
    const distance = getLevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
}

// Generate and download JSONL file with timestamp in the filename
function downloadJSONL() {
    const jsonlData = entries.map(entry => JSON.stringify(entry)).join("\n");
    const blob = new Blob([jsonlData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timeStamp = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const dateTimeStamp = `${dateStamp}_${timeStamp}`;

    const fileName = `metadata_${dateTimeStamp}.jsonl`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
    showBootstrapPopupAlert("JSONL file downloaded successfully.");
}

// Function to parse CSV file
function parseImageCSV(content) {
    const lines = content.split("\n").filter(line => line.trim() !== "");
    imageMappings = {};
    lines.forEach(line => {
        const [filename, url] = line.split(",").map(item => item.trim());
        if (filename && url) {
            imageMappings[filename] = url;
        }
    });
}

// Function to clear old pdf files name from db
function clearExistingPDFsInIndexedDB() {
    const transaction = db.transaction("uploads", "readwrite");
    const store = transaction.objectStore("uploads");

    // Open a cursor to iterate over all entries in the store
    const request = store.openCursor();
    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            if (cursor.value.type === "pdfs") {
                // Delete entry if it's a PDF
                cursor.delete();
            }
            cursor.continue();
        }
    };

    request.onerror = function(event) {
        console.error("Failed to clear old PDF files:", event.target.errorCode);
    };
}

function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto'; // Reset height to allow shrink
    textarea.style.height = (textarea.scrollHeight) + 'px'; // Set height to fit content
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("App initialized, loading data...");

    request.onupgradeneeded = function(event) {
        db = event.target.result;
    
        // Store for metadata entries
        db.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
    
        // Store for uploaded files (stores filename and file data)
        db.createObjectStore("uploads", { keyPath: "type" }); // Type could be "metadata", "images", "pdfs"
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        
        loadUploadsFromIndexedDB(); // Load uploads on startup
        loadEntriesFromIndexedDB();
    };
    
    request.onerror = function(event) {
        console.error("Database error:", event.target.errorCode);
    };
});