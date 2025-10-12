// BACKEND/PlantManagement/utils/greenhouseValidation.js
import Greenhouse from '../models/greenhouseModel.js';

// Cache for valid greenhouses to avoid repeated database queries
let validGreenhousesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get valid greenhouse names from database
export const getValidGreenhouses = async () => {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (validGreenhousesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return validGreenhousesCache;
    }

    // Fetch fresh data from database
    const greenhouses = await Greenhouse.find({}, 'greenhouseName').lean();
    const greenhouseNames = greenhouses.map(gh => gh.greenhouseName);
    
    // Update cache
    validGreenhousesCache = greenhouseNames;
    cacheTimestamp = now;
    
    return greenhouseNames;
  } catch (error) {
    console.error('Error fetching valid greenhouses:', error);
    return [];
  }
};

// Validate if a greenhouse number exists
export const isValidGreenhouse = async (greenhouseNo) => {
  try {
    const validGreenhouses = await getValidGreenhouses();
    return validGreenhouses.includes(greenhouseNo);
  } catch (error) {
    console.error('Error validating greenhouse:', error);
    return false;
  }
};

// Clear cache (useful for testing or when greenhouses are added/removed)
export const clearGreenhouseCache = () => {
  validGreenhousesCache = null;
  cacheTimestamp = null;
};

// Middleware to validate greenhouse in request body
export const validateGreenhouseMiddleware = (greenhouseField = 'greenhouseNo') => {
  return async (req, res, next) => {
    try {
      const greenhouseNo = req.body[greenhouseField];
      
      if (!greenhouseNo) {
        return res.status(400).json({
          success: false,
          message: `${greenhouseField} is required`
        });
      }

      const isValid = await isValidGreenhouse(greenhouseNo);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: `Invalid greenhouse number: ${greenhouseNo}. Please select a valid greenhouse from the list.`
        });
      }

      next();
    } catch (error) {
      console.error('Error in greenhouse validation middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating greenhouse'
      });
    }
  };
};


