// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function DashboardPage({ user, setUser }) {
    const [decks, setDecks] = useState([]);
    const [loadingDecks, setLoadingDecks] = useState(true);
    const [error, setError] = useState(null); // General fetch/action error
    const [newDeckName, setNewDeckName] = useState('');
    const [createError, setCreateError] = useState(null);

    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    // Fetch Decks function (no changes)
    const fetchDecks = useCallback(async () => {
        // ... (same fetchDecks function as before) ...
         setLoadingDecks(true);
        setError(null);
        try {
            if (!backendUrl) throw new Error("Backend URL environment variable is not set!");
            const response = await axios.get(`${backendUrl}/api/decks`);
            setDecks(response.data);
        } catch (err) {
            console.error("Error fetching decks:", err.response ? err.response.data : err);
            setError("Failed to load decks. Please try again later.");
            setDecks([]);
        } finally {
            setLoadingDecks(false);
        }
    }, [backendUrl]);

    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);

    // Logout Handler (no changes)
    const handleLogout = async () => {
        // ... (same logout function as before) ...
         try {
            if (!backendUrl) { console.error("Backend URL missing"); return; }
            await axios.post(`${backendUrl}/api/auth/logout`);
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error.response ? error.response.data : error);
        }
    };

    // Create Deck Handler (no changes)
    const handleCreateDeck = async (e) => {
       // ... (same create deck function as before) ...
        e.preventDefault();
        setCreateError(null);
        const trimmedName = newDeckName.trim();
        if (!trimmedName) {
            setCreateError("Deck name cannot be empty.");
            return;
        }
        try {
            if (!backendUrl) throw new Error("Backend URL missing");
            const response = await axios.post(`${backendUrl}/api/decks`, { name: trimmedName });
            setDecks([response.data, ...decks]); // Prepend new deck
            setNewDeckName('');
            setError(null);
        } catch (err) {
             console.error("Error creating deck:", err.response ? err.response.data : err);
             setCreateError(err.response?.data?.message || "Failed to create deck.");
        }
    };

    // --- >>>> NEW FUNCTION: Handler for DELETING a deck <<<< ---
    const handleDeleteDeck = async (deckId) => {
        // Confirmation dialog
        if (!window.confirm('Are you sure you want to delete this deck and ALL its cards? This cannot be undone.')) {
            return; // Abort if user cancels
        }

        setError(null); // Clear previous general errors
        try {
            if (!backendUrl) throw new Error("Backend URL missing");
            await axios.delete(`${backendUrl}/api/decks/${deckId}`);

            // Remove the deck from the state immediately
            setDecks(currentDecks => currentDecks.filter(deck => deck.id !== deckId));

        } catch (err) {
            console.error("Error deleting deck:", err.response ? err.response.data : err);
            setError(err.response?.data?.message || "Failed to delete deck.");
        }
    };
    // --- >>>> END NEW DELETE FUNCTION <<<< ---


    // --- >>>> NEW FUNCTION: Handler for RENAMING a deck <<<< ---
    const handleRenameDeck = async (deckId, currentName) => {
        const newName = window.prompt('Enter the new name for the deck:', currentName);

        // Validate the new name
        if (newName === null) {
            return; // User cancelled prompt
        }
        const trimmedNewName = newName.trim();
        if (!trimmedNewName) {
            alert("Deck name cannot be empty."); // Use alert for prompt validation feedback
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
                deck.id === deckId ? response.data : deck // Replace the old deck data with the updated one
            ));

        } catch (err) {
             console.error("Error renaming deck:", err.response ? err.response.data : err);
             setError(err.response?.data?.message || "Failed to rename deck.");
        }
    };
    // --- >>>> END NEW RENAME FUNCTION <<<< ---


    return (
        <div>
            <h1>Dashboard</h1>
            {user && <p>Welcome, {user.display_name || user.email}!</p>}
            <button onClick={handleLogout}>Logout</button>

            <hr />

             <h2>Create New Deck</h2>
             <form onSubmit={handleCreateDeck}>
                 <input
                     type="text"
                     value={newDeckName}
                     onChange={(e) => setNewDeckName(e.target.value)}
                     placeholder="Enter deck name"
                     maxLength={100}
                     required
                 />
                 <button type="submit">Create Deck</button>
                 {createError && <p style={{ color: 'red' }}>{createError}</p>}
             </form>

            <hr />

            <h2>Your Decks</h2>
            {loadingDecks && <p>Loading decks...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display general errors here */}
            {!loadingDecks && !error && (
                <div>
                    {decks.length === 0 ? (
                        <p>You haven't created any decks yet.</p>
                    ) : (
                        <ul>
                            {decks.map((deck) => (
                                <li key={deck.id}>
                                    {deck.name}
                                    {/* --- >>>> UPDATED BUTTONS <<<< --- */}
                                    <button
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => handleRenameDeck(deck.id, deck.name)} // Call rename handler
                                    >
                                        Rename
                                    </button>
                                    <button
                                        style={{ marginLeft: '5px' }}
                                        onClick={() => handleDeleteDeck(deck.id)} // Call delete handler
                                    >
                                        Delete
                                    </button>
                                    {/* --- >>>> END UPDATED BUTTONS <<<< --- */}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default DashboardPage;