// frontend/src/pages/LoginPage.js
import React from 'react';

function LoginPage() {
    const handleLogin = () => {
        // Access the environment variable 
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const backendGoogleAuthUrl = `${backendUrl}/api/auth/google`;
        window.location.href = backendGoogleAuthUrl;
    };

    return (
        <div>
            <h1>Login</h1>
            <p>Please log in using your Google account to continue.</p>
            <button onClick={handleLogin}>Login with Google</button>
            {/* Optional: Display error messages from URL query params */}
            {window.location.search.includes('error=google_auth_failed') && (
                <p style={{ color: 'red' }}>Google Authentication Failed. Please try again.</p>
            )}
        </div>
    );
}

export default LoginPage;