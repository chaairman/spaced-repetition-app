// frontend/src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
// import axios from 'axios'; // We'll need this later for status/disconnect

function SettingsPage() {
    const [searchParams] = useSearchParams();
    const [discordStatus, setDiscordStatus] = useState('Not Connected'); // Placeholder
    const [discordUsername, setDiscordUsername] = useState(''); // Placeholder
    const [message, setMessage] = useState(''); // For success/error messages
    const [isLoadingStatus, setIsLoadingStatus] = useState(false); // Placeholder for status loading
    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        // Check for messages from redirect query parameters
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'discord_linked') {
            setMessage('Discord account linked successfully!');
            // TODO: Fetch actual connection status from backend here to confirm
            // and potentially get the username to display
            setDiscordStatus('Connected'); // Optimistic update for now
        } else if (error === 'discord_link_failed') {
            setMessage('Failed to link Discord account. Please try again.');
        }

        // TODO: Add a fetch call here to GET /api/integrations/discord/status
        // to accurately set discordStatus and discordUsername on initial load.
        // For now, we'll just assume 'Not Connected' unless the redirect param says otherwise.

    }, [searchParams]); // Re-run if query params change


    const handleConnectDiscord = () => {
        if (!backendUrl) {
            setMessage("Error: Backend URL not configured.");
            return;
        }
        // Redirect the user to the backend route that starts the OAuth flow
        window.location.href = `${backendUrl}/api/integrations/discord/link`;
    };

    // TODO: Add handleDisconnectDiscord function later

    return (
        <div>
            <Link to="/dashboard">Back to Dashboard</Link>
            <h1>Settings</h1>

            {/* Display messages from redirects */}
            {message && <p style={{ color: message.includes('Failed') ? 'red' : 'green' }}>{message}</p>}

            <hr />
            <h2>Integrations</h2>
            <h3>Discord Account</h3>
            {isLoadingStatus ? (
                <p>Loading Discord status...</p>
            ) : (
                <div>
                    <p>Status: {discordStatus}</p>
                    {discordStatus === 'Connected' && discordUsername && (
                        <p>Connected as: {discordUsername}</p>
                    )}

                    {/* Show Connect button only if not connected */}
                    {discordStatus === 'Not Connected' && (
                        <button onClick={handleConnectDiscord}>
                            Connect Discord Account
                        </button>
                    )}

                    {/* TODO: Add Disconnect button if connected */}
                    {/* {discordStatus === 'Connected' && (
                        <button onClick={handleDisconnectDiscord} style={{color: 'red'}}>
                            Disconnect Discord Account
                        </button>
                    )} */}
                </div>
            )}

            {/* Add other settings sections here later */}

        </div>
    );
}

export default SettingsPage;