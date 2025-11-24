const User = require("../models/user");
const axios = require("axios");
const path = require("path");


async function getCityFromCoords(lng, lat) {
  const key = `${lng},${lat}`;
  if (cityCache.has(key)) return cityCache.get(key);

  try {
    const response = await axios.get("http://localhost:3000/geocode/reverse-geocode", {
      params: { lat, lng },
      timeout: 8000,
    });
    const city = response.data.city || "Unknown Location";
    cityCache.set(key, city);
    return city;
  } catch (error) {
    console.error(`Reverse geocode failed [${lng},${lat}]:`, error.message);
    cityCache.set(key, "Unknown Location");
    return "Unknown Location";
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// === WORKING matchAllUsers with Aggregation ===
// const matchAllUsers = async (req, res) => {
//   try {
//     const currentUser = await User.findById(req.user.id);
//     if (!currentUser) return res.status(404).json({ error: "User not found" });

//     const page = Math.max(1, parseInt(req.query.page) || 1);
//     const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
//     const skip = (page - 1) * limit;
    
//     const bloodGroup = req.query.bloodGroup?.trim() || null;
//     const maxDistance = parseInt(req.query.maxDistance) || 100000; // meters
    
//     const [userLng, userLat] = currentUser.location.coordinates;
//     const searchRole = currentUser.role === "recipient" ? "donor" : "recipient";
    
//     // Build match stage
//     const matchStage = {
//       _id: { $ne: currentUser._id },
//       role: searchRole,
//     };
//     if (bloodGroup) matchStage.bloodGroup = bloodGroup;
    
//     // Aggregation pipeline
//     const pipeline = [
//       {
//         $geoNear: {
//           near: { type: "Point", coordinates: [userLng, userLat] },
//           distanceField: "dist.calculated",
//           maxDistance: maxDistance,
//           spherical: true,
//           query: matchStage,
//         },
//       },
//       {
//         $match: matchStage, // Re-apply filter (in case query was partial)
//       },
//       {
//         $project: {
//           name: 1,
//           bloodGroup: 1,
//           phonenumber: 1,
//           email: 1,
//           location: 1,
//           role: 1,
//           createdAt: 1,
//           distance: { $round: ["$dist.calculated", 0] }, // in meters → round
//         },
//       },
//       { $sort: { distance: 1 } }, // Closest first
//       { $skip: skip },
//       { $limit: limit },
//     ];
    
//     const [result, totalDocs] = await Promise.all([
//       User.aggregate(pipeline),
//       User.aggregate([
//         { $geoNear: { near: { type: "Point", coordinates: [userLng, userLat] }, distanceField: "dist.calculated", maxDistance, spherical: true, query: matchStage } },
//         { $count: "total" },
//       ]),
//     ]);
    
//     const total = totalDocs[0]?.total || 0;
//     const totalPages = Math.ceil(total / limit);

//     // Enrich with city names
//     const enriched = await Promise.all(
//       result.map(async (user) => ({
//         _id: user._id.toString(),
//         name: user.name || "Anonymous",
//         bloodGroup: user.bloodGroup,
//         phonenumber: user.phonenumber || "Not provided",
//         email: user.email,
//         city: await getCityFromCoords(...user.location.coordinates),
//         distance: Math.round(user.distance / 1000), // meters → km
//         role: user.role,
//         createdAt: user.createdAt,
//       }))
//     );
    
//     res.json({
//       success: true,
//       message: "Matches fetched successfully",
//       data: {
//         matches: enriched,
//         pagination: {
//           page,
//           limit,
//           total,
//           totalPages,
//           hasNextPage: page < totalPages,
//           hasPrevPage: page > 1,
//         },
//         filters: {
//           bloodGroup: bloodGroup || "All",
//           maxDistanceKm: Math.round(maxDistance / 1000),
//           searchingFor: searchRole + "s",
//         },
//         currentUser: {
//           name: currentUser.name,
//           role: currentUser.role,
//           bloodGroup: currentUser.bloodGroup,
//           city: await getCityFromCoords(userLng, userLat),
//         },
//       },
//     });
//   } catch (error) {
//     console.error("matchAllUsers error:", error.message);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch matches",
//       details: error.message,
//     });
//   }
// };
const matchAllUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("location role name bloodGroup");
    if (!currentUser) {
      return res.status(401).json({ error: "User not found" });
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(2, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Optional blood group filter
    const bloodGroup = req.query.bloodGroup?.trim() || null;

    const [userLng, userLat] = currentUser.location.coordinates;
    const searchRole = currentUser.role === "recipient" ? "donor" : "recipient";

    // Match Filter
    const matchFilter = {
      _id: { $ne: currentUser._id },
      role: searchRole,
    };
    if (bloodGroup) matchFilter.bloodGroup = bloodGroup;

    // --- MAIN AGGREGATION ---
    const pipeline = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [userLng, userLat] },
          distanceField: "distance",
          spherical: true,
          query: matchFilter,
        },
      },
      {
        $facet: {
          paginatedResults: [
            { $sort: { distance: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                name: 1,
                bloodGroup: 1,
                phonenumber: 1,
                email: 1,
                location: 1,
                distance: { $round: [{ $divide: ["$distance", 1000] }, 1] }, // meters → km
              },
            },
          ],
          totalCount: [
            { $count: "total" },
          ],
        },
      },
    ];

    const result = await User.aggregate(pipeline);

    const matches = result[0].paginatedResults;
    const total = result[0].totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Enrich with city names (keep order intact)
    const enriched = await Promise.all(
      matches.map(async (user) => ({
        _id: user._id?.toString(),
        name: user.name || "Anonymous",
        bloodGroup: user.bloodGroup,
        phonenumber: user.phonenumber || null,
        city: await getCityFromCoords(...user.location.coordinates),
        distance: user.distance,
      }))
    );

    res.json({
      success: true,
      data: {
        matches: enriched,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        },
        info: {
          showing: "All Available " + (searchRole === "donor" ? "Donors" : "Recipients"),
          bloodGroup: bloodGroup || "All Blood Groups",
          sortedBy: "Nearest First",
        },
      },
    });

  } catch (error) {
    console.error("matchAllUsers error:", error.message);
    res.status(500).json({ success: false, error: "Failed to load matches" });
  }
};

const autocomplete = async (req, res) => { 
   try {
     const query = req.query.q;
     if (!query) return res.status(400).json({ error: 'Query is required' });
     
     const apiKey = process.env.OPENCAGE_API_KEY;
        const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
            params: { q: query, key: apiKey, limit: 5 }
        });

        const suggestions = response.data.results.map(result => result.formatted);
        res.json({ suggestions });
      } catch (error) {
        console.error('Autocomplete error:', error.message);
        res.status(500).json({ error: 'Autocomplete failed', details: error.message });
    }
};

const forwardGeocode = async (req, res) => { 
   try {
        const city = req.query.q;
        if (!city) return res.status(400).json({ error: 'City is required' });

        const apiKey = process.env.OPENCAGE_API_KEY;
        const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
            params: { q: city, key: apiKey }
          });
          
          if (response.data.results.length > 0) {
            const { lat, lng } = response.data.results[0].geometry;
            res.json({ lat, lng });
        } else {
            res.status(404).json({ error: 'City not found' });
        }
    } catch (error) {
        console.error('Geocoding error:', error.message);
        res.status(500).json({ error: 'Geocoding failed', details: error.message });
      }
    };
    
const reverseGeocode = async (req, res) => { 
      try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'Latitude and longitude are required' });

        const apiKey = process.env.OPENCAGE_API_KEY;
        const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
            params: { q: `${lat},${lng}`, key: apiKey }
        });

        if (response.data.results.length > 0) {
            const city = response.data.results[0].formatted; // e.g., "Adoni, Andhra Pradesh, India"
            res.json({ city });
        } else {
          res.status(404).json({ error: 'Location not found' });
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error.message);
        res.status(500).json({ error: 'Reverse geocoding failed', details: error.message });
      }
    };

    // Cache: "lng,lat" → city name
const cityCache = new Map(); // simple in-memory cache: coordinatesString => cityName

const matchUser = async (req, res) => {
  try {
    let { bloodGroup, maxDistance } = req.body;
    
    if (!bloodGroup) {
      return res.status(400).json({ error: 'Blood group is required' });
    }
    
    maxDistance = parseInt(maxDistance) || 10000; // default 10 km

    // Get the logged-in user's data from JWT token
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract user's location from database
    const { coordinates } = currentUser.location;
    const [longitude, latitude] = coordinates;

    // Determine what role to search for based on current user's role
    // If user is a recipient, find donors
    // If user is a donor, find recipients
    const searchRole = (currentUser.role === 'recipient') ? 'donor' : 'recipient';

    const matches = await User.find({
      role: searchRole,
      bloodGroup,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: maxDistance,
        },
      },
    })
    .limit(10)
    .select('name bloodGroup location email phonenumber');

    // Enrich matches with city names using caching to reduce API calls
    const matchesWithCities = await Promise.all(matches.map(async (user) => {
      const coordsKey = user.location.coordinates.join(',');
      
      if (cityCache.has(coordsKey)) {
        return { ...user._doc, city: cityCache.get(coordsKey) };
      }
      
      try {
        const response = await axios.get('http:localhost:3000/geocode/reverse-geocode', {
          params: { lat: user.location.coordinates[1], lng: user.location.coordinates[0] },
        });
        const city = response.data.city || 'Unknown';
        cityCache.set(coordsKey, city);
        return { ...user._doc, city };
      } catch (error) {
        console.error('Reverse geocode error:', error.message);
        return { ...user._doc, city: 'Unknown' };
      }
    }));

    res.json({
      matches: matchesWithCities,
      searchedFor: searchRole,
      currentUserRole: currentUser.role,
      totalMatches: matchesWithCities.length
    });
    
  } catch (error) {
    console.error('Match error:', error.message);
    res.status(500).json({ error: 'Matching failed', details: error.message });
  }
};

const getAllMatchesPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "allMatches.html"));
};

module.exports = {
  autocomplete,
  forwardGeocode,
  reverseGeocode,
  matchUser,
  matchAllUsers,
  getAllMatchesPage,
};