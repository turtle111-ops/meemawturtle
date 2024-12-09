// API URLs
const API_URL_ALL_MATCHES = 'https://streamed.su/api/matches/all';
const API_URL_STREAM_SERVERS = {
    alpha: (id) => `https://streamed.su/api/stream/alpha/${id}`,
    bravo: (id) => `https://streamed.su/api/stream/bravo/${id}`,
    charlie: (id) => `https://streamed.su/api/stream/charlie/${id}`,
    delta: (id) => `https://streamed.su/api/stream/delta/${id}`,
    echo: (id) => `https://streamed.su/api/stream/echo/${id}`,
    foxtrot: (id) => `https://streamed.su/api/stream/foxtrot/${id}`
};

// Helper function to navigate to a page with query parameters
function navigateTo(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    window.location.href = `${url}?${queryString}`;
}

// Function to fetch data from the API
function fetchData(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            throw error;
        });
}

// Function to fetch and display all matches
function fetchMatches() {
    fetchData(API_URL_ALL_MATCHES)
        .then(data => {
            allMatches = data; // Store all matches for search
            displayMatches(allMatches); // Display all matches grouped by category
        });
}

// Function to display matches with links to the streaming page
function displayMatches(matches) {
    const matchesList = document.getElementById("matches-list");
    matchesList.innerHTML = ""; // Clear current matches

    // Group matches by category
    const categories = {};
    matches.forEach(match => {
        if (!categories[match.category]) {
            categories[match.category] = [];
        }
        categories[match.category].push(match);
    });

    // Create a section for each category and display matches
    Object.keys(categories).forEach(category => {
        // Create category header
        const categoryHeader = document.createElement("h2");
        categoryHeader.textContent = category;
        matchesList.appendChild(categoryHeader);

        // Create list for matches in this category
        const categoryList = document.createElement("ul");
        categories[category].forEach(match => {
            const li = document.createElement("li");
            li.textContent = match.title;

            // Display sources for the match
            const sourcesList = document.createElement("ul");
            match.sources.forEach(source => {
                const sourceLi = document.createElement("li");
                sourceLi.textContent = source.source;
                sourceLi.dataset.id = source.id;
                sourcesList.appendChild(sourceLi);
            });
            li.appendChild(sourcesList);

            li.onclick = () => {
                // Navigate to streams.html with match details as query parameters
                navigateTo('streams.html', { matchId: match.id, matchTitle: match.title });
            };
            categoryList.appendChild(li);
        });

        matchesList.appendChild(categoryList);
    });
}

// Function to search matches based on user input
function searchMatches() {
    const query = document.getElementById("search-bar").value.toLowerCase();
    const filteredMatches = allMatches.filter(match => match.title.toLowerCase().includes(query));
    displayMatches(filteredMatches); // Update displayed matches
}

// Function to fetch and display streams for a selected match
// Function to fetch and display streams for a selected match
function fetchStreams() {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get("matchId");
    const matchTitle = urlParams.get("matchTitle");

    if (!matchId || !matchTitle) {
        console.error("Invalid matchId or matchTitle");
        document.getElementById("server-selection").innerHTML = "<p>Error: Match ID or title is missing.</p>";
        return;
    }

    document.getElementById("match-title").textContent = `Match: ${matchTitle}`;

    const servers = Object.keys(API_URL_STREAM_SERVERS);
    const serverSelectionContainer = document.getElementById("server-selection");
    serverSelectionContainer.innerHTML = ''; // Clear existing content

    // Fetch stream data for each server and display only those with valid data
    servers.forEach(server => {
        fetchData(API_URL_STREAM_SERVERS[server](matchId))
            .then(data => {
                if (data && data.length > 0) {
                    // Create a section for each server if it has data
                    const serverSection = document.createElement("div");
                    serverSection.classList.add("server-section");

                    // Header for the server
                    const serverHeader = document.createElement("h3");
                    serverHeader.textContent = `Streams on ${server.toUpperCase()} Server`;
                    serverSection.appendChild(serverHeader);

                    // Display each stream as a button with a fallback title
                    data.forEach((stream, index) => {
                        const streamItem = document.createElement("div");
                        streamItem.classList.add("stream-item");

                        const streamButton = document.createElement("button");
                        // Use "Stream X" format, or fallback to "Stream" if title is undefined
                        streamButton.textContent = stream.source || `Stream ${index + 1}`;  // Use the source property for button text
                        streamButton.className = "stream-button";
                        streamButton.onclick = () => {
                            // Navigate to watch.html with matchId, server, and streamId as query parameters
                            window.location.href = `watch.html?matchId=${matchId}&server=${server}&streamId=${stream.id}`;
                        };

                        streamItem.appendChild(streamButton);
                        serverSection.appendChild(streamItem);
                    });

                    serverSelectionContainer.appendChild(serverSection);
                }
            })
            .catch(err => {
                console.error(`Error fetching stream for server ${server}:`, err);
            });
    });
}


// Function to fetch and display streams for a selected match
// Function to fetch and display streams for a selected match
function displayStream() {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get("matchId");
    const server = urlParams.get("server");

    if (!matchId || !server) {
        console.error("Invalid matchId or server");
        document.getElementById("stream-container").innerHTML = "<p>Error: Missing match ID or server.</p>";
        return;
    }

    const matchTitle = `Match ID: ${matchId}`; // Customize this as needed
    document.getElementById("match-title").textContent = matchTitle;

    // Fetch stream data for the selected server
    fetchData(API_URL_STREAM_SERVERS[server](matchId))
        .then(data => {
            if (data && data.length > 0) {
                // Display the stream using iframe
                const streamContainer = document.getElementById("stream-container");
                data.forEach(stream => {
                    const iframe = document.createElement("iframe");
                    iframe.src = stream.source;
                    iframe.width = "800"; // Adjust as needed
                    iframe.height = "450"; // Adjust as needed
                    iframe.frameBorder = "0";
                    iframe.setAttribute('allowFullScreen', '');

                    // Optionally, display the source label
                    const sourceLabel = document.createElement("p");
                    sourceLabel.textContent = `Source: ${stream.source}`;
                    streamContainer.appendChild(sourceLabel);
                    streamContainer.appendChild(iframe);
                });
            } else {
                document.getElementById("stream-container").innerHTML = "<p>No streams available for this server.</p>";
            }
        })
        .catch(err => {
            console.error(`Error fetching stream for server ${server}:`, err);
            document.getElementById("stream-container").innerHTML = "<p>Error loading stream. Please try again later.</p>";
        });
}


// Initialize the page based on the current page URL
window.onload = function () {
    const path = window.location.pathname;

    if (path.endsWith("index.html")) {
        fetchMatches();
    } else if (path.endsWith("matches.html")) {

        fetchMatches();

        // Attach the search function to the search bar
        const searchBar = document.getElementById("search-bar");
        searchBar.addEventListener("input", searchMatches);
    } else if (path.endsWith("streams.html")) {
        fetchStreams();
    } else if (path.endsWith("stream-view.html")) {
        displayStream();
    }
};
