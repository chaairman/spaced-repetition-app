// frontend/src/App.js (Example using React Router with added console logs)
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios'; // Make sure axios is installed

// Import your page components (create basic placeholders if they don't exist)
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage'; // Create this page
import DeckViewPage from './pages/DeckViewPage'; // <-- Add this line
import StudyPage from './pages/StudyPage';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Start loading

    // --- Log 1: Log state on component render ---

    useEffect(() => {
        // --- Log 2: Log when the effect runs ---

        const checkAuth = async () => {
            // --- Log 3: Log when checkAuth function is called ---
            // Ensure loading is true at the start of the check
            // Note: Calling setIsLoading here might trigger extra renders, but let's keep it for now.
            // If already true, this won't cause an issue. Consider removing if isLoading is always true initially.
            // setIsLoading(true); // Re-evaluating if this is needed here

            try {
                // Use the environment variable for the backend URL
                // Make sure REACT_APP_BACKEND_URL is defined in frontend/.env if using CRA
                // Or VITE_BACKEND_URL if using Vite
                const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL;
                if (!backendUrl) {
                    console.error("Backend URL environment variable is not set!");
                }
                const response = await axios.get(`${backendUrl}/api/auth/me`);
                // --- Log 4: Log successful response data ---
                setUser(response.data); // Set user state
                // --- Log 5: Log after calling setUser with data ---
            } catch (error) {
                // --- Log 6: Log any error during the API call ---
                // Log the specific error message or response data if available
                console.error("checkAuth ERROR:", error.response ? error.response.data : error.message);
                setUser(null); // Set user to null on error
                 // --- Log 7: Log after calling setUser with null due to error ---
            } finally {
                setIsLoading(false); // Set loading to false once done
                // --- Log 8: Log when the finally block executes ---
            }
        };

        checkAuth();
    // IMPORTANT: Dependency array MUST be empty [] to run only ONCE on initial mount.
    }, []);

    // --- Log 9: Log state right before rendering the loading indicator or Router ---

    if (isLoading) {
        // Render loading indicator while checking auth
        return <div>Loading application...</div>;
    }

    // --- Log 10: Log state right before returning the main Router JSX ---

    return (
        <Router>
            <Routes>
                {/* Login Route: Show LoginPage if no user, otherwise redirect to dashboard */}
                <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />

                {/* Dashboard Route (Protected): Show DashboardPage if user exists, otherwise redirect to login */}
                <Route path="/dashboard" element={user ? <DashboardPage user={user} setUser={setUser} /> : <Navigate to="/login" replace />} />

                 {/* Add other routes here */}
                 {/* Example Deck Route (Protected) */}
                 {/* <Route path="/decks/:deckId" element={user ? <DeckViewPage /> : <Navigate to="/login" replace />} /> */}
                {/* Deck View Route (Protected) <-- Add this route */}
                <Route path="/decks/:deckId" element={user ? <DeckViewPage /> : <Navigate to="/login" replace />} />
                {/* Study Route (Protected) <-- Add this route */}
                <Route path="/study/:deckId" element={user ? <StudyPage /> : <Navigate to="/login" replace />} />
                {/* Default route: Navigate to dashboard if user exists, otherwise to login */}
                <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            </Routes>
        </Router>
    );
}

export default App;
