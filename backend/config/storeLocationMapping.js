/**
 * Store Location ID to Store Name Mapping
 * This mapping is used to match staff performance data (by location ID) with DSR data (by store name)
 */

const LOCATION_ID_TO_STORE_NAME = {
  '1': 'Z.Edapally',
  '3': 'SG.Edapally',
  '5': 'Trivandrum',
  '6': 'Z.Edapally', // Alternative ID for Z.Edapally
  '7': 'PERINTHALMANNA', // Z.Perinthalmanna
  '8': 'Z.Kottakkal',
  '9': 'Z.Kottayam',
  '10': 'SG.Perumbavoor',
  '11': 'SG.Trissur',
  '12': 'SG.Chavakkad',
  '13': 'SG.Calicut',
  '14': 'SG.Vadakara',
  '15': 'SG.Edapally', // Alternative ID for SG.Edapally
  '16': 'SG.Perinthalmanna',
  '17': 'SG.Kottakkal',
  '18': 'SG.Manjeri',
  '19': 'SG.Palakkad', // Palakkad
  '20': 'SG.Kalpetta',
  '21': 'KANNUR' // SG.Kannur
};

/**
 * Get store name from location ID
 * @param {string|number} locationID - Location ID from API
 * @returns {string} Store name
 */
function getStoreNameFromLocationID(locationID) {
  if (!locationID) return 'Unknown';
  
  const id = String(locationID);
  return LOCATION_ID_TO_STORE_NAME[id] || `Location_${id}`;
}

/**
 * Get location ID from store name (reverse lookup)
 * @param {string} storeName - Store name from DSR
 * @returns {string|null} Location ID or null if not found
 */
function getLocationIDFromStoreName(storeName) {
  if (!storeName) return null;
  
  const normalizedStoreName = storeName.toLowerCase().trim()
    .replace(/[^a-z0-9]/g, '') // Remove special characters for matching
    .replace(/\s+/g, '');
  
  // First try exact match
  for (const [locationID, name] of Object.entries(LOCATION_ID_TO_STORE_NAME)) {
    const normalizedMappedName = name.toLowerCase().trim()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
    
    if (normalizedStoreName === normalizedMappedName) {
      return locationID;
    }
  }
  
  // Then try partial match
  for (const [locationID, name] of Object.entries(LOCATION_ID_TO_STORE_NAME)) {
    const normalizedMappedName = name.toLowerCase().trim()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
    
    if (normalizedStoreName.includes(normalizedMappedName) || 
        normalizedMappedName.includes(normalizedStoreName)) {
      return locationID;
    }
  }
  
  // Special case handling for common variations
  if (normalizedStoreName.includes('edapal') || normalizedStoreName.includes('edapally')) {
    if (normalizedStoreName.includes('sg') || normalizedStoreName.includes('suitor')) {
      return '3'; // SG.Edapally
    } else if (normalizedStoreName.includes('z')) {
      return '1'; // Z.Edapally
    }
  }
  
  if (normalizedStoreName.includes('perinthalman')) {
    if (normalizedStoreName.includes('sg')) {
      return '16'; // SG.Perinthalmanna
    } else {
      return '7'; // Z.Perinthalmanna
    }
  }
  
  if (normalizedStoreName.includes('kottakal') || normalizedStoreName.includes('kottakkal')) {
    if (normalizedStoreName.includes('sg')) {
      return '17'; // SG.Kottakkal
    } else {
      return '8'; // Z.Kottakkal
    }
  }
  
  if (normalizedStoreName.includes('palakkad') || normalizedStoreName.includes('palghat')) {
    return '19'; // SG.Palakkad
  }
  
  if (normalizedStoreName.includes('kannur') || normalizedStoreName.includes('cannanore')) {
    return '21'; // SG.Kannur
  }
  
  if (normalizedStoreName.includes('calicut') || normalizedStoreName.includes('kozhikode')) {
    return '13'; // SG.Calicut
  }
  
  if (normalizedStoreName.includes('vadakara') || normalizedStoreName.includes('badagara')) {
    return '14'; // SG.Vadakara
  }
  
  if (normalizedStoreName.includes('manjeri') || normalizedStoreName.includes('manjery')) {
    return '18'; // SG.Manjeri
  }
  
  if (normalizedStoreName.includes('trissur') || normalizedStoreName.includes('trichur') || normalizedStoreName.includes('thrissur')) {
    return '11'; // SG.Trissur
  }
  
  if (normalizedStoreName.includes('edapal') && !normalizedStoreName.includes('sg') && !normalizedStoreName.includes('z')) {
    return '3'; // Default to SG.Edapally if no prefix
  }
  
  return null;
}

module.exports = {
  LOCATION_ID_TO_STORE_NAME,
  getStoreNameFromLocationID,
  getLocationIDFromStoreName
};
