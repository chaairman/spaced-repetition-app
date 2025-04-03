// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Button component (Helper for consistent styling)
const Button = ({ onClick, children, className = '', variant = 'default', type = 'button', disabled = false }) => {
    let baseStyle = "px-3 py-1.5 rounded font-semibold shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs"; // Made buttons smaller base
    let variantStyle = '';
    switch (variant) {
        case 'primary': variantStyle = 'bg-accent-primary hover:bg-accent-secondary text-brand-darkest focus:ring-accent-primary'; break; // Orange
        case 'danger': variantStyle = 'bg-danger-dark hover:bg-danger-darker text-white focus:ring-danger-dark'; break;        // Red
        case 'success': variantStyle = 'bg-brand-primary hover:bg-brand-dark text-white focus:ring-brand-primary'; break;    // Teal
        case 'secondary': variantStyle = 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400'; break;    // Gray
        case 'ghost': variantStyle = 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400'; break;
        default: variantStyle = 'bg-brand-dark hover:bg-opacity-80 text-white focus:ring-brand-dark'; break; // Dark Cyan default
    }
    return (
        <button type={type} onClick={onClick} className={`${baseStyle} ${variantStyle} ${className}`} disabled={disabled}>
            {children}
        </button>
    );
};


function DashboardPage({ user, setUser }) {
    const [decks, setDecks] = useState([]);
    const [loadingDecks, setLoadingDecks] = useState(true);
    const [error, setError] = useState(null); // General fetch/action error
    const [newDeckName, setNewDeckName] = useState('');
    const [createError, setCreateError] = useState(null); // Specific create error
    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL;

    // Function to fetch decks
    const fetchDecks = useCallback(async () => {
        setLoadingDecks(true);
        setError(null);
        try {
            if (!backendUrl) throw new Error("Backend URL environment variable is not set!");
            const response = await axios.get(`${backendUrl}/api/decks`);
            // Assuming the backend returns the decks with discord_review_enabled
            setDecks(response.data);
        } catch (err) {
            console.error("Error fetching decks:", err.response ? err.response.data : err);
            setError("Failed to load decks. Please try again later.");
            setDecks([]);
        } finally {
            setLoadingDecks(false);
        }
    }, [backendUrl]);

    // Fetch decks on component mount
    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);

    // Logout Handler
    const handleLogout = async () => {
        try {
            if (!backendUrl) { console.error("Backend URL missing"); return; }
            await axios.post(`${backendUrl}/api/auth/logout`);
            setUser(null); // Update App state
            // No need to navigate here, App.js handles redirect based on user state
        } catch (error) {
            console.error("Logout failed:", error.response ? error.response.data : error);
            setError("Logout failed. Please try again."); // Set general error
        }
    };

    // Create Deck Handler
    const handleCreateDeck = async (e) => {
        e.preventDefault();
        setCreateError(null); // Clear previous create error
        setError(null);      // Clear general error
        const trimmedName = newDeckName.trim();
        if (!trimmedName) {
            setCreateError("Deck name cannot be empty.");
            return;
        }
        try {
            if (!backendUrl) throw new Error("Backend URL missing");
            const response = await axios.post(`${backendUrl}/api/decks`, { name: trimmedName });
            // Prepend new deck to the list for immediate UI update
            setDecks(currentDecks => [response.data, ...currentDecks]);
            setNewDeckName(''); // Clear input field
        } catch (err) {
            console.error("Error creating deck:", err.response ? err.response.data : err);
            // Set specific error for the create form
            setCreateError(err.response?.data?.message || "Failed to create deck.");
        }
    };

    // Delete Deck Handler
    const handleDeleteDeck = async (deckId) => {
        if (!window.confirm('Are you sure you want to delete this deck and ALL its cards? This cannot be undone.')) {
            return;
        }
        setError(null); // Clear previous general errors
        try {
            if (!backendUrl) throw new Error("Backend URL missing");
            await axios.delete(`${backendUrl}/api/decks/${deckId}`);
            // Remove the deck from the state immediately
            setDecks(currentDecks => currentDecks.filter(deck => deck.id !== deckId));
        } catch (err) {
            console.error("Error deleting deck:", err.response ? err.response.data : err);
            setError(err.response?.data?.message || "Failed to delete deck."); // Set general error
        }
    };

    // Rename Deck Handler
    const handleRenameDeck = async (deckId, currentName) => {
        const newName = window.prompt('Enter the new name for the deck:', currentName);
        if (newName === null) {
            return; // User cancelled
        }
        const trimmedNewName = newName.trim();
        if (!trimmedNewName) {
            alert("Deck name cannot be empty."); // Use alert for prompt validation
            return;
        }
        if (trimmedNewName === currentName) {
            return; // Name didn't change
        }
        setError(null); // Clear previous general errors
        try {
            if (!backendUrl) throw new Error("Backend URL missing");
            // Make PUT request to update the deck name
            const response = await axios.put(`${backendUrl}/api/decks/${deckId}`, {
                name: trimmedNewName
            });
            // Update the deck in the state with the new data from response
            setDecks(currentDecks => currentDecks.map(deck =>
                deck.id === deckId ? response.data : deck // Replace with updated deck object
            ));
        } catch (err) {
            console.error("Error renaming deck:", err.response ? err.response.data : err);
            setError(err.response?.data?.message || "Failed to rename deck."); // Set general error
        }
    };

    // Toggle Discord Review Handler
    const handleToggleDiscordReview = async (deckId, currentStatus) => {
        const newStatus = !currentStatus; // Calculate the opposite status
        setError(null); // Clear previous general errors

        try {
            if (!backendUrl) throw new Error("Backend URL missing");

            // Make PUT request to update the discord_review_enabled flag
            // ** Ensure the key is snake_case **
            const response = await axios.put(`${backendUrl}/api/decks/${deckId}`, {
                discord_review_enabled: newStatus // Corrected key
            });

            // Update the specific deck in the state with the full response data
            setDecks(currentDecks => currentDecks.map(deck =>
                deck.id === deckId ? response.data : deck // Replace with updated deck object
            ));

        } catch (err) {
            console.error(`Error toggling Discord review for deck ${deckId}:`, err.response ? err.response.data : err);
            setError(err.response?.data?.message || "Failed to update Discord review status."); // Set general error
        }
    };


    return (
        <div className="container mx-auto p-4 md:p-6">
            {/* Header section */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
                <h1 className="text-3xl font-bold text-brand-darkest">Dashboard</h1>
                <div className="flex items-center space-x-4">
                    {user && <span className="text-gray-600">Welcome, {user.display_name || user.email}!</span>}
                    <Link to="/settings">
                        <Button variant="secondary">Settings</Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout}>Logout</Button>
                </div>
            </div>

            {/* Display general errors */}
            {error && <div className="mb-4 p-3 rounded text-sm bg-red-100 text-danger-dark">{error}</div>}

            {/* Create Deck Section */}
            <div className="mb-8 p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-3 text-brand-dark">Create New Deck</h2>
                <form onSubmit={handleCreateDeck} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                        placeholder="Enter deck name"
                        maxLength={100}
                        required
                        className="flex-grow p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <Button type="submit" variant="primary">Create Deck</Button>
                </form>
                {createError && <p className="mt-2 text-danger-dark text-sm">{createError}</p>}
            </div>

            {/* Your Decks Section */}
            <div>
                <h2 className="text-xl font-semibold mb-3 text-brand-dark">Your Decks</h2>
                {loadingDecks && <p className="text-gray-500">Loading decks...</p>}
                {/* Note: General 'error' state handles deck loading errors now */}

                {!loadingDecks && !error && ( // Only render list if no loading and no general error
                    <div>
                        {decks.length === 0 ? (
                            <p className="text-gray-500">You haven't created any decks yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {decks.map((deck) => (
                                    <div key={deck.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                                        {/* Top Section: Name and Status */}
                                        <div>
                                            <Link to={`/decks/${deck.id}`} className="block mb-1">
                                                <h3 className="text-lg font-semibold text-brand-primary hover:text-brand-dark truncate" title={deck.name}>
                                                    {deck.name}
                                                </h3>
                                            </Link>
                                            <p className={`text-xs mb-3 ${deck.discord_review_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                                                Discord Reviews: {deck.discord_review_enabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>

                                        {/* Bottom Section: Action Buttons */}
                                        <div className="flex justify-end flex-wrap gap-2 mt-auto pt-2 border-t border-gray-200">
                                            <Button
                                                variant={deck.discord_review_enabled ? 'secondary' : 'success'}
                                                onClick={() => handleToggleDiscordReview(deck.id, deck.discord_review_enabled)}
                                                className={deck.discord_review_enabled ? '' : 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-500'} // Style override for "Enable"
                                            >
                                                {deck.discord_review_enabled ? 'Disable Discord' : 'Enable Discord'}
                                            </Button>
                                            <Button variant="secondary" onClick={() => handleRenameDeck(deck.id, deck.name)}>Rename</Button>
                                            <Button variant="danger" onClick={() => handleDeleteDeck(deck.id)}>Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;