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


// ------------------------------
// Functions for Entry Management
// ------------------------------

// Function to add a new entry or update an existing entry in entries array
function addOrUpdateEntry() {
    // Gather form input values and create an entry object
    const filename = document.getElementById("filename").value.trim();
    const manual = document.getElementById("manual").value.trim();
    const questions = document.getElementById("questions").value.trim().split(",").map(item => item.trim());
    const answers = document.getElementById("answers").value.trim().split(",").map(item => item.trim());
    const hint = document.getElementById("hint").value.trim();

    const entry = { filename, manual, questions, answers, hint };

    if (selectedIndex === -1) {
        // Add new entry if no entry is selected
        entries.push(entry);
        showBootstrapPopupAlert("Entry added");
    } else {
        // Update existing entry if an entry is selected
        entries[selectedIndex] = entry;
        showBootstrapPopupAlert("Entry updated");
        selectedIndex = -1; // Reset selectedIndex after update
        document.getElementById("addUpdateButton").innerText = "Add Entry"; 
    }

    resetForm();
    displayEntries();
}

// Function to display all entries in the HTML table
function displayEntries() {
    const tableBody = document.getElementById("entriesTable").querySelector("tbody");
    tableBody.innerHTML = ""; // Clear existing rows

    // Create a row for each entry and append to table
    entries.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.filename}</td>
            <td>${entry.manual}</td>
            <td>${entry.questions.join(", ")}</td>
            <td>${entry.answers.join(", ")}</td>
            <td>${entry.hint}</td>
        `;
        row.addEventListener("click", () => loadEntryIntoForm(index));
        tableBody.appendChild(row);
    });
}

// Function to load an entry's data into the form fields for editing
function loadEntryIntoForm(index) {
    const entry = entries[index];
    selectedIndex = index;

    document.getElementById("filename").value = entry.filename;
    document.getElementById("manual").value = entry.manual;
    document.getElementById("questions").value = entry.questions.join(", ");
    document.getElementById("answers").value = entry.answers.join(", ");
    document.getElementById("hint").value = entry.hint;

    document.getElementById("addUpdateButton").innerText = "Update Entry";
    highlightSelectedRow(index);
    showImagePreview(entry.filename);
    loadPDFBasedOnFilename(entry.filename);
}

// Function to reset the form and clear selectedIndex
function resetForm() {
    document.getElementById("entryForm").reset();
    selectedIndex = -1;
    document.getElementById("addUpdateButton").innerText = "Add Entry";
    document.getElementById("imagePreview").style.display = "none";
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


// ------------------------------
// File Handling Functions
// ------------------------------

// Load and parse JSONL file for metadata entries
document.getElementById("existingMetadata").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file && file.name.endsWith(".jsonl")) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split("\n").filter(line => line.trim() !== "");
            entries = lines.map(line => JSON.parse(line));
            displayEntries();
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
        };
        reader.readAsText(file);
    } else {
        alert("Please upload a valid CSV file.");
    }
});

// Load multiple PDF files and populate PDF file mappings
function loadPDFFiles() {
    const pdfInput = document.getElementById("pdfFilesInput");
    pdfFilesMap = {};
    for (const file of pdfInput.files) {
        if (file.type === "application/pdf") {
            pdfFilesMap[file.name] = file;
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