// frontend/src/pages/DeckViewPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import Link for navigation
import axios from 'axios';

function DeckViewPage() {
    const { deckId } = useParams(); // Get deckId from URL parameters
    const [cards, setCards] = useState([]);
    const [deckName, setDeckName] = useState(''); // To store deck name optionally
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newFrontText, setNewFrontText] = useState('');
    const [newBackText, setNewBackText] = useState('');
    const [createError, setCreateError] = useState(null); // Error specific to creation
    
    // --- >> NEW STATE FOR CSV IMPORT << ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState(''); // e.g., "Importing...", "Success!", "Error"
    const [importErrors, setImportErrors] = useState([]); // To store errors from backend response
    const [importSuccessCount, setImportSuccessCount] = useState(0);
    // --- >> END NEW STATE << ---

    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    // Function to fetch deck details and cards
const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDeckName(''); // Reset deck name
    setCards([]);   // Reset cards
    try {
        if (!backendUrl) throw new Error("Backend URL missing");

        // --- Fetch Deck Details ---
        const deckResponse = await axios.get(`${backendUrl}/api/decks/${deckId}`);
        setDeckName(deckResponse.data.name); // Use the setter

        // --- Fetch Cards ---
        // Ensure this is the ONLY declaration of cardsResponse in this function
        const cardsResponse = await axios.get(`${backendUrl}/api/decks/${deckId}/cards`);
        setCards(cardsResponse.data);

    } catch (err) {
        console.error(`Error fetching data for deck ${deckId}:`, err.response ? err.response.data : err);
        if (err.response && err.response.status === 404) {
             setError(`Deck with ID ${deckId} not found or not owned by you.`);
        } else {
             setError(`Failed to load data for deck ${deckId}.`);
        }
        setCards([]);
        setDeckName('');
    } finally {
        setLoading(false);
    }
}, [deckId, backendUrl]); // Dependencies for useCallback

// useEffect hook to call fetchData on mount or when fetchData changes
useEffect(() => {
    fetchData();
}, [fetchData]); // Dependency is the fetchData function itself

    // --- Add handler for creating a new card ---
    const handleAddCard = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setCreateError(null); // Clear previous create errors
        setError(null); // Clear general errors

        if (!newFrontText.trim() || !newBackText.trim()) {
            setCreateError("Both front and back text are required.");
            return;
        }

        try {
            if (!backendUrl) throw new Error("Backend URL missing");
            // Call the backend POST endpoint
            const response = await axios.post(`${backendUrl}/api/decks/${deckId}/cards`, {                
                frontText: newFrontText.trim(),
                backText: newBackText.trim()
            });

            // Add the new card to the beginning of the list in state
            setCards(currentCards => [response.data, ...currentCards]);

            // Clear the form inputs
            setNewFrontText('');
            setNewBackText('');

        } catch (err) {
            console.error("Error creating card:", err.response ? err.response.data : err);
            setCreateError(err.response?.data?.message || "Failed to create card.");
        }
    };
    // --- End add card handler ---

    // --- Add handler for DELETING a card ---
    const handleDeleteCard = async (cardIdToDelete) => {
        if (!window.confirm('Are you sure you want to delete this card?')) {
            return;
        }
        setError(null); // Clear previous general errors
        try {
            if (!backendUrl) throw new Error("Backend URL missing");
            await axios.delete(`${backendUrl}/api/cards/${cardIdToDelete}`);
            // Remove the card from state
            setCards(currentCards => currentCards.filter(card => card.id !== cardIdToDelete));
        } catch (err) {
            console.error(`Error deleting card ${cardIdToDelete}:`, err.response ? err.response.data : err);
            setError(err.response?.data?.message || "Failed to delete card.");
        }
    };
    // --- End delete card handler ---

    // --- Add handler for EDITING a card ---
    const handleEditCard = async (cardToEdit) => {
        const currentFront = cardToEdit.front_text;
        const currentBack = cardToEdit.back_text;

        const newFront = window.prompt('Enter new front text:', currentFront);
        // If user cancels prompt, newFront will be null
        if (newFront === null) return;

        const newBack = window.prompt('Enter new back text:', currentBack);
        // If user cancels prompt, newBack will be null
        if (newBack === null) return;

        const trimmedFront = newFront.trim();
        const trimmedBack = newBack.trim();

        // Basic validation
        if (!trimmedFront || !trimmedBack) {
            alert("Front and back text cannot be empty.");
            return;
        }

        // Check if anything actually changed
        if (trimmedFront === currentFront && trimmedBack === currentBack) {
            return; // No changes made
        }

        setError(null); // Clear previous general errors
        try {
            if (!backendUrl) throw new Error("Backend URL missing");

            const response = await axios.put(`${backendUrl}/api/cards/${cardToEdit.id}`, {
                frontText: trimmedFront, // Send only updated fields potentially
                backText: trimmedBack
            });

            // Update the card in the state
            setCards(currentCards => currentCards.map(card =>
                card.id === cardToEdit.id ? response.data : card
            ));

        } catch (err) {
            console.error(`Error updating card ${cardToEdit.id}:`, err.response ? err.response.data : err);
            setError(err.response?.data?.message || "Failed to update card.");
        }
    };
    // --- End edit card handler ---

    // --- >> NEW FUNCTION: Handle File Selection << ---
    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]); // Get the first selected file
        setImportStatus(''); // Clear previous status messages
        setImportErrors([]);
        setImportSuccessCount(0);
    };
    // --- >> END NEW FUNCTION << ---

    // --- >> NEW FUNCTION: Handle CSV Import Submission << ---
    const handleImportSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission
        if (!selectedFile) {
            setImportStatus('Error: Please select a CSV file first.');
            return;
        }
        if (!backendUrl) {
             setImportStatus('Error: Backend URL not configured.');
            return;
        }

        setIsImporting(true);
        setImportStatus('Importing, please wait...');
        setImportErrors([]);
        setImportSuccessCount(0);
        setError(null); // Clear general page errors

        const formData = new FormData();
        formData.append('csvFile', selectedFile); // 'csvFile' must match the backend upload.single() key

        try {
            const response = await axios.post(
                `${backendUrl}/api/decks/${deckId}/cards/import`,            
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data', // Axios usually sets this automatically for FormData, but doesn't hurt to be explicit
                    },
                    // withCredentials: true is set globally, so no need here unless configured differently
                }
            );

            // Handle success response from backend
            setImportStatus(`Import Complete: ${response.data.message}`);
            setImportSuccessCount(response.data.successCount || 0);
            if (response.data.errors && response.data.errors.length > 0) {
                setImportErrors(response.data.errors);
            }
            setSelectedFile(null); // Clear the file input after successful attempt
            // Refresh the card list to show newly imported cards
            fetchData(); // Re-fetch deck data including cards

        } catch (err) {
            console.error('Error importing CSV:', err.response ? err.response.data : err);
            const errorMsg = err.response?.data?.message || 'CSV import failed. Check console for details.';
            setImportStatus(`Error: ${errorMsg}`);
            setImportErrors(err.response?.data?.errors || []); // Show specific errors if backend sent them
        } finally {
            setIsImporting(false);
            // Clear the file input visually (important!)
            const fileInput = document.getElementById('csvFileInput'); // Ensure your input has this ID
            if (fileInput) {
                fileInput.value = ''; // Reset the input field
            }
             // Keep selectedFile state null/cleared here
             setSelectedFile(null);
        }
    };
     // --- >> END NEW FUNCTION << ---

    return (
        <div>
            {/* Add a link back to the dashboard */}
            <Link to="/dashboard">Back to Dashboard</Link>
            {/* Add Study Link/Button */}
            <Link to={`/study/${deckId}`} style={{ marginLeft: '15px' }}>
                <button>Study This Deck</button>
            </Link>
            <h1>Cards in Deck {deckName || deckId}</h1>
            {/* --- >> NEW CSV IMPORT FORM << --- */}
            <div style={{ border: '1px solid green', padding: '15px', margin: '15px 0' }}>
                <h3>Import Cards from CSV</h3>
                <p><small>Format: Two columns - 'Front Text', 'Back Text'. A header row is optional.</small></p>
                <form onSubmit={handleImportSubmit}>
                    <input
                        type="file"
                        id="csvFileInput" // Added ID for resetting
                        accept=".csv, text/csv" // Specify accepted file types
                        onChange={handleFileChange}
                        disabled={isImporting} // Disable while importing
                    />
                    <button type="submit" disabled={!selectedFile || isImporting}>
                        {isImporting ? 'Importing...' : 'Import Selected CSV'}
                    </button>
                </form>
                {/* Display Import Status and Errors */}
                {importStatus && <p style={{ fontWeight: 'bold', color: importStatus.startsWith('Error') ? 'red' : 'green' }}>{importStatus}</p>}
                {importErrors.length > 0 && (
                    <div style={{ color: 'red', marginTop: '5px' }}>
                        <p>Import Errors:</p>
                        <ul>
                            {importErrors.map((errMsg, index) => (
                                <li key={index}>{errMsg}</li>
                            ))}
                        </ul>
                    </div>
                )}
                 {importSuccessCount > 0 && importErrors.length === 0 && !importStatus.startsWith('Error') && (
                    <p style={{ color: 'green' }}>Successfully imported {importSuccessCount} cards.</p>
                )}
            </div>
             {/* --- >> END NEW CSV IMPORT FORM << --- */}

            {/* --- Add New Card Form --- */}
            <form onSubmit={handleAddCard} style={{ marginBottom: '20px', padding: '10px', border: '1px solid lightblue' }}>
                <h3>Add New Card</h3>
                <div>
                    <label htmlFor="frontText">Front: </label>
                    <textarea
                        id="frontText"
                        value={newFrontText}
                        onChange={(e) => setNewFrontText(e.target.value)}
                        rows={2}
                        style={{ width: '90%', marginBottom: '5px' }}
                    />
                </div>
                <div>
                    <label htmlFor="backText">Back: </label>
                    <textarea
                        id="backText"
                        value={newBackText}
                        onChange={(e) => setNewBackText(e.target.value)}
                        rows={2}
                        style={{ width: '90%', marginBottom: '5px' }}
                    />
                </div>
                <button type="submit">Add Card</button>
                {createError && <p style={{ color: 'red', marginTop: '5px' }}>{createError}</p>}
            </form>
            {/* --- End New Card Form --- */}
            {/* Display loading/error states */}
            {loading && <p>Loading cards...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Display cards */}
            {!loading && !error && (
                <div>
                    {cards.length === 0 ? (
                        <p>This deck has no cards yet.</p>
                    ) : (
                        <ul>
                            {cards.map((card) => (
                                <li key={card.id} style={{ border: '1px solid #ccc', margin: '5px', padding: '5px' }}>
                                    <p><strong>Front:</strong> {card.front_text}</p>
                                    <p><strong>Back:</strong> {card.back_text}</p>
                                    {/* --- Add Edit and Delete Buttons --- */}
                                    <button
                                        style={{ marginRight: '5px' }}
                                        onClick={() => handleEditCard(card)} // Pass the whole card object
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCard(card.id)} // Pass only the ID
                                    >
                                        Delete
                                    </button>
                                    {/* --- End Buttons --- */}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Add Card Form will go here later */}
        </div>
    );
}

export default DeckViewPage;