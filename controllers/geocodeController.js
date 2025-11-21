const User = require('../models/user')
const axios = require('axios');

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
}

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
}

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
}

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
    .select('name bloodGroup location email');

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

const matchAllUsers = async(req,res)=>{
    res.json({"user":"all Users"})
}

const getAllMatchesPage = async(req,res)=>{
    res.sendFile(path.join(__dirname, "../", "public", "views", "profile.html"));
}

module.exports = {autocomplete,forwardGeocode,reverseGeocode,matchUser,matchAllUsers,getAllMatchesPage};