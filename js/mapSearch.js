import * as L from 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

let map = null;
let searchMarker = null;
let currentLocation = null;
let locationInfoContainer = null;
let isMapTabActive = false; // Flag to track if the map tab is active

export function initMap() {
    // Get the map container
    const mapContainer = document.getElementById('map-container');
    
    // Only create map if it doesn't exist
    if (!mapContainer.querySelector('#map')) {
        const mapElement = document.createElement('div');
        mapElement.id = 'map';
        mapContainer.appendChild(mapElement);

        // Initialize map with dark theme
        map = window.L.map('map').setView([0, 0], 3);
        
        // Add dark theme tile layer
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(map);

        // Add search marker
        searchMarker = window.L.marker([0, 0]).addTo(map);
        searchMarker.setOpacity(0);
        
        // Add click event to map to update location info
        map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Reverse geocode to get location info
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(response => response.json())
                .then(data => {
                    if (data) {
                        // Update marker position
                        searchMarker.setLatLng([lat, lng]);
                        searchMarker.setOpacity(1);
                        
                        // Store current location
                        currentLocation = data;
                        
                        // Update location info
                        debounceUpdateLocationInfo();
                    }
                })
                .catch(error => {
                    console.error('Error reverse geocoding:', error);
                });
        });
    }
    
    // Create location info container if it doesn't exist
    if (!locationInfoContainer) {
        locationInfoContainer = document.createElement('div');
        locationInfoContainer.classList.add('location-info');
        document.body.appendChild(locationInfoContainer);
    }
}

// Debounce function to limit how often updateLocationInfo is called
let debounceTimeout;
function debounceUpdateLocationInfo() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(updateLocationInfo, 300); // Adjust delay as needed
}

export function searchMap(query) {
    if (!map) return;

    // Use Nominatim for geocoding
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    
    fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const location = data[0];
                const lat = parseFloat(location.lat);
                const lon = parseFloat(location.lon);
                
                // Update marker position and make it visible
                searchMarker.setLatLng([lat, lon]);
                searchMarker.setOpacity(1);
                
                // Center map on location
                const zoomLevel = getAppropriateZoom(location);
                map.setView([lat, lon], zoomLevel);
                
                // Store the original search result
                currentLocation = {
                    ...location,
                    originalSearch: true,
                    searchQuery: query
                };

                // Remove the popup from the marker
                searchMarker.unbindPopup();

                // Update location info immediately with the search result
                updateLocationInfo();
            }
        })
        .catch(error => {
            console.error('Error searching location:', error);
        });
}

// Helper function to determine appropriate zoom level
function getAppropriateZoom(location) {
    const type = location.type || '';
    const address = location.address || {};
    const placeClass = location.class || ''; // Get the 'class' field

    // Check for large administrative boundaries first
    if (type === 'country' || (address.country && !address.state && !address.city && !address.town && !address.county)) {
        return 4; // Zoom out more for countries
    } else if (type === 'state' || (address.state && !address.city && !address.town && !address.county)) {
        return 6; // Zoom out a bit more for states
    }

    // Check for bodies of water using type and class
    if (type === 'ocean' || placeClass === 'water' && type === '') { // Broad ocean check
        return 3;
    } else if (type === 'sea' || type === 'gulf' || type === 'bay') {
        return 5;
    } else if (type === 'lake' || (placeClass === 'water' && type === 'lake')) {
        // Use bounding box for lakes if available, otherwise a default
        if (location.boundingbox) {
            const [latMin, latMax, lonMin, lonMax] = location.boundingbox.map(parseFloat);
            const latDiff = Math.abs(latMax - latMin);
            const lonDiff = Math.abs(lonMax - lonMin);
            if (latDiff > 1 || lonDiff > 1) return 8; // Large lake
            if (latDiff > 0.1 || lonDiff > 0.1) return 10; // Medium lake
            return 12; // Small lake
        }
        return 9; // Default for lakes without bounding box
    } else if (placeClass === 'water') { // General water like rivers, straits
        return 10;
    }

    // Continue with land-based types
    if (type === 'county' || address.county) {
        return 9;
    } else if (type === 'city' || type === 'town' || address.city || address.town) {
        return 12;
    }

    // Fallback using bounding box for other types
    if (location.boundingbox) {
        const [latMin, latMax, lonMin, lonMax] = location.boundingbox.map(parseFloat);
        const latDiff = Math.abs(latMax - latMin);
        const lonDiff = Math.abs(lonMax - lonMin);
        
        // Simple heuristic: bigger area needs lower zoom
        if (latDiff > 10 || lonDiff > 10) return 5; // Large regions
        if (latDiff > 2 || lonDiff > 2) return 7; // Smaller regions / large counties
        if (latDiff > 0.5 || lonDiff > 0.5) return 9; // Counties / large cities
    }
    
    return 13; // Default zoom level
}

// Helper function to format display name based on location type
function formatDisplayName(location) {
    const type = location.type || '';
    const address = location.address || {};
    
    console.log('Address Data:', address); // Debugging line
    
    if (type === 'state' || (address.state && !address.city && !address.country)) {
        return location.display_name;
    } else if (type === 'county' || address.county) {
        return location.display_name;
    } else if (type === 'city' || type === 'town' || address.city || address.town) {
        return location.display_name;
    }
    
    // Default to full display name
    return location.display_name;
}

function isWellKnownPlace(location) {
    // Check if this is a well-known place like a country, city, etc.
    const address = location.address || {};
    const type = location.type || '';
    
    // Check for common place types
    const wellKnownTypes = [
        'country', 'state', 'province', 'region', 'city', 'town', 'village',
        'continent', 'ocean', 'sea', 'lake', 'river', 'mountain', 'island'
    ];
    
    // Check if the type is in our list of well-known types
    if (wellKnownTypes.includes(type)) {
        return true;
    }
    
    // Check if it has a country or city in the address
    if (address.country || address.city || address.town || address.state) {
        return true;
    }
    
    // Check if it's a major feature
    if (location.class === 'boundary' || location.class === 'place') {
        return true;
    }
    
    return false;
}

function fetchWikipediaSummary(location) {
    // Get the most specific name from the popup text or display name
    let searchName = '';
    
    if (searchMarker && searchMarker.getPopup()) {
        // Use the popup text which is typically more accurate
        searchName = searchMarker.getPopup().getContent();
    } else {
        searchName = location.display_name;
    }
    
    // Clean up the name - remove any coordinates or extra details in parentheses
    searchName = searchName
        .split(',')[0]  // Take first part before comma
        .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
        .trim();
    
    // For administrative boundaries or places, try to construct a more specific search
    if (location.address) {
        const addr = location.address;
        if (addr.state && addr.country === 'United States') {
            searchName = `${addr.state}, U.S. state`;
        } else if (addr.county && addr.state) {
            searchName = `${addr.county}, ${addr.state}`;
        } else if (addr.city && addr.state) {
            searchName = `${addr.city}, ${addr.state}`;
        }
    }
    
    // Fetch Wikipedia summary
    return fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchName)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Wikipedia summary not found');
            }
            return response.json();
        })
        .then(data => {
            return {
                title: data.title,
                extract: data.extract,
                thumbnail: data.thumbnail ? data.thumbnail.source : null,
                url: data.content_urls?.desktop?.page || null
            };
        })
        .catch(error => {
            console.error('Error fetching Wikipedia summary:', error);
            // If the first attempt fails and we have address data, try with a different format
            if (location.address && !searchName.includes('U.S. state')) {
                const addr = location.address;
                let fallbackName = '';
                
                if (addr.state && addr.country === 'United States') {
                    fallbackName = addr.state;
                } else if (addr.county && addr.state) {
                    fallbackName = `${addr.county} County, ${addr.state}`;
                }
                
                if (fallbackName && fallbackName !== searchName) {
                    return fetchWikipediaSummary({ ...location, display_name: fallbackName });
                }
            }
            return null;
        });
}

// Update the updateLocationInfo function to check if the map tab is active
function updateLocationInfo() {
    if (!locationInfoContainer || !isMapTabActive) return; // Only update if map tab is active

    if (currentLocation) {
        // Check if this is a well-known place
        const isWellKnown = isWellKnownPlace(currentLocation);
        
        if (isWellKnown) {
            // For well-known places, fetch Wikipedia summary
            fetchWikipediaSummary(currentLocation).then(wikiData => {
                // Ensure currentLocation is still valid before accessing its properties
                if (!currentLocation) return; // Exit if currentLocation is null

                // Get the appropriate display name
                const displayName = currentLocation.originalSearch ? 
                    formatDisplayName(currentLocation) : 
                    currentLocation.display_name.split(',')[0];
                
                locationInfoContainer.innerHTML = `
                    <h3>${displayName}</h3>
                    ${wikiData && wikiData.thumbnail ? `
                        <div class="location-image">
                            <img src="${wikiData.thumbnail}" alt="${wikiData.title || displayName}">
                        </div>
                    ` : ''}
                    <div class="attribution">
                        <p>Data from <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and <a href="https://www.wikipedia.org/" target="_blank">Wikipedia</a></p>
                    </div>
                `;
                
                // Show the location info container
                locationInfoContainer.style.display = 'block';
            }).catch(error => {
                console.error('Error fetching Wikipedia summary:', error);
            });
        } else {
            // Format coordinates
            const lat = parseFloat(currentLocation.lat).toFixed(6);
            const lon = parseFloat(currentLocation.lon).toFixed(6);
            
            // Get address components
            const address = currentLocation.address || {};
            
            locationInfoContainer.innerHTML = `
                <h3>${currentLocation.display_name}</h3>
                <div class="location-details">
                    <p><strong>Coordinates:</strong> ${lat}, ${lon}</p>
                    <p><strong>Type:</strong> ${currentLocation.type || 'Unknown'}</p>
                    ${currentLocation.class ? `<p><strong>Class:</strong> ${currentLocation.class}</p>` : ''}
                    ${currentLocation.osm_type ? `<p><strong>OSM Type:</strong> ${currentLocation.osm_type}</p>` : ''}
                    ${currentLocation.osm_id ? `<p><strong>OSM ID:</strong> ${currentLocation.osm_id}</p>` : ''}
                </div>
                ${Object.keys(address).length > 0 ? `
                    <div class="address-details">
                        <h4>Address Details</h4>
                        ${Object.entries(address)
                            .filter(([key]) => !['country', 'country_code'].includes(key))
                            .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                            .join('')}
                    </div>
                ` : ''}
                <div class="attribution">
                    <p>Data from <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a></p>
                </div>
            `;
            
            // Show the location info container
            locationInfoContainer.style.display = 'block';
        }
    } else {
        // Hide the location info container if no location is selected
        locationInfoContainer.style.display = 'none';
    }
}

export function renderMapResults(query, container) {
    // Initialize map if not already done
    if (!map) {
        initMap();
    }
    
    // If there's a query, perform the search
    if (query) {
        searchMap(query);
    } else {
        // Hide location info if no search has been performed
        if (locationInfoContainer) {
            locationInfoContainer.style.display = 'none'; // Ensure it's hidden
        }
    }
}

export function showMap() {
    const mapContainer = document.getElementById('map-container');
    mapContainer.classList.add('active');
    isMapTabActive = true; // Set flag to true when map tab is shown
}

export function hideMap() {
    const mapContainer = document.getElementById('map-container');
    mapContainer.classList.remove('active');
    isMapTabActive = false; // Set flag to false when map tab is hidden
    
    // Hide location info when map is hidden
    if (locationInfoContainer) {
        locationInfoContainer.style.display = 'none'; // Ensure it's hidden
    }
    
    // Clear current location to prevent stale data
    currentLocation = null;
}

// New function to destroy location info
export function destroyLocationInfo() {
    if (locationInfoContainer) {
        locationInfoContainer.remove(); // Remove from DOM
        locationInfoContainer = null; // Reset reference
    }
}
