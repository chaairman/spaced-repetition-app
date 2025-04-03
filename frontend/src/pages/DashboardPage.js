// // frontend/src/pages/DashboardPage.js
// import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios';
// import { Link } from 'react-router-dom'; // <-- Add this line


// function DashboardPage({ user, setUser }) {
//     const [decks, setDecks] = useState([]);
//     const [loadingDecks, setLoadingDecks] = useState(true);
//     const [error, setError] = useState(null); // General fetch/action error
//     const [newDeckName, setNewDeckName] = useState('');
//     const [createError, setCreateError] = useState(null);

//     const backendUrl = process.env.REACT_APP_BACKEND_URL;

//     // Fetch Decks function (no changes)
//     const fetchDecks = useCallback(async () => {
//         // ... (same fetchDecks function as before) ...
//          setLoadingDecks(true);
//         setError(null);
//         try {
//             if (!backendUrl) throw new Error("Backend URL environment variable is not set!");
//             const response = await axios.get(`${backendUrl}/api/decks`);
//             setDecks(response.data);
//         } catch (err) {
//             console.error("Error fetching decks:", err.response ? err.response.data : err);
//             setError("Failed to load decks. Please try again later.");
//             setDecks([]);
//         } finally {
//             setLoadingDecks(false);
//         }
//     }, [backendUrl]);

//     useEffect(() => {
//         fetchDecks();
//     }, [fetchDecks]);

//     // Logout Handler (no changes)
//     const handleLogout = async () => {
//         // ... (same logout function as before) ...
//          try {
//             if (!backendUrl) { console.error("Backend URL missing"); return; }
//             await axios.post(`${backendUrl}/api/auth/logout`);
//             setUser(null);
//         } catch (error) {
//             console.error("Logout failed:", error.response ? error.response.data : error);
//         }
//     };

//     // Create Deck Handler (no changes)
//     const handleCreateDeck = async (e) => {
//        // ... (same create deck function as before) ...
//         e.preventDefault();
//         setCreateError(null);
//         const trimmedName = newDeckName.trim();
//         if (!trimmedName) {
//             setCreateError("Deck name cannot be empty.");
//             return;
//         }
//         try {
//             if (!backendUrl) throw new Error("Backend URL missing");
//             const response = await axios.post(`${backendUrl}/api/decks`, { name: trimmedName });
//             setDecks([response.data, ...decks]); // Prepend new deck
//             setNewDeckName('');
//             setError(null);
//         } catch (err) {
//              console.error("Error creating deck:", err.response ? err.response.data : err);
//              setCreateError(err.response?.data?.message || "Failed to create deck.");
//         }
//     };

//     // --- >>>> NEW FUNCTION: Handler for DELETING a deck <<<< ---
//     const handleDeleteDeck = async (deckId) => {
//         // Confirmation dialog
//         if (!window.confirm('Are you sure you want to delete this deck and ALL its cards? This cannot be undone.')) {
//             return; // Abort if user cancels
//         }

//         setError(null); // Clear previous general errors
//         try {
//             if (!backendUrl) throw new Error("Backend URL missing");
//             await axios.delete(`${backendUrl}/api/decks/${deckId}`);

//             // Remove the deck from the state immediately
//             setDecks(currentDecks => currentDecks.filter(deck => deck.id !== deckId));

//         } catch (err) {
//             console.error("Error deleting deck:", err.response ? err.response.data : err);
//             setError(err.response?.data?.message || "Failed to delete deck.");
//         }
//     };
//     // --- >>>> END NEW DELETE FUNCTION <<<< ---


//     // --- >>>> NEW FUNCTION: Handler for RENAMING a deck <<<< ---
//     const handleRenameDeck = async (deckId, currentName) => {
//         const newName = window.prompt('Enter the new name for the deck:', currentName);

//         // Validate the new name
//         if (newName === null) {
//             return; // User cancelled prompt
//         }
//         const trimmedNewName = newName.trim();
//         if (!trimmedNewName) {
//             alert("Deck name cannot be empty."); // Use alert for prompt validation feedback
//             return;
//         }
//         if (trimmedNewName === currentName) {
//             return; // Name didn't change
//         }

//         setError(null); // Clear previous general errors
//         try {
//             if (!backendUrl) throw new Error("Backend URL missing");
//             // Make PUT request to update the deck name
//             const response = await axios.put(`${backendUrl}/api/decks/${deckId}`, {
//                 name: trimmedNewName
//             });

//             // Update the deck in the state with the new data from response
//             setDecks(currentDecks => currentDecks.map(deck =>
//                 deck.id === deckId ? response.data : deck // Replace the old deck data with the updated one
//             ));

//         } catch (err) {
//              console.error("Error renaming deck:", err.response ? err.response.data : err);
//              setError(err.response?.data?.message || "Failed to rename deck.");
//         }
//     };
//     // --- >>>> END NEW RENAME FUNCTION <<<< ---


//     return (
//         <div>
//             <h1>Dashboard</h1>
//             {user && <p>Welcome, {user.display_name || user.email}!</p>}
//             <Link to="/settings" style={{ marginRight: '10px' }}>
//                 <button>Settings</button>
//             </Link>
//             <button onClick={handleLogout}>Logout</button>

//             <hr />

//              <h2>Create New Deck</h2>
//              <form onSubmit={handleCreateDeck}>
//                  <input
//                      type="text"
//                      value={newDeckName}
//                      onChange={(e) => setNewDeckName(e.target.value)}
//                      placeholder="Enter deck name"
//                      maxLength={100}
//                      required
//                  />
//                  <button type="submit">Create Deck</button>
//                  {createError && <p style={{ color: 'red' }}>{createError}</p>}
//              </form>

//             <hr />

//             <h2>Your Decks</h2>
//             {loadingDecks && <p>Loading decks...</p>}
//             {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display general errors here */}
//             {!loadingDecks && !error && (
//                 <div>
//                     {decks.length === 0 ? (
//                         <p>You haven't created any decks yet.</p>
//                     ) : (
//                         <ul>
//                             {decks.map((deck) => (
//                                 <li key={deck.id}>
//                                     {/* Wrap the name in a Link */}
//                                     <Link to={`/decks/${deck.id}`}>
//                                         {deck.name}
//                                     </Link>
//                                     {/* --- >>>> UPDATED BUTTONS <<<< --- */}
//                                     <button
//                                         style={{ marginLeft: '10px' }}
//                                         onClick={() => handleRenameDeck(deck.id, deck.name)} // Call rename handler
//                                     >
//                                         Rename
//                                     </button>
//                                     <button
//                                         style={{ marginLeft: '5px' }}
//                                         onClick={() => handleDeleteDeck(deck.id)} // Call delete handler
//                                     >
//                                         Delete
//                                     </button>
//                                     {/* --- >>>> END UPDATED BUTTONS <<<< --- */}
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// }

// export default DashboardPage;

// frontend/src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Basic Button Style Component (Optional Helper)
// You can place this here or in a separate components/ui folder
const Button = ({ onClick, children, className = '', variant = 'default', type = 'button', disabled = false }) => {
    let baseStyle = "px-4 py-2 rounded font-semibold shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    let variantStyle = '';

    switch (variant) {
        case 'primary': // e.g., Create Deck
            variantStyle = 'bg-accent-primary hover:bg-accent-secondary text-brand-darkest focus:ring-accent-primary';
            break;
        case 'danger': // e.g., Delete
            variantStyle = 'bg-danger-dark hover:bg-danger-darker text-white focus:ring-danger-dark';
            break;
        case 'secondary': // e.g., Rename, Settings
            variantStyle = 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400';
            break;
        case 'ghost': // e.g., Logout (less prominent)
             variantStyle = 'bg-transparent hover:bg-gray-200 text-gray-700 focus:ring-gray-400';
             break;
        default: // Default button style
            variantStyle = 'bg-brand-primary hover:bg-brand-dark text-white focus:ring-brand-primary'; // Using brand teal
            break;
    }

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${variantStyle} ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
};


function DashboardPage({ user, setUser }) {
    const [decks, setDecks] = useState([]);
    const [loadingDecks, setLoadingDecks] = useState(true);
    const [error, setError] = useState(null);
    const [newDeckName, setNewDeckName] = useState('');
    const [createError, setCreateError] = useState(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL;

    // --- Functions (fetchDecks, handleLogout, handleCreateDeck, handleDeleteDeck, handleRenameDeck) remain unchanged ---
    const fetchDecks = useCallback(async () => { /* ... keep existing code ... */ setLoadingDecks(true); setError(null); try { if (!backendUrl) throw new Error("Backend URL environment variable is not set!"); const response = await axios.get(`${backendUrl}/api/decks`); setDecks(response.data); } catch (err) { console.error("Error fetching decks:", err.response ? err.response.data : err); setError("Failed to load decks. Please try again later."); setDecks([]); } finally { setLoadingDecks(false); } }, [backendUrl]);
    useEffect(() => { fetchDecks(); }, [fetchDecks]);
    const handleLogout = async () => { /* ... keep existing code ... */ try { if (!backendUrl) { console.error("Backend URL missing"); return; } await axios.post(`${backendUrl}/api/auth/logout`); setUser(null); } catch (error) { console.error("Logout failed:", error.response ? error.response.data : error); } };
    const handleCreateDeck = async (e) => { /* ... keep existing code ... */ e.preventDefault(); setCreateError(null); const trimmedName = newDeckName.trim(); if (!trimmedName) { setCreateError("Deck name cannot be empty."); return; } try { if (!backendUrl) throw new Error("Backend URL missing"); const response = await axios.post(`${backendUrl}/api/decks`, { name: trimmedName }); setDecks([response.data, ...decks]); setNewDeckName(''); setError(null); } catch (err) { console.error("Error creating deck:", err.response ? err.response.data : err); setCreateError(err.response?.data?.message || "Failed to create deck."); } };
    const handleDeleteDeck = async (deckId) => { /* ... keep existing code ... */ if (!window.confirm('Are you sure you want to delete this deck and ALL its cards? This cannot be undone.')) { return; } setError(null); try { if (!backendUrl) throw new Error("Backend URL missing"); await axios.delete(`${backendUrl}/api/decks/${deckId}`); setDecks(currentDecks => currentDecks.filter(deck => deck.id !== deckId)); } catch (err) { console.error("Error deleting deck:", err.response ? err.response.data : err); setError(err.response?.data?.message || "Failed to delete deck."); } };
    const handleRenameDeck = async (deckId, currentName) => { /* ... keep existing code ... */ const newName = window.prompt('Enter the new name for the deck:', currentName); if (newName === null) { return; } const trimmedNewName = newName.trim(); if (!trimmedNewName) { alert("Deck name cannot be empty."); return; } if (trimmedNewName === currentName) { return; } setError(null); try { if (!backendUrl) throw new Error("Backend URL missing"); const response = await axios.put(`${backendUrl}/api/decks/${deckId}`, { name: trimmedNewName }); setDecks(currentDecks => currentDecks.map(deck => deck.id === deckId ? response.data : deck )); } catch (err) { console.error("Error renaming deck:", err.response ? err.response.data : err); setError(err.response?.data?.message || "Failed to rename deck."); } };
    // --- End Functions ---

    return (
        // Add padding to the main container
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
                        className="flex-grow p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary" // Styled input
                    />
                    <Button type="submit" variant="primary">Create Deck</Button>
                </form>
                 {createError && <p className="mt-2 text-danger-dark text-sm">{createError}</p>}
            </div>


            {/* Your Decks Section */}
            <div>
                 <h2 className="text-xl font-semibold mb-3 text-brand-dark">Your Decks</h2>
                 {/* Display loading/error states */}
                 {loadingDecks && <p className="text-gray-500">Loading decks...</p>}
                 {error && <p className="text-danger-dark">{error}</p>}

                 {!loadingDecks && !error && (
                     <div>
                         {decks.length === 0 ? (
                             <p className="text-gray-500">You haven't created any decks yet.</p>
                         ) : (
                            // Use a grid layout for deck cards
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {decks.map((deck) => (
                                    // Deck Card Item
                                    <div key={deck.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                                        {/* Deck Name Link */}
                                        <Link to={`/decks/${deck.id}`} className="block mb-3">
                                            <h3 className="text-lg font-semibold text-brand-primary hover:text-brand-dark truncate" title={deck.name}>
                                                {deck.name}
                                            </h3>
                                        </Link>
                                        {/* Add Card/Due count here later if needed */}
                                        {/* <p className="text-sm text-gray-500 mb-3">Cards: {deck.cardCount || 0}</p> */}

                                        {/* Action Buttons */}
                                        <div className="flex justify-end space-x-2 mt-auto pt-2 border-t border-gray-200">
                                             <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => handleRenameDeck(deck.id, deck.name)}>
                                                 Rename
                                             </Button>
                                             <Button variant="danger" className="text-xs py-1 px-2" onClick={() => handleDeleteDeck(deck.id)}>
                                                 Delete
                                             </Button>
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