/**
 * Store Location ID Mapping
 * Maps store names to their corresponding location IDs in the Rootments API
 */

const storeLocationMapping = {
  // Store name variations mapped to location IDs
  'z.edapall': { locationID: '6', name: 'Z Edapally' },
  'z edapally': { locationID: '1', name: 'Z Edapally' },
  'sg-edapally': { locationID: '3', name: 'SG Edapally' },
  'sg edapally': { locationID: '15', name: 'SG Edapally' },
  'trivandrum': { locationID: '5', name: 'Trivandrum' },
  'zperintahlmanna': { locationID: '7', name: 'Z Perinthalmanna' },
  'z perinthalmanna': { locationID: '7', name: 'Z Perinthalmanna' },
  'z kottakal': { locationID: '8', name: 'Z Kottakkal' },
  'z kottayam': { locationID: '9', name: 'Z Kottayam' },
  'sg perumbavoor': { locationID: '10', name: 'SG Perumbavoor' },
  'sg trissur': { locationID: '11', name: 'SG Thrissur' },
  'sg chavakkad': { locationID: '12', name: 'SG Chavakkad' },
  'sg calicut': { locationID: '13', name: 'SG Calicut' },
  'sg vadakara': { locationID: '14', name: 'SG Vadakara' },
  'sg edapall': { locationID: '15', name: 'SG Edapally' },
  'sg perinthalmanna': { locationID: '16', name: 'SG Perinthalmanna' },
  'sg kottkal': { locationID: '17', name: 'SG Kottakkal' },
  'sg manjeri': { locationID: '18', name: 'SG Manjeri' },
  'sg palakkad': { locationID: '19', name: 'SG Palakkad' },
  'sg kalpatta': { locationID: '20', name: 'SG Kalpetta' },
  'sg kannur': { locationID: '21', name: 'SG Kannur' }
};

/**
 * Normalize store name for matching
 * @param {string} storeName - Raw store name
 * @returns {string} Normalized store name
 */
function normalizeStoreName(storeName) {
  if (!storeName) return '';
  
  return storeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')  // Remove special characters
    .replace(/\s+/g, '');        // Remove spaces
}

/**
 * Get location ID for a store name
 * @param {string} storeName - Store name from DSR or other sources
 * @returns {string|null} Location ID or null if not found
 */
function getLocationIDForStore(storeName) {
  if (!storeName) return null;
  
  const normalized = normalizeStoreName(storeName);
  
  // Try exact match first
  for (const [key, value] of Object.entries(storeLocationMapping)) {
    if (normalizeStoreName(key) === normalized) {
      console.log(`✓ Exact match: "${storeName}" → Location ID ${value.locationID} (${value.name})`);
      return value.locationID;
    }
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(storeLocationMapping)) {
    const normalizedKey = normalizeStoreName(key);
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      console.log(`≈ Partial match: "${storeName}" → Location ID ${value.locationID} (${value.name})`);
      return value.locationID;
    }
  }
  
  console.log(`✗ No match found for store: "${storeName}"`);
  return null;
}

/**
 * Get all location IDs
 * @returns {Array} Array of all location ID objects
 */
function getAllLocationIDs() {
  return Object.values(storeLocationMapping);
}

/**
 * Fuzzy match store name to get location ID
 * Works similar to the fuzzy matching in dsrController
 * @param {string} storeName - Store name to match
 * @returns {string|null} Location ID or null
 */
function fuzzyMatchStoreToLocationID(storeName) {
  if (!storeName) return null;
  
  const normalize = (str) => str.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const normalizedInput = normalize(storeName);
  
  // Try exact match
  for (const [key, value] of Object.entries(storeLocationMapping)) {
    if (normalize(key) === normalizedInput) {
      return value.locationID;
    }
  }
  
  // Try contains match
  for (const [key, value] of Object.entries(storeLocationMapping)) {
    const normalizedKey = normalize(key);
    if (normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput)) {
      return value.locationID;
    }
  }
  
  // Try keyword match
  const getKeywords = (str) => normalize(str).split(' ')
    .filter(word => word.length > 3)
    .filter(word => !['store', 'suit', 'suitor', 'guy'].includes(word));
  
  const inputKeywords = getKeywords(storeName);
  
  for (const [key, value] of Object.entries(storeLocationMapping)) {
    const keyKeywords = getKeywords(key);
    
    for (const inputWord of inputKeywords) {
      for (const keyWord of keyKeywords) {
        if (inputWord.includes(keyWord) || keyWord.includes(inputWord)) {
          return value.locationID;
        }
      }
    }
  }
  
  return null;
}

module.exports = {
  storeLocationMapping,
  normalizeStoreName,
  getLocationIDForStore,
  getAllLocationIDs,
  fuzzyMatchStoreToLocationID
};

