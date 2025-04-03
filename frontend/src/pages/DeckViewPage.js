// // frontend/src/pages/DeckViewPage.js
// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams, Link } from 'react-router-dom'; // Import Link for navigation
// import axios from 'axios';

// function DeckViewPage() {
//     const { deckId } = useParams(); // Get deckId from URL parameters
//     const [cards, setCards] = useState([]);
//     const [deckName, setDeckName] = useState(''); // To store deck name optionally
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [newFrontText, setNewFrontText] = useState('');
//     const [newBackText, setNewBackText] = useState('');
//     const [createError, setCreateError] = useState(null); // Error specific to creation
    
//     // --- >> NEW STATE FOR CSV IMPORT << ---
//     const [selectedFile, setSelectedFile] = useState(null);
//     const [isImporting, setIsImporting] = useState(false);
//     const [importStatus, setImportStatus] = useState(''); // e.g., "Importing...", "Success!", "Error"
//     const [importErrors, setImportErrors] = useState([]); // To store errors from backend response
//     const [importSuccessCount, setImportSuccessCount] = useState(0);
//     // --- >> END NEW STATE << ---

//     const backendUrl = process.env.REACT_APP_BACKEND_URL;
//     // Function to fetch deck details and cards
// const fetchData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     setDeckName(''); // Reset deck name
//     setCards([]);   // Reset cards
//     try {
//         if (!backendUrl) throw new Error("Backend URL missing");

//         // --- Fetch Deck Details ---
//         const deckResponse = await axios.get(`${backendUrl}/api/decks/${deckId}`);
//         setDeckName(deckResponse.data.name); // Use the setter

//         // --- Fetch Cards ---
//         // Ensure this is the ONLY declaration of cardsResponse in this function
//         const cardsResponse = await axios.get(`${backendUrl}/api/decks/${deckId}/cards`);
//         setCards(cardsResponse.data);

//     } catch (err) {
//         console.error(`Error fetching data for deck ${deckId}:`, err.response ? err.response.data : err);
//         if (err.response && err.response.status === 404) {
//              setError(`Deck with ID ${deckId} not found or not owned by you.`);
//         } else {
//              setError(`Failed to load data for deck ${deckId}.`);
//         }
//         setCards([]);
//         setDeckName('');
//     } finally {
//         setLoading(false);
//     }
// }, [deckId, backendUrl]); // Dependencies for useCallback

// // useEffect hook to call fetchData on mount or when fetchData changes
// useEffect(() => {
//     fetchData();
// }, [fetchData]); // Dependency is the fetchData function itself

//     // --- Add handler for creating a new card ---
//     const handleAddCard = async (e) => {
//         e.preventDefault(); // Prevent default form submission
//         setCreateError(null); // Clear previous create errors
//         setError(null); // Clear general errors

//         if (!newFrontText.trim() || !newBackText.trim()) {
//             setCreateError("Both front and back text are required.");
//             return;
//         }

//         try {
//             if (!backendUrl) throw new Error("Backend URL missing");
//             // Call the backend POST endpoint
//             const response = await axios.post(`${backendUrl}/api/decks/${deckId}/cards`, {                
//                 frontText: newFrontText.trim(),
//                 backText: newBackText.trim()
//             });

//             // Add the new card to the beginning of the list in state
//             setCards(currentCards => [response.data, ...currentCards]);

//             // Clear the form inputs
//             setNewFrontText('');
//             setNewBackText('');

//         } catch (err) {
//             console.error("Error creating card:", err.response ? err.response.data : err);
//             setCreateError(err.response?.data?.message || "Failed to create card.");
//         }
//     };
//     // --- End add card handler ---

//     // --- Add handler for DELETING a card ---
//     const handleDeleteCard = async (cardIdToDelete) => {
//         if (!window.confirm('Are you sure you want to delete this card?')) {
//             return;
//         }
//         setError(null); // Clear previous general errors
//         try {
//             if (!backendUrl) throw new Error("Backend URL missing");
//             await axios.delete(`${backendUrl}/api/cards/${cardIdToDelete}`);
//             // Remove the card from state
//             setCards(currentCards => currentCards.filter(card => card.id !== cardIdToDelete));
//         } catch (err) {
//             console.error(`Error deleting card ${cardIdToDelete}:`, err.response ? err.response.data : err);
//             setError(err.response?.data?.message || "Failed to delete card.");
//         }
//     };
//     // --- End delete card handler ---

//     // --- Add handler for EDITING a card ---
//     const handleEditCard = async (cardToEdit) => {
//         const currentFront = cardToEdit.front_text;
//         const currentBack = cardToEdit.back_text;

//         const newFront = window.prompt('Enter new front text:', currentFront);
//         // If user cancels prompt, newFront will be null
//         if (newFront === null) return;

//         const newBack = window.prompt('Enter new back text:', currentBack);
//         // If user cancels prompt, newBack will be null
//         if (newBack === null) return;

//         const trimmedFront = newFront.trim();
//         const trimmedBack = newBack.trim();

//         // Basic validation
//         if (!trimmedFront || !trimmedBack) {
//             alert("Front and back text cannot be empty.");
//             return;
//         }

//         // Check if anything actually changed
//         if (trimmedFront === currentFront && trimmedBack === currentBack) {
//             return; // No changes made
//         }

//         setError(null); // Clear previous general errors
//         try {
//             if (!backendUrl) throw new Error("Backend URL missing");

//             const response = await axios.put(`${backendUrl}/api/cards/${cardToEdit.id}`, {
//                 frontText: trimmedFront, // Send only updated fields potentially
//                 backText: trimmedBack
//             });

//             // Update the card in the state
//             setCards(currentCards => currentCards.map(card =>
//                 card.id === cardToEdit.id ? response.data : card
//             ));

//         } catch (err) {
//             console.error(`Error updating card ${cardToEdit.id}:`, err.response ? err.response.data : err);
//             setError(err.response?.data?.message || "Failed to update card.");
//         }
//     };
//     // --- End edit card handler ---

//     // --- >> NEW FUNCTION: Handle File Selection << ---
//     const handleFileChange = (event) => {
//         setSelectedFile(event.target.files[0]); // Get the first selected file
//         setImportStatus(''); // Clear previous status messages
//         setImportErrors([]);
//         setImportSuccessCount(0);
//     };
//     // --- >> END NEW FUNCTION << ---

//     // --- >> NEW FUNCTION: Handle CSV Import Submission << ---
//     const handleImportSubmit = async (event) => {
//         event.preventDefault(); // Prevent default form submission
//         if (!selectedFile) {
//             setImportStatus('Error: Please select a CSV file first.');
//             return;
//         }
//         if (!backendUrl) {
//              setImportStatus('Error: Backend URL not configured.');
//             return;
//         }

//         setIsImporting(true);
//         setImportStatus('Importing, please wait...');
//         setImportErrors([]);
//         setImportSuccessCount(0);
//         setError(null); // Clear general page errors

//         const formData = new FormData();
//         formData.append('csvFile', selectedFile); // 'csvFile' must match the backend upload.single() key

//         try {
//             const response = await axios.post(
//                 `${backendUrl}/api/decks/${deckId}/cards/import`,            
//                 formData,
//                 {
//                     headers: {
//                         'Content-Type': 'multipart/form-data', // Axios usually sets this automatically for FormData, but doesn't hurt to be explicit
//                     },
//                     // withCredentials: true is set globally, so no need here unless configured differently
//                 }
//             );

//             // Handle success response from backend
//             setImportStatus(`Import Complete: ${response.data.message}`);
//             setImportSuccessCount(response.data.successCount || 0);
//             if (response.data.errors && response.data.errors.length > 0) {
//                 setImportErrors(response.data.errors);
//             }
//             setSelectedFile(null); // Clear the file input after successful attempt
//             // Refresh the card list to show newly imported cards
//             fetchData(); // Re-fetch deck data including cards

//         } catch (err) {
//             console.error('Error importing CSV:', err.response ? err.response.data : err);
//             const errorMsg = err.response?.data?.message || 'CSV import failed. Check console for details.';
//             setImportStatus(`Error: ${errorMsg}`);
//             setImportErrors(err.response?.data?.errors || []); // Show specific errors if backend sent them
//         } finally {
//             setIsImporting(false);
//             // Clear the file input visually (important!)
//             const fileInput = document.getElementById('csvFileInput'); // Ensure your input has this ID
//             if (fileInput) {
//                 fileInput.value = ''; // Reset the input field
//             }
//              // Keep selectedFile state null/cleared here
//              setSelectedFile(null);
//         }
//     };
//      // --- >> END NEW FUNCTION << ---

//     return (
//         <div>
//             {/* Add a link back to the dashboard */}
//             <Link to="/dashboard">Back to Dashboard</Link>
//             {/* Add Study Link/Button */}
//             <Link to={`/study/${deckId}`} style={{ marginLeft: '15px' }}>
//                 <button>Study This Deck</button>
//             </Link>
//             <h1>Cards in Deck {deckName || deckId}</h1>
//             {/* --- >> NEW CSV IMPORT FORM << --- */}
//             <div style={{ border: '1px solid green', padding: '15px', margin: '15px 0' }}>
//                 <h3>Import Cards from CSV</h3>
//                 <p><small>Format: Two columns - 'Front Text', 'Back Text'. A header row is optional.</small></p>
//                 <form onSubmit={handleImportSubmit}>
//                     <input
//                         type="file"
//                         id="csvFileInput" // Added ID for resetting
//                         accept=".csv, text/csv" // Specify accepted file types
//                         onChange={handleFileChange}
//                         disabled={isImporting} // Disable while importing
//                     />
//                     <button type="submit" disabled={!selectedFile || isImporting}>
//                         {isImporting ? 'Importing...' : 'Import Selected CSV'}
//                     </button>
//                 </form>
//                 {/* Display Import Status and Errors */}
//                 {importStatus && <p style={{ fontWeight: 'bold', color: importStatus.startsWith('Error') ? 'red' : 'green' }}>{importStatus}</p>}
//                 {importErrors.length > 0 && (
//                     <div style={{ color: 'red', marginTop: '5px' }}>
//                         <p>Import Errors:</p>
//                         <ul>
//                             {importErrors.map((errMsg, index) => (
//                                 <li key={index}>{errMsg}</li>
//                             ))}
//                         </ul>
//                     </div>
//                 )}
//                  {importSuccessCount > 0 && importErrors.length === 0 && !importStatus.startsWith('Error') && (
//                     <p style={{ color: 'green' }}>Successfully imported {importSuccessCount} cards.</p>
//                 )}
//             </div>
//              {/* --- >> END NEW CSV IMPORT FORM << --- */}

//             {/* --- Add New Card Form --- */}
//             <form onSubmit={handleAddCard} style={{ marginBottom: '20px', padding: '10px', border: '1px solid lightblue' }}>
//                 <h3>Add New Card</h3>
//                 <div>
//                     <label htmlFor="frontText">Front: </label>
//                     <textarea
//                         id="frontText"
//                         value={newFrontText}
//                         onChange={(e) => setNewFrontText(e.target.value)}
//                         rows={2}
//                         style={{ width: '90%', marginBottom: '5px' }}
//                     />
//                 </div>
//                 <div>
//                     <label htmlFor="backText">Back: </label>
//                     <textarea
//                         id="backText"
//                         value={newBackText}
//                         onChange={(e) => setNewBackText(e.target.value)}
//                         rows={2}
//                         style={{ width: '90%', marginBottom: '5px' }}
//                     />
//                 </div>
//                 <button type="submit">Add Card</button>
//                 {createError && <p style={{ color: 'red', marginTop: '5px' }}>{createError}</p>}
//             </form>
//             {/* --- End New Card Form --- */}
//             {/* Display loading/error states */}
//             {loading && <p>Loading cards...</p>}
//             {error && <p style={{ color: 'red' }}>{error}</p>}

//             {/* Display cards */}
//             {!loading && !error && (
//                 <div>
//                     {cards.length === 0 ? (
//                         <p>This deck has no cards yet.</p>
//                     ) : (
//                         <ul>
//                             {cards.map((card) => (
//                                 <li key={card.id} style={{ border: '1px solid #ccc', margin: '5px', padding: '5px' }}>
//                                     <p><strong>Front:</strong> {card.front_text}</p>
//                                     <p><strong>Back:</strong> {card.back_text}</p>
//                                     {/* --- Add Edit and Delete Buttons --- */}
//                                     <button
//                                         style={{ marginRight: '5px' }}
//                                         onClick={() => handleEditCard(card)} // Pass the whole card object
//                                     >
//                                         Edit
//                                     </button>
//                                     <button
//                                         onClick={() => handleDeleteCard(card.id)} // Pass only the ID
//                                     >
//                                         Delete
//                                     </button>
//                                     {/* --- End Buttons --- */}
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </div>
//             )}

//             {/* Add Card Form will go here later */}
//         </div>
//     );
// }

// export default DeckViewPage;

// frontend/src/pages/DeckViewPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// Reuse the Button component (Consider moving to components/ui/Button.js later)
const Button = ({ onClick, children, className = '', variant = 'default', type = 'button', disabled = false }) => {
    let baseStyle = "px-3 py-1.5 rounded font-semibold shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"; // Slightly smaller default padding/text
    let variantStyle = '';
    switch (variant) {
        case 'primary': variantStyle = 'bg-accent-primary hover:bg-accent-secondary text-brand-darkest focus:ring-accent-primary'; break;
        case 'danger': variantStyle = 'bg-danger-dark hover:bg-danger-darker text-white focus:ring-danger-dark'; break;
        case 'secondary': variantStyle = 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400'; break;
        case 'ghost': variantStyle = 'bg-transparent hover:bg-gray-200 text-gray-700 focus:ring-gray-400'; break;
        default: variantStyle = 'bg-brand-primary hover:bg-brand-dark text-white focus:ring-brand-primary'; break;
    }
    return (
        <button type={type} onClick={onClick} className={`${baseStyle} ${variantStyle} ${className}`} disabled={disabled}>
            {children}
        </button>
    );
};


function DeckViewPage() {
    const { deckId } = useParams();
    const [cards, setCards] = useState([]);
    const [deckName, setDeckName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newFrontText, setNewFrontText] = useState('');
    const [newBackText, setNewBackText] = useState('');
    const [createError, setCreateError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState('');
    const [importErrors, setImportErrors] = useState([]);
    const [importSuccessCount, setImportSuccessCount] = useState(0);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL;

    // --- Functions (fetchData, handleFileChange, handleImportSubmit, handleAddCard, handleDeleteCard, handleEditCard) remain unchanged ---
    const fetchData = useCallback(async () => { /* ... keep existing code ... */ setLoading(true); setError(null); setDeckName(''); setCards([]); try { if (!backendUrl) throw new Error("Backend URL missing"); const deckResponse = await axios.get(`${backendUrl}/api/decks/${deckId}`); setDeckName(deckResponse.data.name); const cardsResponse = await axios.get(`${backendUrl}/api/decks/${deckId}/cards`); setCards(cardsResponse.data); } catch (err) { console.error(`Error fetching data for deck ${deckId}:`, err.response ? err.response.data : err); if (err.response && err.response.status === 404) { setError(`Deck with ID ${deckId} not found or not owned by you.`); } else { setError(`Failed to load data for deck ${deckId}.`); } setCards([]); setDeckName(''); } finally { setLoading(false); } }, [deckId, backendUrl]);
    useEffect(() => { fetchData(); }, [fetchData]);
    const handleFileChange = (event) => { /* ... keep existing code ... */ setSelectedFile(event.target.files[0]); setImportStatus(''); setImportErrors([]); setImportSuccessCount(0); };
    const handleImportSubmit = async (event) => { /* ... keep existing code ... */ event.preventDefault(); if (!selectedFile) { setImportStatus('Error: Please select a CSV file first.'); return; } if (!backendUrl) { setImportStatus('Error: Backend URL not configured.'); return; } setIsImporting(true); setImportStatus('Importing, please wait...'); setImportErrors([]); setImportSuccessCount(0); setError(null); const formData = new FormData(); formData.append('csvFile', selectedFile); try { const response = await axios.post(`${backendUrl}/api/decks/${deckId}/cards/import`, formData, { headers: { 'Content-Type': 'multipart/form-data', }}); setImportStatus(`Import Complete: ${response.data.message}`); setImportSuccessCount(response.data.successCount || 0); if (response.data.errors && response.data.errors.length > 0) { setImportErrors(response.data.errors); } setSelectedFile(null); fetchData(); } catch (err) { console.error('Error importing CSV:', err.response ? err.response.data : err); const errorMsg = err.response?.data?.message || 'CSV import failed. Check console for details.'; setImportStatus(`Error: ${errorMsg}`); setImportErrors(err.response?.data?.errors || []); } finally { setIsImporting(false); const fileInput = document.getElementById('csvFileInput'); if (fileInput) { fileInput.value = ''; } setSelectedFile(null); } };
    const handleAddCard = async (e) => { /* ... keep existing code ... */ e.preventDefault(); setCreateError(null); setError(null); if (!newFrontText.trim() || !newBackText.trim()) { setCreateError("Both front and back text are required."); return; } try { if (!backendUrl) throw new Error("Backend URL missing"); const response = await axios.post(`${backendUrl}/api/decks/${deckId}/cards`, { frontText: newFrontText.trim(), backText: newBackText.trim() }); setCards(currentCards => [response.data, ...currentCards]); setNewFrontText(''); setNewBackText(''); } catch (err) { console.error("Error creating card:", err.response ? err.response.data : err); setCreateError(err.response?.data?.message || "Failed to create card."); } };
    const handleDeleteCard = async (cardIdToDelete) => { /* ... keep existing code ... */ if (!window.confirm('Are you sure you want to delete this card?')) { return; } setError(null); try { if (!backendUrl) throw new Error("Backend URL missing"); await axios.delete(`${backendUrl}/api/cards/${cardIdToDelete}`); setCards(currentCards => currentCards.filter(card => card.id !== cardIdToDelete)); } catch (err) { console.error(`Error deleting card ${cardIdToDelete}:`, err.response ? err.response.data : err); setError(err.response?.data?.message || "Failed to delete card."); } };
    const handleEditCard = async (cardToEdit) => { /* ... keep existing code ... */ const currentFront = cardToEdit.front_text; const currentBack = cardToEdit.back_text; const newFront = window.prompt('Enter new front text:', currentFront); if (newFront === null) return; const newBack = window.prompt('Enter new back text:', currentBack); if (newBack === null) return; const trimmedFront = newFront.trim(); const trimmedBack = newBack.trim(); if (!trimmedFront || !trimmedBack) { alert("Front and back text cannot be empty."); return; } if (trimmedFront === currentFront && trimmedBack === currentBack) { return; } setError(null); try { if (!backendUrl) throw new Error("Backend URL missing"); const response = await axios.put(`${backendUrl}/api/cards/${cardToEdit.id}`, { frontText: trimmedFront, backText: trimmedBack }); setCards(currentCards => currentCards.map(card => card.id === cardToEdit.id ? response.data : card )); } catch (err) { console.error(`Error updating card ${cardToEdit.id}:`, err.response ? err.response.data : err); setError(err.response?.data?.message || "Failed to update card."); } };
    // --- End Functions ---

    return (
        // Main container with padding
        <div className="container mx-auto p-4 md:p-6">

             {/* Header and Navigation */}
             <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
                 <div>
                     <Link to="/dashboard" className="text-brand-primary hover:text-brand-dark">&larr; Back to Dashboard</Link>
                     <h1 className="text-2xl md:text-3xl font-bold text-brand-darkest mt-1 truncate" title={deckName || `Deck ID: ${deckId}`}>
                         Deck: {deckName || `(ID: ${deckId})`}
                     </h1>
                 </div>
                 <Link to={`/study/${deckId}`}>
                     <Button variant="primary" className="bg-brand-primary hover:bg-brand-dark"> {/* Use primary brand color for Study */}
                        Study This Deck
                     </Button>
                 </Link>
             </div>

              {/* Add Card Form */}
             <div className="mb-6 p-4 bg-white rounded-lg shadow">
                 <h3 className="text-lg font-semibold mb-3 text-brand-dark">Add New Card</h3>
                 <form onSubmit={handleAddCard}>
                    <div className="mb-3">
                        <label htmlFor="frontText" className="block text-sm font-medium text-gray-700 mb-1">Front Text</label>
                        <textarea
                            id="frontText"
                            value={newFrontText}
                            onChange={(e) => setNewFrontText(e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="backText" className="block text-sm font-medium text-gray-700 mb-1">Back Text</label>
                        <textarea
                            id="backText"
                            value={newBackText}
                            onChange={(e) => setNewBackText(e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                    </div>
                    <Button type="submit" variant="primary">Add Card</Button>
                    {createError && <p className="mt-2 text-danger-dark text-sm">{createError}</p>}
                 </form>
            </div>

             {/* CSV Import Form */}
             <div className="mb-6 p-4 bg-white rounded-lg shadow">
                 <h3 className="text-lg font-semibold mb-2 text-brand-dark">Import Cards from CSV</h3>
                 <p className="text-sm text-gray-600 mb-3"><small>Format: Two columns - 'Front Text', 'Back Text'. Header row is optional.</small></p>
                 <form onSubmit={handleImportSubmit}>
                    <div className="flex items-center space-x-2">
                        <input
                            type="file"
                            id="csvFileInput"
                            accept=".csv, text/csv"
                            onChange={handleFileChange}
                            disabled={isImporting}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-darkest hover:file:bg-opacity-80 disabled:opacity-50"
                         />
                         <Button type="submit" variant="secondary" disabled={!selectedFile || isImporting}>
                             {isImporting ? 'Importing...' : 'Import CSV'}
                         </Button>
                     </div>
                 </form>
                 {/* Import Status/Errors */}
                 {importStatus && <p className={`mt-2 text-sm font-semibold ${importStatus.startsWith('Error') ? 'text-danger-dark' : 'text-green-600'}`}>{importStatus}</p>}
                 {importErrors.length > 0 && (
                     <div className="mt-1 text-danger-dark text-xs">
                         <p>Import Errors:</p>
                         <ul className="list-disc list-inside">
                            {importErrors.map((errMsg, index) => ( <li key={index}>{errMsg}</li> ))}
                        </ul>
                    </div>
                )}
                {importSuccessCount > 0 && importErrors.length === 0 && !importStatus.startsWith('Error') && (
                    <p className="mt-1 text-green-600 text-sm">Successfully imported {importSuccessCount} cards.</p>
                )}
            </div>

            {/* Card List Section */}
            <div>
                <h2 className="text-xl font-semibold mb-3 text-brand-dark">Cards in this Deck ({cards.length})</h2>
                 {loading && <p className="text-gray-500">Loading cards...</p>}
                 {error && <p className="text-danger-dark">{error}</p>}

                {!loading && !error && (
                    <div>
                        {cards.length === 0 ? (
                            <p className="text-gray-500 bg-white p-4 rounded shadow">This deck has no cards yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {cards.map((card) => (
                                    <li key={card.id} className="bg-white p-3 rounded-lg shadow flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                         {/* Card Content */}
                                         <div className="flex-grow mb-2 sm:mb-0 sm:mr-4">
                                             <p className="text-sm font-medium text-gray-500">Front:</p>
                                             <p className="mb-1 break-words">{card.front_text}</p>
                                             <p className="text-sm font-medium text-gray-500 mt-1">Back:</p>
                                             <p className="break-words">{card.back_text}</p>
                                             {/* Optional: Show SRS info */}
                                             {/* <p className="text-xs text-gray-400 mt-1">Next Review: {new Date(card.next_review_at).toLocaleDateString()} | Interval: {card.interval}d | EF: {card.ease_factor?.toFixed(2)}</p> */}
                                         </div>
                                         {/* Action Buttons */}
                                         <div className="flex-shrink-0 flex space-x-2 self-end sm:self-center">
                                             <Button variant="secondary" onClick={() => handleEditCard(card)}>Edit</Button>
                                             <Button variant="danger" onClick={() => handleDeleteCard(card.id)}>Delete</Button>
                                         </div>
                                     </li>
                                 ))}
                             </ul>
                         )}
                     </div>
                )}
            </div>

        </div>
    );
}

export default DeckViewPage;