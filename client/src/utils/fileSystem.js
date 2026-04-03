import { get, set } from 'idb-keyval';

/**
 * 1. Open Directory Picker & Save Handle
 * Opens the native OS folder picker and saves the reference to IndexedDB.
 */
export const openDirectory = async () => {
  // Feature detection
  if (!('showDirectoryPicker' in window)) {
    alert("Your browser doesn't support the File System Access API. Please use Chrome, Edge, or Opera.");
    return null;
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'read'
    });
    
    // Save the handle to IndexedDB with a unique ID (we use the folder name for simplicity)
    await set(`dir_${handle.name}`, handle);
    
    return handle;
  } catch (err) {
    if (err.name !== 'AbortError') console.error("Error opening directory:", err);
    return null;
  }
};


/**
 * 2. Scan Directory
 * Recursively walks through the directory handle to find files.
 * Returns an array of File objects with a 'webkitRelativePath' property added.
 */
export const scanDirectory = async (dirHandle, path = '') => {
  const files = [];
  
  for await (const entry of dirHandle.values()) {
    const relativePath = path ? `${path}/${entry.name}` : entry.name;
    
    if (entry.kind === 'file') {
      try {
        const file = await entry.getFile();
        // Manually patch the path property so it looks like a standard input upload
        Object.defineProperty(file, 'webkitRelativePath', {
          value: relativePath,
          writable: false
        });
        files.push(file);
      } catch (e) {
        console.warn(`Could not read file: ${entry.name}`, e);
      }
    } else if (entry.kind === 'directory') {
      // Recursive call for subdirectories
      const subFiles = await scanDirectory(entry, relativePath);
      files.push(...subFiles);
    }
  }
  
  return files;
};

/**
 * 3. Restore Access
 * Retrieves the handle from DB and verifies permission.
 */
export const restoreHandle = async (folderName) => {
  try {
    const handle = await get(`dir_${folderName}`);
    if (!handle) return null;

    // Check if we already have permission
    const options = { mode: 'read' };
    if ((await handle.queryPermission(options)) === 'granted') {
      return handle;
    }

    // If not, request it (This triggers the browser prompt)
    if ((await handle.requestPermission(options)) === 'granted') {
      return handle;
    }

    return null;
  } catch (err) {
    console.error("Restoration failed:", err);
    return null;
  }
};