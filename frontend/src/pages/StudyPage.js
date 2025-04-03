// frontend/src/pages/StudyPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// Reuse Button component (or import if moved)
const Button = ({ onClick, children, className = '', variant = 'default', type = 'button', disabled = false }) => {
    let baseStyle = "px-4 py-2 rounded font-semibold shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"; // Base style, adjusted padding slightly
    let variantStyle = '';
    switch (variant) {
        case 'primary': variantStyle = 'bg-accent-primary hover:bg-accent-secondary text-brand-darkest focus:ring-accent-primary'; break; // Orange
        case 'danger': variantStyle = 'bg-danger-dark hover:bg-danger-darker text-white focus:ring-danger-dark'; break;        // Red
        case 'success': variantStyle = 'bg-brand-primary hover:bg-brand-dark text-white focus:ring-brand-primary'; break;    // Teal (using as 'Good')
        case 'secondary': variantStyle = 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400'; break;    // Gray (using for 'Hard'/'Easy')
        case 'ghost': variantStyle = 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400'; break;
        default: variantStyle = 'bg-brand-dark hover:bg-opacity-80 text-white focus:ring-brand-dark'; break; // Dark Cyan default
    }
    return (
        <button type={type} onClick={onClick} className={`${baseStyle} ${variantStyle} ${className}`} disabled={disabled}>
            {children}
        </button>
    );
};


function StudyPage() {
    const { deckId } = useParams();
    const [currentCard, setCurrentCard] = useState(null);
    const [showBack, setShowBack] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sessionFinished, setSessionFinished] = useState(false);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL;

    // --- Functions (fetchNextCard, handleSubmitReview) remain unchanged ---
    const fetchNextCard = useCallback(async () => { /* ... keep existing code ... */ setIsLoading(true); setError(null); setSessionFinished(false); setShowBack(false); try { if (!backendUrl) throw new Error("Backend URL missing"); const response = await axios.get(`${backendUrl}/api/study/${deckId}/next`); if (response.data === null) { setCurrentCard(null); setSessionFinished(true); } else { setCurrentCard(response.data); setSessionFinished(false); } } catch (err) { console.error(`Error fetching next card for deck ${deckId}:`, err.response ? err.response.data : err); setError("Failed to fetch the next card. Please try again later."); setCurrentCard(null); } finally { setIsLoading(false); } }, [deckId, backendUrl]);
    useEffect(() => { fetchNextCard(); }, [fetchNextCard]);
    const handleSubmitReview = async (rating) => { /* ... keep existing code ... */ if (!currentCard) return; setError(null); try { if (!backendUrl) throw new Error("Backend URL missing"); await axios.post(`${backendUrl}/api/study/review`, { cardId: currentCard.id, rating: rating, }); fetchNextCard(); } catch (err) { console.error(`Error submitting review for card ${currentCard.id}:`, err.response ? err.response.data : err); setError(err.response?.data?.message || "Failed to submit review."); setIsLoading(false); } };
    // --- End Functions ---

    // --- Render Logic ---
    if (isLoading) {
        return <div className="container mx-auto p-6 text-center text-gray-500">Loading study session...</div>;
    }

    if (error) {
        return (
            <div className="container mx-auto p-6 text-center">
                <p className="text-danger-dark mb-4">Error: {error}</p>
                <Link to={`/decks/${deckId}`} className="text-brand-primary hover:text-brand-dark mr-4">&larr; Back to Deck</Link>
                <Link to="/dashboard" className="text-brand-primary hover:text-brand-dark">Back to Dashboard</Link>
            </div>
        );
    }

    if (sessionFinished) {
        return (
            <div className="container mx-auto p-6 text-center bg-white rounded-lg shadow-md max-w-md">
                <h2 className="text-2xl font-semibold mb-4 text-brand-dark">Study Session Complete!</h2>
                <p className="text-gray-600 mb-6">No more cards are due for review in this deck right now.</p>
                <div className="flex justify-center space-x-4">
                    <Link to={`/decks/${deckId}`}>
                        <Button variant="secondary">Back to Deck</Button>
                    </Link>
                    <Link to="/dashboard">
                         <Button variant="default">Back to Dashboard</Button>
                    </Link>
                 </div>
            </div>
        );
    }

    if (!currentCard) {
        // Should ideally be covered by loading or sessionFinished states
        return <div className="container mx-auto p-6 text-center text-gray-500">Preparing next card...</div>;
    }

    // --- Display Current Card ---
    return (
        <div className="container mx-auto p-4 md:p-6">
            {/* Link back is less prominent now */}
            <div className="mb-4 text-sm">
                 <Link to={`/decks/${deckId}`} className="text-brand-primary hover:text-brand-dark">&larr; Back to Deck View</Link>
            </div>

             {/* Main Card Area */}
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
                 {/* Front Section */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                    <h2 className="text-sm font-semibold uppercase text-gray-500 mb-1">Front</h2>
                    <p className="text-xl md:text-2xl text-brand-darkest min-h-[3em]"> {/* Ensure minimum height */}
                        {currentCard.front_text}
                    </p>
                </div>

                 {/* Back Section or Show Answer Button */}
                 {showBack ? (
                     <div>
                         <h2 className="text-sm font-semibold uppercase text-gray-500 mb-1">Back</h2>
                         <p className="text-xl md:text-2xl text-brand-dark min-h-[3em] mb-6"> {/* Ensure minimum height */}
                             {currentCard.back_text}
                         </p>
                         {/* Rating Buttons */}
                         <div className="pt-4 border-t border-gray-200">
                             <p className="text-center text-sm text-gray-600 mb-3">How well did you remember?</p>
                             <div className="flex justify-center flex-wrap gap-2 md:gap-4">
                                 {/* Apply button variants based on rating meaning */}
                                 <Button variant="danger" onClick={() => handleSubmitReview('Again')}>Again</Button>
                                 <Button variant="secondary" className="bg-amber-200 hover:bg-amber-300 text-amber-800 focus:ring-amber-400" onClick={() => handleSubmitReview('Hard')}>Hard</Button> {/* Custom amber for Hard */}
                                 <Button variant="success" onClick={() => handleSubmitReview('Good')}>Good</Button>
                                 <Button variant="secondary" className="bg-green-200 hover:bg-green-300 text-green-800 focus:ring-green-400" onClick={() => handleSubmitReview('Easy')}>Easy</Button> {/* Custom light green for Easy */}
                             </div>
                         </div>
                     </div>
                 ) : (
                     <div className="text-center mt-6">
                         <Button variant="default" onClick={() => setShowBack(true)}>
                             Show Answer
                         </Button>
                     </div>
                 )}
             </div>
         </div>
    );
}

export default StudyPage;