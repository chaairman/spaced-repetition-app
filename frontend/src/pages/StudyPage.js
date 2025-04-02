// frontend/src/pages/StudyPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function StudyPage() {
    const { deckId } = useParams();
    const [currentCard, setCurrentCard] = useState(null); // Stores the card object { id, front_text, back_text }
    const [showBack, setShowBack] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sessionFinished, setSessionFinished] = useState(false); // Track if session is done
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    // Function to fetch the next due card
    const fetchNextCard = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSessionFinished(false); // Assume session is not finished initially
        setShowBack(false); // Hide back of next card
        try {
            if (!backendUrl) throw new Error("Backend URL missing");

            const response = await axios.get(`${backendUrl}/api/study/${deckId}/next`);

            if (response.data === null) {
                // No more cards are due
                setCurrentCard(null);
                setSessionFinished(true);
            } else {
                setCurrentCard(response.data);
                setSessionFinished(false);
            }
        } catch (err) {
            console.error(`Error fetching next card for deck ${deckId}:`, err.response ? err.response.data : err);
            setError("Failed to fetch the next card. Please try again later.");
            setCurrentCard(null);
        } finally {
            setIsLoading(false);
        }
    }, [deckId, backendUrl]);

    // Fetch the first card when the component mounts or deckId changes
    useEffect(() => {
        fetchNextCard();
    }, [fetchNextCard]); // Use fetchNextCard as dependency

    // --- Handler for submitting a review ---
    const handleSubmitReview = async (rating) => {
        if (!currentCard) return; // Should not happen if buttons are shown, but safe check

        setError(null); // Clear previous errors
        // Optional: You could set a temporary "submitting" state here if desired

        try {
            if (!backendUrl) throw new Error("Backend URL missing");

            // 1. Call the backend API to submit the review
            await axios.post(`${backendUrl}/api/study/review`, {
                cardId: currentCard.id,
                rating: rating, // Again, Hard, Good, or Easy
            });

            // 2. Fetch the next card to continue the session
            //    (fetchNextCard handles setting loading, error, card data, sessionFinished)
            fetchNextCard();

        } catch (err) {
            console.error(`Error submitting review for card ${currentCard.id}:`, err.response ? err.response.data : err);
            setError(err.response?.data?.message || "Failed to submit review.");
            // Keep the current card visible so the user can retry if needed, or handle differently
            setIsLoading(false); // Ensure loading is false on error
        }
    };
    // --- End review submit handler ---


    // --- Render Logic ---
    if (isLoading) {
        return <div>Loading study session...</div>;
    }

    if (error) {
        return (
            <div>
                <p style={{ color: 'red' }}>Error: {error}</p>
                <Link to={`/decks/${deckId}`}>Back to Deck View</Link> <br />
                <Link to="/dashboard">Back to Dashboard</Link>
            </div>
        );
    }

    if (sessionFinished) {
        return (
            <div>
                <h2>Study Session Complete!</h2>
                <p>No more cards are due for review in this deck right now.</p>
                <Link to={`/decks/${deckId}`}>Back to Deck View</Link> <br />
                <Link to="/dashboard">Back to Dashboard</Link>
            </div>
        );
    }

    if (!currentCard) {
         // Should ideally be covered by loading or sessionFinished states
         return <div>Something went wrong, no card loaded.</div>;
    }

    // --- Display Current Card ---
    return (
        <div>
            <h1>Studying Deck {deckId}</h1> {/* We'll add deck name later maybe */}
            <div style={{ border: '1px solid black', padding: '20px', margin: '10px' }}>
                <h2>Front</h2>
                <p style={{ fontSize: '1.2em' }}>{currentCard.front_text}</p>

                <hr />

                {showBack ? (
                    <div>
                        <h2>Back</h2>
                        <p style={{ fontSize: '1.2em' }}>{currentCard.back_text}</p>
                        <div style={{ marginTop: '20px' }}>
                            <p>How well did you remember?</p>
                            {/* Add rating buttons later */}
                            <button onClick={() => handleSubmitReview('Again')}>Again</button>
                            <button onClick={() => handleSubmitReview('Hard')}>Hard</button>
                            <button onClick={() => handleSubmitReview('Good')}>Good</button>
                            <button onClick={() => handleSubmitReview('Easy')}>Easy</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowBack(true)}>Show Answer</button>
                )}
            </div>
            <Link to={`/decks/${deckId}`}>Back to Deck View</Link> <br />
            <Link to="/dashboard">Back to Dashboard</Link>
        </div>
    );
}

export default StudyPage;