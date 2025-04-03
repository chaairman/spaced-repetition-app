// frontend/src/pages/LoginPage.js
import React from 'react';

function LoginPage() {
    const handleLogin = () => {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        if (!backendUrl) {
             // Basic error handling if URL isn't set, maybe show this in the UI
             console.error("Backend URL environment variable is not set!");
             alert("Configuration error. Cannot initiate login."); // Simple feedback
             return;
        }
        const backendGoogleAuthUrl = `${backendUrl}/api/auth/google`;
        window.location.href = backendGoogleAuthUrl;
    };

    // Get error message from URL query params if present
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');
    let errorMessage = null;
    if (errorParam === 'google_auth_failed') {
        errorMessage = 'Google Authentication Failed. Please try again.';
    } else if (errorParam === 'callback_processing_failed') {
         errorMessage = 'There was an issue processing the login callback. Please try again.';
    } else if (errorParam) {
        // Catch other potential errors passed in query
        errorMessage = `An error occurred: ${errorParam.replace(/_/g, ' ')}`;
    }


    return (
        // Flex container to center content vertically and horizontally
        <div className="min-h-screen flex items-center justify-center bg-brand-lightest p-4"> {/* Use lightest background */}
            {/* Card container */}
            <div className="bg-white p-8 rounded-lg shadow-md max-w-sm w-full text-center">
                <h1 className="text-2xl font-bold mb-4 text-brand-darkest">Login Required</h1>
                <p className="text-gray-600 mb-6"> {/* Standard gray text for description */}
                    Please log in using your Google account to access the Spaced Repetition App.
                </p>
                <button
                    onClick={handleLogin}
                    // Apply button styles using the palette
                    className="w-full bg-accent-primary hover:bg-accent-secondary text-brand-darkest font-semibold py-2 px-4 rounded transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary" // Orange button, darker text
                >
                    Login with Google
                </button>

                {/* Display error messages */}
                {errorMessage && (
                     <p className="mt-4 text-danger-dark text-sm">{errorMessage}</p> // Use danger color for errors
                )}
            </div>
        </div>
    );
}

export default LoginPage;