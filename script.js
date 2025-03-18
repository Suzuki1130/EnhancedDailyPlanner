// Daily Planner with Local Storage - Enhanced with all features

document.addEventListener("DOMContentLoaded", () => {
    initializePlanner();
});

let plannerData = JSON.parse(localStorage.getItem("dailyPlanner")) || {};
let activeFolder = null;
let activeNote = null;
let folderToRename = null;
let folderToDelete = null;
let noteToDelete = null;
let isDarkMode = localStorage.getItem("darkMode") === "true";
// Additional global variables for UI state
let isSidebarCollapsed = false;
let isMetadataPanelCollapsed = false;
let currentlyEditingNote = null;

// Initialize planner
function initializePlanner() {
    loadProgress();
    setupEventListeners();
    setupSearchFunctionality();
    applyColorTheme();
    setupSplitViewListeners();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById("addFolderBtn").addEventListener("click", addFolder);
    document.getElementById("darkModeToggle").addEventListener("click", toggleDarkMode);
    document.getElementById("searchInput").addEventListener("input", performSearch);
    document.getElementById("clearSearchBtn").addEventListener("click", clearSearch);
    document.getElementById("confirmAddNoteBtn").addEventListener("click", confirmAddNote);
}

function setupSplitViewListeners() {
    // Sidebar toggle
    document.getElementById("sidebarToggle").addEventListener("click", toggleSidebar);
    
    // Metadata panel toggle
    document.getElementById("toggleMetadata").addEventListener("click", toggleMetadataPanel);
    
    // Save button in editor
    document.getElementById("saveNoteBtn").addEventListener("click", saveNoteFromEditor);
    
    // Close editor button
    document.getElementById("closeEditorBtn").addEventListener("click", closeNoteEditor);
    
    // Delete note from editor
    document.getElementById("editorDeleteNote").addEventListener("click", function() {
        if (currentlyEditingNote && currentlyEditingNote.folder && currentlyEditingNote.note) {
            showDeleteNoteModal(currentlyEditingNote.folder, currentlyEditingNote.note);
        }
    });
}

// Setup search functionality
function setupSearchFunctionality() {
    const searchContainer = document.getElementById("searchContainer");
    searchContainer.classList.remove("hidden");
}

// Toggle dark mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    localStorage.setItem("darkMode", isDarkMode);
    applyColorTheme();
}

// Apply color theme based on dark mode state
function applyColorTheme() {
    document.body.classList.toggle("dark-mode", isDarkMode);
    document.getElementById("darkModeToggle").textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const contentArea = document.getElementById("contentArea");
    const toggleIcon = document.getElementById("sidebarToggleIcon");
    
    isSidebarCollapsed = !isSidebarCollapsed;
    
    if (isSidebarCollapsed) {
        // Collapse sidebar
        sidebar.style.transform = "translateX(-100%)";
        sidebar.style.marginLeft = "-300px"; // Assuming sidebar width is 300px max
        if (contentArea) {
            contentArea.style.width = "100%";
            contentArea.style.marginLeft = "0";
        }
        toggleIcon.innerText = "▶";
    } else {
        // Expand sidebar
        sidebar.style.transform = "translateX(0)";
        sidebar.style.marginLeft = "0";
        if (contentArea) {
            contentArea.style.width = "calc(100% - 300px)"; // Adjust based on sidebar width
            contentArea.style.marginLeft = "300px"; // Same as sidebar width
        }
        toggleIcon.innerText = "◀";
    }
    
    // Toggle classes for additional styling
    sidebar.classList.toggle("collapsed", isSidebarCollapsed);
    if (contentArea) {
        contentArea.classList.toggle("expanded", isSidebarCollapsed);
    }
}

// Toggle metadata panel
function toggleMetadataPanel() {
    const metadataPanel = document.getElementById("noteMetadata");
    const toggleBtn = document.getElementById("toggleMetadata");
    
    isMetadataPanelCollapsed = !isMetadataPanelCollapsed;
    
    metadataPanel.classList.toggle("collapsed", isMetadataPanelCollapsed);
    toggleBtn.innerText = isMetadataPanelCollapsed ? "▶ Show Details" : "◀ Hide Details";
}

// Function to save data
function saveProgress() {
    localStorage.setItem("dailyPlanner", JSON.stringify(plannerData));
}

// Function to load saved data
function loadProgress() {
    const folderContainer = document.getElementById("folders");
    folderContainer.innerHTML = "";
    Object.keys(plannerData).forEach(folder => {
        addFolderToUI(folder);
    });
}

// Function to add a new folder
function addFolder() {
    document.getElementById("folderModal").style.display = "flex";
    document.getElementById("folderColorInput").value = "#4CAF50"; // Default color
}

function confirmAddFolder() {
    let folderName = document.getElementById("folderInput").value.trim();
    let folderColor = document.getElementById("folderColorInput").value;
    
    if (folderName && !plannerData[folderName]) {
        plannerData[folderName] = {
            notes: {},
            color: folderColor
        };
        saveProgress();
        addFolderToUI(folderName);
    }
    closeFolderModal();
}

function closeFolderModal() {
    document.getElementById("folderModal").style.display = "none";
    document.getElementById("folderInput").value = "";
}

// Function to add folder UI
function addFolderToUI(folderName) {
    const folderContainer = document.getElementById("folders");
    const folderDiv = document.createElement("div");
    folderDiv.classList.add("folder");
    folderDiv.dataset.folderName = folderName;
    
    // Get folder color
    const folderColor = plannerData[folderName].color || "#4CAF50";
    
    folderDiv.innerHTML = `
        <div class="folder-header" style="border-left: 5px solid ${folderColor}">
            <strong>${folderName}</strong>
            <div class="folder-actions">
                <button class="icon-btn" onclick="renameFolder('${folderName}')">✏️</button>
                <button class="icon-btn" onclick="showDeleteFolderModal('${folderName}')">🗑️</button>
                <button class="open-btn" style="background-color: ${folderColor}" onclick="openFolder('${folderName}')">📂 Open</button>
            </div>
        </div>
        <div class="folder-content hidden">
            <div class="notes-container" id="notes-${folderName.replace(/\s+/g, '-')}"></div>
            <button class="create-note-btn" style="background-color: ${folderColor}" onclick="addNote('${folderName}')">➕ Create Note</button>
        </div>
    `;
    
    folderContainer.appendChild(folderDiv);
}

// Function to open a folder with animations
function openFolder(folderName) {
    activeFolder = folderName;
    
    // Get the folder container by data attribute
    const folderDiv = document.querySelector(`.folder[data-folder-name="${folderName}"]`);
    if (!folderDiv) return;
    
    const folderContent = folderDiv.querySelector('.folder-content');
    const openBtn = folderDiv.querySelector('.open-btn');
    
    if (folderContent.classList.contains('hidden')) {
        // Opening the folder
        folderContent.classList.remove('hidden');
        openBtn.textContent = "📂 Close";
        openBtn.classList.add('open');
        
        // Load notes for this folder
        const notesContainerId = `notes-${folderName.replace(/\s+/g, '-')}`;
        loadNotes(folderName, notesContainerId);
    } else {
        // Closing the folder
        folderContent.classList.add('hidden');
        openBtn.textContent = "📂 Open";
        openBtn.classList.remove('open');
    }
}

// Function to load notes inside a folder
function loadNotes(folderName, containerId) {
    const notesContainer = document.getElementById(containerId);
    if (!notesContainer) return;
    
    notesContainer.innerHTML = "";
    
    if (plannerData[folderName] && plannerData[folderName].notes) {
        Object.keys(plannerData[folderName].notes).forEach(noteName => {
            addNoteToUI(folderName, noteName, notesContainer);
        });
    }
}

// Function to add a new note
function addNote(folderName) {
    activeFolder = folderName;
    document.getElementById("noteModal").style.display = "flex";
    
    // Set default values
    document.getElementById("notePriority").value = "medium";
    
    // Set due date to tomorrow by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("noteDueDate").valueAsDate = tomorrow;
    
    // Focus on the content textarea after a brief delay
    setTimeout(() => {
        document.getElementById("noteContentInput").focus();
    }, 300);
}

function confirmAddNote() {
    let noteName = document.getElementById("noteInput").value.trim();
    let noteContent = document.getElementById("noteContentInput").value.trim();
    let notePriority = document.getElementById("notePriority").value;
    let noteDueDate = document.getElementById("noteDueDate").value;
    
    // Generate a default title if none is provided but content exists
    if (!noteName && noteContent) {
        // Use the first line or first few words as the title
        noteName = noteContent.split('\n')[0].trim().substring(0, 30);
        if (noteName.length === 30) noteName += '...';
        if (!noteName) noteName = "Untitled Note";
    }
    
    if (noteName && activeFolder) {
        if (!plannerData[activeFolder].notes) {
            plannerData[activeFolder].notes = {};
        }
        
        if (!plannerData[activeFolder].notes[noteName]) {
            plannerData[activeFolder].notes[noteName] = {
                content: noteContent,
                priority: notePriority,
                dueDate: noteDueDate,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            saveProgress();
            const notesContainerId = `notes-${activeFolder.replace(/\s+/g, '-')}`;
            loadNotes(activeFolder, notesContainerId);
        }
    }
    closeNoteModal();
}

function closeNoteModal() {
    document.getElementById("noteModal").style.display = "none";
    document.getElementById("noteInput").value = "";
    document.getElementById("noteContentInput").value = "";
}

// Function to add note UI
function addNoteToUI(folderName, noteName, container) {
    const noteData = plannerData[folderName].notes[noteName];
    const noteDiv = document.createElement("div");
    noteDiv.classList.add("note");
    
    // Set priority color
    let priorityColor = "#4CAF50"; // Default green (medium)
    if (noteData.priority === "high") {
        priorityColor = "#f44336"; // Red
    } else if (noteData.priority === "low") {
        priorityColor = "#2196F3"; // Blue
    }
    
    // Format due date
    const dueDate = new Date(noteData.dueDate);
    const formattedDate = dueDate.toLocaleDateString();
    
    // Check if note is overdue
    const isOverdue = new Date() > dueDate && !noteData.completed;
    
    // Check if note is completed
    const completedClass = noteData.completed ? "completed" : "";
    
    // Create preview of content
    const contentPreview = noteData.content 
        ? `<div class="note-preview">${noteData.content.substring(0, 60)}${noteData.content.length > 60 ? '...' : ''}</div>` 
        : '';
    
    noteDiv.innerHTML = `
        <div class="note-header" style="border-left: 5px solid ${priorityColor}">
            <div class="note-title ${completedClass} ${isOverdue ? 'overdue' : ''}">
                <input type="checkbox" ${noteData.completed ? 'checked' : ''} onchange="toggleNoteComplete('${folderName}', '${noteName}')">
                <strong>${noteName}</strong>
            </div>
            ${contentPreview}
            <div class="note-meta">
                <span class="due-date" title="Due date">📅 ${formattedDate}</span>
                <span class="priority" title="Priority: ${noteData.priority}">🚩</span>
            </div>
        </div>
        <div class="note-actions">
            <button class="icon-btn" onclick="openNote('${folderName}', '${noteName}')">📜 Open</button>
            <button class="icon-btn" onclick="showDeleteNoteModal('${folderName}', '${noteName}')">🗑️</button>
        </div>
    `;
    
    container.appendChild(noteDiv);
}

// Toggle note completion status
function toggleNoteComplete(folderName, noteName) {
    plannerData[folderName].notes[noteName].completed = !plannerData[folderName].notes[noteName].completed;
    saveProgress();
    const notesContainerId = `notes-${folderName.replace(/\s+/g, '-')}`;
    loadNotes(folderName, notesContainerId);
}

// Override the existing openNote function to use our new editor view
function openNote(folderName, noteName) {
    activeFolder = folderName;
    activeNote = noteName;
    
    // Get note data
    const noteData = plannerData[folderName].notes[noteName];
    
    // Store current editing note
    currentlyEditingNote = {
        folder: folderName,
        note: noteName,
        data: noteData
    };
    
    // Update editor UI
    document.getElementById("editorNoteTitle").innerText = noteName;
    document.getElementById("noteEditorTextarea").value = noteData.content || "";
    document.getElementById("editorNotePriority").value = noteData.priority || "medium";
    document.getElementById("editorNoteDueDate").value = noteData.dueDate || "";
    document.getElementById("editorNoteStatus").value = noteData.completed ? "completed" : "active";
    
    // Format dates
    const createdDate = new Date(noteData.createdAt);
    document.getElementById("noteCreatedDate").innerText = createdDate.toLocaleString();
    
    const modifiedDate = noteData.modifiedAt ? new Date(noteData.modifiedAt) : createdDate;
    document.getElementById("noteModifiedDate").innerText = modifiedDate.toLocaleString();
    
    // Show editor and hide welcome screen
    document.getElementById("welcomeScreen").classList.add("hidden");
    document.getElementById("noteEditor").classList.remove("hidden");
    
    // If sidebar is taking too much space on small screens, collapse it
    if (window.innerWidth < 768) {
        if (!isSidebarCollapsed) {
            toggleSidebar();
        }
    }
    
    // Focus on the content textarea
    setTimeout(() => {
        document.getElementById("noteEditorTextarea").focus();
    }, 300);
}

// Function to save note changes (the old version, left for compatibility)
function saveNote() {
    if (activeFolder && activeNote) {
        plannerData[activeFolder].notes[activeNote].content = document.getElementById("noteContent").value;
        plannerData[activeFolder].notes[activeNote].priority = document.getElementById("editNotePriority").value;
        plannerData[activeFolder].notes[activeNote].dueDate = document.getElementById("editNoteDueDate").value;
        saveProgress();
    }
    closeNoteEditor();
}

// Save note from the new editor
function saveNoteFromEditor() {
    if (currentlyEditingNote && currentlyEditingNote.folder && currentlyEditingNote.note) {
        const folder = currentlyEditingNote.folder;
        const note = currentlyEditingNote.note;
        
        // Get updated values
        const content = document.getElementById("noteEditorTextarea").value;
        const priority = document.getElementById("editorNotePriority").value;
        const dueDate = document.getElementById("editorNoteDueDate").value;
        const completed = document.getElementById("editorNoteStatus").value === "completed";
        
        // Update note data
        plannerData[folder].notes[note].content = content;
        plannerData[folder].notes[note].priority = priority;
        plannerData[folder].notes[note].dueDate = dueDate;
        plannerData[folder].notes[note].completed = completed;
        plannerData[folder].notes[note].modifiedAt = new Date().toISOString();
        
        // Save changes
        saveProgress();
        
        // Update last modified date in UI
        const modifiedDate = new Date();
        document.getElementById("noteModifiedDate").innerText = modifiedDate.toLocaleString();
        
        // Show success message (optional)
        showToast("Note saved successfully");
        
        // Refresh notes in the sidebar
        const notesContainerId = `notes-${folder.replace(/\s+/g, '-')}`;
        loadNotes(folder, notesContainerId);
    }
}

// Close the note editor
function closeNoteEditor() {
    // Hide editor and show welcome screen
    document.getElementById("noteEditor").classList.add("hidden");
    document.getElementById("welcomeScreen").classList.remove("hidden");
    
    // Reset current editing note
    currentlyEditingNote = null;
    
    // If sidebar was collapsed, expand it
    if (isSidebarCollapsed) {
        toggleSidebar();
    }
}

// Function to show delete folder confirmation modal
function showDeleteFolderModal(folderName) {
    folderToDelete = folderName;
    document.getElementById("deleteFolderModal").style.display = "flex";
    document.getElementById("deleteFolderName").innerText = folderName;
}

// Function to confirm folder deletion
function confirmDeleteFolder() {
    if (folderToDelete) {
        delete plannerData[folderToDelete];
        saveProgress();
        loadProgress();
        folderToDelete = null;
    }
    closeDeleteFolderModal();
}

// Function to close delete folder modal
function closeDeleteFolderModal() {
    document.getElementById("deleteFolderModal").style.display = "none";
}

// Function to show delete note confirmation modal
function showDeleteNoteModal(folderName, noteName) {
    folderToDelete = folderName;
    noteToDelete = noteName;
    document.getElementById("deleteNoteModal").style.display = "flex";
    document.getElementById("deleteNoteName").innerText = noteName;
}

// Function to confirm note deletion
function confirmDeleteNote() {
    if (folderToDelete && noteToDelete) {
        delete plannerData[folderToDelete].notes[noteToDelete];
        saveProgress();
        const notesContainerId = `notes-${folderToDelete.replace(/\s+/g, '-')}`;
        loadNotes(folderToDelete, notesContainerId);
    }
    closeDeleteNoteModal();
}

// Function to close delete note modal
function closeDeleteNoteModal() {
    document.getElementById("deleteNoteModal").style.display = "none";
    folderToDelete = null;
    noteToDelete = null;
}

// Function to open rename folder modal
function renameFolder(folderName) {
    folderToRename = folderName;
    document.getElementById("renameFolderInput").value = folderName;
    document.getElementById("renameFolderColorInput").value = plannerData[folderName].color || "#4CAF50";
    document.getElementById("renameFolderModal").style.display = "flex";
}

// Function to confirm folder rename
function confirmRenameFolder() {
    let newFolderName = document.getElementById("renameFolderInput").value.trim();
    let newFolderColor = document.getElementById("renameFolderColorInput").value;
    
    if (newFolderName && (newFolderName !== folderToRename || newFolderColor !== plannerData[folderToRename].color)) {
        if (newFolderName !== folderToRename && !plannerData[newFolderName]) {
            // Name has changed, create new folder
            plannerData[newFolderName] = {
                notes: plannerData[folderToRename].notes,
                color: newFolderColor
            };
            delete plannerData[folderToRename];
        } else {
            // Only color has changed
            plannerData[folderToRename].color = newFolderColor;
        }
        saveProgress();
        loadProgress();
    }
    closeRenameFolderModal();
}

// Function to close rename folder modal
function closeRenameFolderModal() {
    document.getElementById("renameFolderModal").style.display = "none";
    document.getElementById("renameFolderInput").value = "";
    folderToRename = null;
}

// Search functionality
function performSearch() {
    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
    const searchResults = document.getElementById("searchResults");
    
    // Clear previous results
    searchResults.innerHTML = "";
    
    if (searchTerm.length < 2) {
        searchResults.classList.add("hidden");
        return;
    }
    
    searchResults.classList.remove("hidden");
    let resultsFound = 0;
    
   // Search through all notes
    Object.keys(plannerData).forEach(folderName => {
        if (plannerData[folderName].notes) {
            Object.keys(plannerData[folderName].notes).forEach(noteName => {
                const noteData = plannerData[folderName].notes[noteName];
                const noteContent = noteData.content.toLowerCase();
                const noteTitleLower = noteName.toLowerCase();
                
                if (noteTitleLower.includes(searchTerm) || noteContent.includes(searchTerm)) {
                    // Add to search results
                    const resultItem = document.createElement("div");
                    resultItem.classList.add("search-result");
                    resultItem.innerHTML = `
                        <div class="result-info">
                            <div class="result-title">${noteName}</div>
                            <div class="result-folder">in ${folderName}</div>
                        </div>
                        <button class="result-open-btn" onclick="openNoteFromSearch('${folderName}', '${noteName}')">Open</button>
                    `;
                    searchResults.appendChild(resultItem);
                    resultsFound++;
                }
            });
        }
    });
    
    if (resultsFound === 0) {
        searchResults.innerHTML = "<div class='no-results'>No results found</div>";
    }
}

// Clear search
function clearSearch() {
    document.getElementById("searchInput").value = "";
    document.getElementById("searchResults").classList.add("hidden");
}

// Open note from search results
function openNoteFromSearch(folderName, noteName) {
    // First open the folder
    openFolder(folderName);
    
    // Then open the note
    setTimeout(() => {
        openNote(folderName, noteName);
    }, 300);
    
    // Clear search
    clearSearch();
}

// Simple toast notification function
function showToast(message, duration = 3000) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.backgroundColor = "var(--success-color)";
        toast.style.color = "white";
        toast.style.padding = "10px 20px";
        toast.style.borderRadius = "4px";
        toast.style.zIndex = "1000";
        toast.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
        toast.style.transition = "opacity 0.3s ease";
        document.body.appendChild(toast);
    }
    
    // Update message and show
    toast.textContent = message;
    toast.style.opacity = "1";
    
    // Hide after duration
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.style.opacity = "0";
    }, duration);
}





//Create, Log-In, Log-Out Account Function
// Authentication System for Daily Planner

// User data structure
let users = JSON.parse(localStorage.getItem('planner_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('planner_current_user')) || null;

// DOM elements for auth
document.addEventListener('DOMContentLoaded', function() {
  // Create auth container and add it to the DOM
  const appContainer = document.querySelector('.app-container');
  const authContainer = document.createElement('div');
  authContainer.id = 'authContainer';
  authContainer.className = 'auth-container';
  
  // Set up HTML for auth forms
  authContainer.innerHTML = `
    <div class="auth-modal">
      <div class="auth-tabs">
        <button class="auth-tab active" id="loginTab">Login</button>
        <button class="auth-tab" id="registerTab">Register</button>
      </div>
      
      <div class="auth-form-container">
        <!-- Login Form -->
        <form id="loginForm" class="auth-form">
          <div class="form-group">
            <label for="loginEmail">Email</label>
            <input type="email" id="loginEmail" required placeholder="Enter your email">
          </div>
          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input type="password" id="loginPassword" required placeholder="Enter your password">
          </div>
          <button type="submit" class="auth-button">Login</button>
          <p id="loginError" class="auth-error"></p>
        </form>
        
        <!-- Register Form -->
        <form id="registerForm" class="auth-form hidden">
          <div class="form-group">
            <label for="registerName">Name</label>
            <input type="text" id="registerName" required placeholder="Enter your name">
          </div>
          <div class="form-group">
            <label for="registerEmail">Email</label>
            <input type="email" id="registerEmail" required placeholder="Enter your email">
          </div>
          <div class="form-group">
            <label for="registerPassword">Password</label>
            <input type="password" id="registerPassword" required placeholder="Create a password">
          </div>
          <div class="form-group">
            <label for="registerConfirmPassword">Confirm Password</label>
            <input type="password" id="registerConfirmPassword" required placeholder="Confirm your password">
          </div>
          <button type="submit" class="auth-button">Create Account</button>
          <p id="registerError" class="auth-error"></p>
        </form>
      </div>
    </div>
  `;
  
  // Add auth container before the app container
  document.body.insertBefore(authContainer, appContainer);
  
  // Add user profile button to the header
  const header = document.querySelector('.header');
  const userProfileButton = document.createElement('button');
  userProfileButton.id = 'userProfileBtn';
  userProfileButton.innerHTML = '👤 User';
  userProfileButton.className = 'hidden';
  
  const toolbar = header.querySelector('.toolbar');
  toolbar.insertBefore(userProfileButton, toolbar.firstChild);
  
  // Create user dropdown menu
  const userDropdown = document.createElement('div');
  userDropdown.id = 'userDropdown';
  userDropdown.className = 'user-dropdown hidden';
  userDropdown.innerHTML = `
    <div class="user-dropdown-header">
      <span id="userDisplayName"></span>
      <span id="userDisplayEmail"></span>
    </div>
    <div class="user-dropdown-content">
      <button id="logoutBtn">Logout</button>
    </div>
  `;
  
  header.appendChild(userDropdown);
  
  // Add event listeners
  document.getElementById('loginTab').addEventListener('click', showLoginForm);
  document.getElementById('registerTab').addEventListener('click', showRegisterForm);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('userProfileBtn').addEventListener('click', toggleUserDropdown);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // Check if user is already logged in
  checkAuthState();
  
  // Add styles
  addAuthStyles();
});

// Authentication functions
function showLoginForm() {
  document.getElementById('loginTab').classList.add('active');
  document.getElementById('registerTab').classList.remove('active');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
}

function showRegisterForm() {
  document.getElementById('registerTab').classList.add('active');
  document.getElementById('loginTab').classList.remove('active');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorElement = document.getElementById('loginError');
  
  // Validate inputs
  if (!email || !password) {
    errorElement.textContent = 'Please enter both email and password';
    return;
  }
  
  // Check if user exists
  const user = users.find(u => u.email === email);
  if (!user) {
    errorElement.textContent = 'User not found';
    return;
  }
  
  // Check password
  if (user.password !== password) {
    errorElement.textContent = 'Incorrect password';
    return;
  }
  
  // Login successful
  loginUser(user);
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const errorElement = document.getElementById('registerError');
  
  // Validate inputs
  if (!name || !email || !password || !confirmPassword) {
    errorElement.textContent = 'Please fill in all fields';
    return;
  }
  
  // Check if passwords match
  if (password !== confirmPassword) {
    errorElement.textContent = 'Passwords do not match';
    return;
  }
  
  // Check if user already exists
  if (users.some(u => u.email === email)) {
    errorElement.textContent = 'User with this email already exists';
    return;
  }
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    folders: getDefaultFolders(), // Create default folders for new users
    created: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers();
  
  // Login the new user
  loginUser(newUser);
}

function loginUser(user) {
  // Set current user
  currentUser = {
    id: user.id,
    name: user.name,
    email: user.email
  };
  
  // Save to localStorage
  localStorage.setItem('planner_current_user', JSON.stringify(currentUser));
  
  // Update UI
  hideAuthContainer();
  showUserProfile();
  
  // Load user data
  loadUserData(user.id);
}

function handleLogout() {
  // Clear current user
  currentUser = null;
  localStorage.removeItem('planner_current_user');
  
  // Update UI
  hideUserProfile();
  showAuthContainer();
  
  // Clear displayed data
  resetAppState();
}

function checkAuthState() {
  if (currentUser) {
    hideAuthContainer();
    showUserProfile();
    loadUserData(currentUser.id);
  } else {
    showAuthContainer();
    hideUserProfile();
  }
}

function hideAuthContainer() {
  document.getElementById('authContainer').classList.add('hidden');
  document.querySelector('.app-container').classList.remove('hidden');
}

function showAuthContainer() {
  document.getElementById('authContainer').classList.remove('hidden');
  document.querySelector('.app-container').classList.add('hidden');
}

function showUserProfile() {
  const userProfileBtn = document.getElementById('userProfileBtn');
  userProfileBtn.classList.remove('hidden');
  userProfileBtn.textContent = `👤 ${currentUser.name}`;
  
  // Update dropdown
  document.getElementById('userDisplayName').textContent = currentUser.name;
  document.getElementById('userDisplayEmail').textContent = currentUser.email;
}

function hideUserProfile() {
  document.getElementById('userProfileBtn').classList.add('hidden');
  document.getElementById('userDropdown').classList.add('hidden');
}

function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('hidden');
}

function saveUsers() {
  localStorage.setItem('planner_users', JSON.stringify(users));
}

// Data management functions
function getDefaultFolders() {
  return [
    {
      id: 'default',
      name: 'Default',
      color: '#4CAF50',
      isOpen: true,
      notes: []
    },
    {
      id: 'work',
      name: 'Work',
      color: '#2196F3',
      isOpen: true,
      notes: []
    },
    {
      id: 'personal',
      name: 'Personal',
      color: '#FF9800',
      isOpen: true,
      notes: []
    }
  ];
}

function loadUserData(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  
  // Load folders
  window.folders = user.folders || getDefaultFolders();
  
  // Re-render folders
  renderFolders();
}

function saveUserData() {
  if (!currentUser) return;
  
  // Find user in users array
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  if (userIndex === -1) return;
  
  // Update user data
  users[userIndex].folders = window.folders;
  
  // Save to localStorage
  saveUsers();
}

function resetAppState() {
  // Clear all data from the UI
  window.folders = getDefaultFolders();
  renderFolders();
  
  // Hide editor if open
  const noteEditor = document.getElementById('noteEditor');
  if (!noteEditor.classList.contains('hidden')) {
    noteEditor.classList.add('hidden');
    document.getElementById('welcomeScreen').classList.remove('hidden');
  }
}

// Override the original save functions to save user data
const originalAddFolder = window.addFolder;
window.addFolder = function(name, color) {
  originalAddFolder(name, color);
  saveUserData();
};

// Hook into existing functions to save user data after operations
function hookSaveFunctions() {
  // Store original functions
  const originalFunctions = {
    saveNote: window.saveNote,
    deleteNote: window.deleteNote,
    deleteFolder: window.deleteFolder,
    renameFolder: window.renameFolder
  };
  
  // Override functions to add saving user data
  window.saveNote = function() {
    const result = originalFunctions.saveNote.apply(this, arguments);
    saveUserData();
    return result;
  };
  
  window.deleteNote = function() {
    const result = originalFunctions.deleteNote.apply(this, arguments);
    saveUserData();
    return result;
  };
  
  window.deleteFolder = function() {
    const result = originalFunctions.deleteFolder.apply(this, arguments);
    saveUserData();
    return result;
  };
  
  window.renameFolder = function() {
    const result = originalFunctions.renameFolder.apply(this, arguments);
    saveUserData();
    return result;
  };
}

// Call this after the original app script has loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait for the original script to initialize
  setTimeout(hookSaveFunctions, 100);
});

// Add styles for auth components
function addAuthStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .auth-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--background-color);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .auth-modal {
      background-color: var(--card-background);
      border-radius: 8px;
      box-shadow: 0 4px 12px var(--shadow-color);
      width: 400px;
      max-width: 90%;
      overflow: hidden;
    }
    
    .auth-tabs {
      display: flex;
      border-bottom: 1px solid var(--border-color);
    }
    
    .auth-tab {
      flex: 1;
      padding: 15px;
      text-align: center;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-color);
      font-weight: bold;
      transition: background-color 0.3s;
    }
    
    .auth-tab.active {
      background-color: var(--card-background);
      border-bottom: 3px solid var(--button-primary);
    }
    
    .auth-form-container {
      padding: 20px;
    }
    
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .auth-button {
      padding: 12px;
      background-color: var(--button-primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s;
    }
    
    .auth-button:hover {
      background-color: var(--button-hover);
    }
    
    .auth-error {
      color: var(--danger-color);
      margin-top: 10px;
      font-size: 14px;
      text-align: center;
    }
    
    .user-dropdown {
      position: absolute;
      top: 60px;
      right: 20px;
      background-color: var(--card-background);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      box-shadow: 0 4px 8px var(--shadow-color);
      z-index: 10;
      width: 200px;
    }
    
    .user-dropdown-header {
      padding: 10px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
    }
    
    #userDisplayName {
      font-weight: bold;
    }
    
    #userDisplayEmail {
      font-size: 0.9em;
      color: #888;
    }
    
    .user-dropdown-content {
      padding: 10px;
    }
    
    .user-dropdown-content button {
      width: 100%;
      text-align: left;
      padding: 8px;
      background-color: transparent;
      color: var(--text-color);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .user-dropdown-content button:hover {
      background-color: var(--hover-color);
    }
  `;
  document.head.appendChild(styleElement);
}
// Add this function to your auth.js file
function updateSidebarWidth() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.style.width = '20%';
    }
  }
  
  // Call this function after the DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Your existing code
    // ...
    
    // Update sidebar width
    updateSidebarWidth();
  });