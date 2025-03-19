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
  setupNoteEditorListeners(); // Ensure note editor listeners are set up
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById("addFolderBtn")?.addEventListener("click", addFolder);
  document.getElementById("darkModeToggle")?.addEventListener("click", toggleDarkMode);
  document.getElementById("searchInput")?.addEventListener("input", performSearch);
  document.getElementById("clearSearchBtn")?.addEventListener("click", clearSearch);
  document.getElementById("confirmAddNoteBtn")?.addEventListener("click", confirmAddNote);
  
  // Add modal confirmation button listeners
  document.getElementById("confirmAddFolderBtn")?.addEventListener("click", confirmAddFolder);
  document.getElementById("closeFolderBtn")?.addEventListener("click", closeFolderModal);
  document.getElementById("confirmRenameFolderBtn")?.addEventListener("click", confirmRenameFolder);
  document.getElementById("closeRenameFolderBtn")?.addEventListener("click", closeRenameFolderModal);
  document.getElementById("confirmDeleteFolderBtn")?.addEventListener("click", confirmDeleteFolder);
  document.getElementById("closeDeleteFolderBtn")?.addEventListener("click", closeDeleteFolderModal);
  document.getElementById("confirmDeleteNoteBtn")?.addEventListener("click", confirmDeleteNote);
  document.getElementById("closeDeleteNoteBtn")?.addEventListener("click", closeDeleteNoteModal);
}

function setupNoteEditorListeners() {
  document.getElementById("closeEditorBtn")?.addEventListener("click", closeNoteEditor);
  document.getElementById("saveNoteBtn")?.addEventListener("click", saveNoteFromEditor);
  document.getElementById("editorDeleteNote")?.addEventListener("click", deleteNoteFromEditor);
}

function closeNoteEditor() {
  document.getElementById("noteEditor").classList.add("hidden");
  document.getElementById("welcomeScreen").classList.remove("hidden");
  
  // Reset current editing note
  currentlyEditingNote = null;
}

function saveNoteFromEditor() {
  if (!currentlyEditingNote || !currentlyEditingNote.folder || !currentlyEditingNote.note) {
    const currentNoteId = document.getElementById("noteEditor").dataset.noteId;
    const folderId = document.getElementById("noteEditor").dataset.folderId;
    
    if (!currentNoteId || !folderId) {
      console.error("Missing note ID or folder ID");
      return;
    }
    
    // Continue with original implementation for compatibility
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      const noteIndex = folder.notes.findIndex(n => n.id === currentNoteId);
      if (noteIndex !== -1) {
        const content = document.getElementById("noteEditorTextarea").value;
        const priority = document.getElementById("editorNotePriority").value;
        const dueDate = document.getElementById("editorNoteDueDate").value;
        const status = document.getElementById("editorNoteStatus").value;
        
        folder.notes[noteIndex].content = content;
        folder.notes[noteIndex].priority = priority;
        folder.notes[noteIndex].dueDate = dueDate;
        folder.notes[noteIndex].status = status;
        folder.notes[noteIndex].lastModified = new Date().toISOString();
        
        saveFolders();
        renderFolders();
      }
    }
    return;
  }
  
  // Using the currentlyEditingNote object to save changes
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
  
  // Show success message
  showToast("Note saved successfully");
  
  // Refresh notes in the sidebar
  const notesContainerId = `notes-${folder.replace(/\s+/g, '-')}`;
  loadNotes(folder, notesContainerId);
}

function deleteNoteFromEditor() {
  if (currentlyEditingNote && currentlyEditingNote.folder && currentlyEditingNote.note) {
    // Show delete confirmation modal with correct note
    showDeleteNoteModal(currentlyEditingNote.folder, currentlyEditingNote.note);
  } else {
    const currentNoteId = document.getElementById("noteEditor").dataset.noteId;
    const folderId = document.getElementById("noteEditor").dataset.folderId;
    
    if (currentNoteId && folderId) {
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        const note = folder.notes.find(n => n.id === currentNoteId);
        if (note) {
          document.getElementById("deleteNoteName").textContent = note.title;
          document.getElementById("deleteNoteModal").dataset.noteId = currentNoteId;
          document.getElementById("deleteNoteModal").dataset.folderId = folderId;
          document.getElementById("deleteNoteModal").style.display = "flex";
        }
      }
    }
  }
}

function confirmDeleteNote() {
  // Check if we're using the old or new data structure
  const noteId = document.getElementById("deleteNoteModal").dataset.noteId;
  const folderId = document.getElementById("deleteNoteModal").dataset.folderId;
  
  if (noteId && folderId) {
    // Using newer data structure
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      folder.notes = folder.notes.filter(n => n.id !== noteId);
      saveFolders();
      renderFolders();
    }
  } else if (folderToDelete && noteToDelete) {
    // Using older data structure
    delete plannerData[folderToDelete].notes[noteToDelete];
    saveProgress();
    const notesContainerId = `notes-${folderToDelete.replace(/\s+/g, '-')}`;
    loadNotes(folderToDelete, notesContainerId);
    
    // If we're deleting the currently open note, close the editor
    if (currentlyEditingNote && 
        currentlyEditingNote.folder === folderToDelete && 
        currentlyEditingNote.note === noteToDelete) {
      closeNoteEditor();
    }
  }
  
  closeDeleteNoteModal();
}

function openNoteInEditor(noteId, folderId) {
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return;
  
  const note = folder.notes.find(n => n.id === noteId);
  if (!note) return;
  
  document.getElementById("editorNoteTitle").textContent = note.title;
  document.getElementById("noteEditorTextarea").value = note.content;
  document.getElementById("editorNotePriority").value = note.priority;
  document.getElementById("editorNoteDueDate").value = note.dueDate || "";
  document.getElementById("editorNoteStatus").value = note.status || "active";
  document.getElementById("noteCreatedDate").textContent = formatDate(note.created);
  document.getElementById("noteModifiedDate").textContent = formatDate(note.lastModified);
  
  document.getElementById("noteEditor").dataset.noteId = noteId;
  document.getElementById("noteEditor").dataset.folderId = folderId;
  
  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("noteEditor").classList.remove("hidden");
}


function setupSplitViewListeners() {
  // Sidebar toggle
  document.getElementById("sidebarToggle")?.addEventListener("click", toggleSidebar);
  
  // Metadata panel toggle
  document.getElementById("toggleMetadata")?.addEventListener("click", toggleMetadataPanel);
  
  // Delete note from editor
  document.getElementById("editorDeleteNote")?.addEventListener("click", function() {
      if (currentlyEditingNote && currentlyEditingNote.folder && currentlyEditingNote.note) {
          showDeleteNoteModal(currentlyEditingNote.folder, currentlyEditingNote.note);
      }
  });
}

// Setup search functionality
function setupSearchFunctionality() {
  const searchContainer = document.getElementById("searchContainer");
  if (searchContainer) {
    searchContainer.classList.remove("hidden");
  }
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
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const contentArea = document.getElementById("contentArea");
  const toggleIcon = document.getElementById("sidebarToggleIcon");
  
  if (!sidebar) return;
  
  isSidebarCollapsed = !isSidebarCollapsed;
  
  if (isSidebarCollapsed) {
      // Collapse sidebar
      sidebar.style.transform = "translateX(-100%)";
      sidebar.style.marginLeft = "-300px"; // Assuming sidebar width is 300px max
      if (contentArea) {
          contentArea.style.width = "100%";
          contentArea.style.marginLeft = "0";
      }
      if (toggleIcon) {
        toggleIcon.innerText = "▶";
      }
  } else {
      // Expand sidebar
      sidebar.style.transform = "translateX(0)";
      sidebar.style.marginLeft = "0";
      if (contentArea) {
          contentArea.style.width = "calc(100% - 300px)"; // Adjust based on sidebar width
          contentArea.style.marginLeft = "300px"; // Same as sidebar width
      }
      if (toggleIcon) {
        toggleIcon.innerText = "◀";
      }
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
  
  if (!metadataPanel || !toggleBtn) return;
  
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
  if (!folderContainer) return;
  
  folderContainer.innerHTML = "";
  Object.keys(plannerData).forEach(folder => {
      addFolderToUI(folder);
  });
}

// Function to add a new folder
function addFolder() {
  const folderModal = document.getElementById("folderModal");
  const folderColorInput = document.getElementById("folderColorInput");
  
  if (!folderModal || !folderColorInput) return;
  
  folderModal.style.display = "flex";
  folderColorInput.value = "#4CAF50"; // Default color
}

function confirmAddFolder() {
  let folderName = document.getElementById("folderInput")?.value.trim();
  let folderColor = document.getElementById("folderColorInput")?.value;
  
  if (!folderName || !folderColor) return;
  
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
  const folderModal = document.getElementById("folderModal");
  const folderInput = document.getElementById("folderInput");
  
  if (!folderModal) return;
  
  folderModal.style.display = "none";
  if (folderInput) {
    folderInput.value = "";
  }
}

// Function to add folder UI
function addFolderToUI(folderName) {
  const folderContainer = document.getElementById("folders");
  if (!folderContainer) return;
  
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
  
  if (!folderContent || !openBtn) return;
  
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
  const noteModal = document.getElementById("noteModal");
  const notePriority = document.getElementById("notePriority");
  const noteDueDate = document.getElementById("noteDueDate");
  const noteContentInput = document.getElementById("noteContentInput");
  
  if (!noteModal) return;
  
  noteModal.style.display = "flex";
  
  // Set default values
  if (notePriority) {
    notePriority.value = "medium";
  }
  
  // Set due date to tomorrow by default
  if (noteDueDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    noteDueDate.valueAsDate = tomorrow;
  }
  
  // Focus on the content textarea after a brief delay
  if (noteContentInput) {
    setTimeout(() => {
        noteContentInput.focus();
    }, 300);
  }
}

function confirmAddNote() {
  const noteInput = document.getElementById("noteInput");
  const noteContentInput = document.getElementById("noteContentInput");
  const notePriority = document.getElementById("notePriority");
  const noteDueDate = document.getElementById("noteDueDate");
  
  if (!noteInput || !noteContentInput || !notePriority || !noteDueDate) return;
  
  let noteName = noteInput.value.trim();
  let noteContent = noteContentInput.value.trim();
  let notePriorityValue = notePriority.value;
  let noteDueDateValue = noteDueDate.value;
  
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
              priority: notePriorityValue,
              dueDate: noteDueDateValue,
              completed: false,
              createdAt: new Date().toISOString()
          };
          
          saveProgress();
          const notesContainerId = `notes-${activeFolder.replace(/\s+/g, '-')}`;
          loadNotes(activeFolder, notesContainerId);
          
          // Show success message
          showToast("Note created successfully");
      }
  }
  closeNoteModal();
}

function closeNoteModal() {
  const noteModal = document.getElementById("noteModal");
  const noteInput = document.getElementById("noteInput");
  const noteContentInput = document.getElementById("noteContentInput");
  
  if (!noteModal) return;
  
  noteModal.style.display = "none";
  
  if (noteInput) noteInput.value = "";
  if (noteContentInput) noteContentInput.value = "";
}

// Function to add note UI
function addNoteToUI(folderName, noteName, container) {
  if (!container || !plannerData[folderName] || !plannerData[folderName].notes[noteName]) return;
  
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
  let formattedDate = "";
  let isOverdue = false;
  
  if (noteData.dueDate) {
    const dueDate = new Date(noteData.dueDate);
    formattedDate = dueDate.toLocaleDateString();
    isOverdue = new Date() > dueDate && !noteData.completed;
  }
  
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
  if (!plannerData[folderName] || !plannerData[folderName].notes[noteName]) return;
  
  plannerData[folderName].notes[noteName].completed = !plannerData[folderName].notes[noteName].completed;
  saveProgress();
  const notesContainerId = `notes-${folderName.replace(/\s+/g, '-')}`;
  loadNotes(folderName, notesContainerId);
  
  // Show a toast notification
  const status = plannerData[folderName].notes[noteName].completed ? "completed" : "active";
  showToast(`Note marked as ${status}`);
}

// Format date helper for consistent date formatting
function formatDate(dateString) {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return "Invalid date";
  }
}

// Override the existing openNote function to use our new editor view
function openNote(folderName, noteName) {
  if (!plannerData[folderName] || !plannerData[folderName].notes[noteName]) return;
  
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
  const editorNoteTitle = document.getElementById("editorNoteTitle");
  const noteEditorTextarea = document.getElementById("noteEditorTextarea");
  const editorNotePriority = document.getElementById("editorNotePriority");
  const editorNoteDueDate = document.getElementById("editorNoteDueDate");
  const editorNoteStatus = document.getElementById("editorNoteStatus");
  const noteCreatedDate = document.getElementById("noteCreatedDate");
  const noteModifiedDate = document.getElementById("noteModifiedDate");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const noteEditor = document.getElementById("noteEditor");
  
  if (editorNoteTitle) editorNoteTitle.innerText = noteName;
  if (noteEditorTextarea) noteEditorTextarea.value = noteData.content || "";
  if (editorNotePriority) editorNotePriority.value = noteData.priority || "medium";
  if (editorNoteDueDate) editorNoteDueDate.value = noteData.dueDate || "";
  if (editorNoteStatus) editorNoteStatus.value = noteData.completed ? "completed" : "active";
  
  // Format dates
  const createdDate = new Date(noteData.createdAt);
  if (noteCreatedDate) noteCreatedDate.innerText = createdDate.toLocaleString();
  
  const modifiedDate = noteData.modifiedAt ? new Date(noteData.modifiedAt) : createdDate;
  if (noteModifiedDate) noteModifiedDate.innerText = modifiedDate.toLocaleString();
  
  // Show editor and hide welcome screen
  if (welcomeScreen) welcomeScreen.classList.add("hidden");
  if (noteEditor) noteEditor.classList.remove("hidden");
  
  // If sidebar is taking too much space on small screens, collapse it
  if (window.innerWidth < 768) {
      if (!isSidebarCollapsed) {
          toggleSidebar();
      }
  }
  
  // Focus on the content textarea
  if (noteEditorTextarea) {
    setTimeout(() => {
        noteEditorTextarea.focus();
    }, 300);
  }
}

// Save note from the new editor
function saveNoteFromEditor() {
  if (currentlyEditingNote && currentlyEditingNote.folder && currentlyEditingNote.note) {
      const folder = currentlyEditingNote.folder;
      const note = currentlyEditingNote.note;
      
      const noteEditorTextarea = document.getElementById("noteEditorTextarea");
      const editorNotePriority = document.getElementById("editorNotePriority");
      const editorNoteDueDate = document.getElementById("editorNoteDueDate");
      const editorNoteStatus = document.getElementById("editorNoteStatus");
      const noteModifiedDate = document.getElementById("noteModifiedDate");
      
      if (!noteEditorTextarea || !editorNotePriority || !editorNoteDueDate || !editorNoteStatus) return;
      
      // Get updated values
      const content = noteEditorTextarea.value;
      const priority = editorNotePriority.value;
      const dueDate = editorNoteDueDate.value;
      const completed = editorNoteStatus.value === "completed";
      
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
      if (noteModifiedDate) noteModifiedDate.innerText = modifiedDate.toLocaleString();
      
      // Show success message
      showToast("Note saved successfully");
      
      // Refresh notes in the sidebar
      const notesContainerId = `notes-${folder.replace(/\s+/g, '-')}`;
      loadNotes(folder, notesContainerId);
  }
}

// Function to show delete folder confirmation modal
function showDeleteFolderModal(folderName) {
  folderToDelete = folderName;
  
  const deleteFolderModal = document.getElementById("deleteFolderModal");
  const deleteFolderName = document.getElementById("deleteFolderName");
  
  if (!deleteFolderModal || !deleteFolderName) return;
  
  deleteFolderModal.style.display = "flex";
  deleteFolderName.innerText = folderName;
}

// Function to confirm folder deletion
function confirmDeleteFolder() {
  if (folderToDelete) {
      delete plannerData[folderToDelete];
      saveProgress();
      loadProgress();
      folderToDelete = null;
      
      // Show success message
      showToast("Folder deleted successfully");
  }
  closeDeleteFolderModal();
}

// Function to close delete folder modal
function closeDeleteFolderModal() {
  const deleteFolderModal = document.getElementById("deleteFolderModal");
  if (deleteFolderModal) {
    deleteFolderModal.style.display = "none";
  }
}

// Function to show delete note confirmation modal
function showDeleteNoteModal(folderName, noteName) {
  folderToDelete = folderName;
  noteToDelete = noteName;
  
  const deleteNoteModal = document.getElementById("deleteNoteModal");
  const deleteNoteName = document.getElementById("deleteNoteName");
  
  if (!deleteNoteModal || !deleteNoteName) return;
  
  deleteNoteModal.style.display = "flex";
  deleteNoteName.innerText = noteName;
}

// Function to confirm note deletion
function confirmDeleteNote() {
  if (folderToDelete && noteToDelete) {
      // Check if note exists before trying to delete
      if (plannerData[folderToDelete] && plannerData[folderToDelete].notes && 
          plannerData[folderToDelete].notes[noteToDelete]) {
        
        delete plannerData[folderToDelete].notes[noteToDelete];
        saveProgress();
        const notesContainerId = `notes-${folderToDelete.replace(/\s+/g, '-')}`;
        loadNotes(folderToDelete, notesContainerId);
        
// If we're deleting the currently open note, close the editor
if (currentlyEditingNote && 
  currentlyEditingNote.folder === folderToDelete && 
  currentlyEditingNote.note === noteToDelete) {
closeNoteEditor();
}

// Show success message
showToast("Note deleted successfully");
}
}
closeDeleteNoteModal();
}

// Function to close delete note modal
function closeDeleteNoteModal() {
const deleteNoteModal = document.getElementById("deleteNoteModal");
if (deleteNoteModal) {
deleteNoteModal.style.display = "none";
}
folderToDelete = null;
noteToDelete = null;
}

// Function to initiate rename folder operation
function renameFolder(folderName) {
folderToRename = folderName;

const renameFolderModal = document.getElementById("renameFolderModal");
const renameFolderInput = document.getElementById("renameFolderInput");
const folderColorRenameInput = document.getElementById("folderColorRenameInput");

if (!renameFolderModal || !renameFolderInput || !folderColorRenameInput) return;

renameFolderModal.style.display = "flex";
renameFolderInput.value = folderName;
folderColorRenameInput.value = plannerData[folderName].color || "#4CAF50";
}

// Function to confirm folder rename
function confirmRenameFolder() {
const renameFolderInput = document.getElementById("renameFolderInput");
const folderColorRenameInput = document.getElementById("folderColorRenameInput");

if (!renameFolderInput || !folderColorRenameInput) return;

const newFolderName = renameFolderInput.value.trim();
const newColor = folderColorRenameInput.value;

if (folderToRename && newFolderName && newFolderName !== folderToRename) {
// Create new folder entry with the same notes
plannerData[newFolderName] = {
notes: {...plannerData[folderToRename].notes},
color: newColor
};

// Delete old folder
delete plannerData[folderToRename];
saveProgress();
loadProgress();

// Show success message
showToast("Folder renamed successfully");
} else if (folderToRename && newFolderName === folderToRename && plannerData[folderToRename]) {
// Just update the color if name hasn't changed
plannerData[folderToRename].color = newColor;
saveProgress();
loadProgress();

// Show success message
showToast("Folder color updated");
}
closeRenameFolderModal();
}

// Function to close rename folder modal
function closeRenameFolderModal() {
const renameFolderModal = document.getElementById("renameFolderModal");
if (renameFolderModal) {
renameFolderModal.style.display = "none";
}
folderToRename = null;
}

// Search functionality
function performSearch() {
const searchInput = document.getElementById("searchInput");
if (!searchInput) return;

const searchTerm = searchInput.value.toLowerCase().trim();
const searchResults = document.getElementById("searchResults");

if (!searchResults) return;

// Clear previous search results
searchResults.innerHTML = "";

if (searchTerm.length < 2) {
searchResults.innerHTML = "";
return;
}

// Show search results container
searchResults.classList.remove("hidden");

let resultCount = 0;

// Search through all folders and notes
Object.keys(plannerData).forEach(folderName => {
const folder = plannerData[folderName];
if (folder && folder.notes) {
Object.keys(folder.notes).forEach(noteName => {
const note = folder.notes[noteName];

// Check if note title or content contains search term
if (noteName.toLowerCase().includes(searchTerm) || 
  (note.content && note.content.toLowerCase().includes(searchTerm))) {

resultCount++;

// Create search result item
const resultItem = document.createElement("div");
resultItem.classList.add("search-result-item");

// Format due date if available
let dueDateStr = note.dueDate ? 
  `<span class="search-result-due-date">Due: ${new Date(note.dueDate).toLocaleDateString()}</span>` : '';

// Get a content snippet containing the search term
let contentSnippet = "";
if (note.content) {
  const content = note.content.toLowerCase();
  const termIndex = content.indexOf(searchTerm);
  if (termIndex !== -1) {
    // Create a snippet around the search term
    const startIndex = Math.max(0, termIndex - 30);
    const endIndex = Math.min(content.length, termIndex + searchTerm.length + 30);
    contentSnippet = note.content.substring(startIndex, endIndex);
    if (startIndex > 0) contentSnippet = "..." + contentSnippet;
    if (endIndex < content.length) contentSnippet += "...";
  } else {
    // If term not found in content (might be in title), just use the beginning
    contentSnippet = note.content.substring(0, 60) + "...";
  }
}

// Create the HTML for the result item
resultItem.innerHTML = `
  <div class="search-result-header">
    <strong>${noteName}</strong>
    <span class="search-result-folder">${folderName}</span>
    ${dueDateStr}
  </div>
  <div class="search-result-content">${contentSnippet}</div>
  <button class="search-result-open-btn" onclick="openNote('${folderName}', '${noteName}')">
    Open Note
  </button>
`;

searchResults.appendChild(resultItem);
}
});
}
});

// Show "no results" message if needed
if (resultCount === 0) {
searchResults.innerHTML = `<div class="no-results">No results found for "${searchTerm}"</div>`;
}
}

// Clear search
function clearSearch() {
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

if (searchInput) searchInput.value = "";
if (searchResults) {
searchResults.innerHTML = "";
searchResults.classList.add("hidden");
}
}

// Toast notification system
function showToast(message, duration = 3000) {
// Create toast container if it doesn't exist
let toastContainer = document.getElementById("toastContainer");
if (!toastContainer) {
toastContainer = document.createElement("div");
toastContainer.id = "toastContainer";
document.body.appendChild(toastContainer);
}

// Create toast message element
const toast = document.createElement("div");
toast.classList.add("toast");
toast.textContent = message;

// Add toast to container
toastContainer.appendChild(toast);

// Animation to show the toast
setTimeout(() => {
toast.classList.add("show");
}, 10);

// Remove toast after duration
setTimeout(() => {
toast.classList.remove("show");
setTimeout(() => {
if (toastContainer.contains(toast)) {
toastContainer.removeChild(toast);
}
}, 300); // Match this with CSS transition time
}, duration);
}