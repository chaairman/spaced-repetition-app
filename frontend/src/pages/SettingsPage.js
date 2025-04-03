// frontend/src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
// import axios from 'axios'; // Keep commented out for now

// Reuse the Button component (or import if moved)
const Button = ({ onClick, children, className = '', variant = 'default', type = 'button', disabled = false }) => {
    let baseStyle = "px-4 py-2 rounded font-semibold shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm";
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


function SettingsPage() {
    const [searchParams] = useSearchParams();
    // --- Improved State Management ---
    // Instead of separate status/username, use an object or clearer indicators
    const [discordLinkStatus, setDiscordLinkStatus] = useState({
        status: 'loading', // 'loading', 'linked', 'not_linked', 'error'
        username: null,
        message: '' // For status messages (like loading, error fetching status)
    });
    const [redirectMessage, setRedirectMessage] = useState(''); // Specifically for messages from redirect

    const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL;

    // --- Effect for Redirect Messages & Initial Status Check ---
    useEffect(() => {
        // Handle messages from redirect query parameters FIRST
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        let msg = '';
        let initialStatusAssumption = 'loading'; // Assume loading initially

        if (success === 'discord_linked') {
            msg = 'Discord account linked successfully!';
            initialStatusAssumption = 'linked'; // Assume linked from redirect
        } else if (error === 'discord_link_failed') {
            msg = 'Failed to link Discord account. Please try again.';
            initialStatusAssumption = 'not_linked'; // Assume not linked if link failed
        } else if (error) {
             msg = `An error occurred: ${error.replace(/_/g, ' ')}`;
             initialStatusAssumption = 'error'; // Assume error state
        }
        setRedirectMessage(msg);

        // --- Fetch Actual Discord Link Status from Backend ---
        // TODO: Implement this backend endpoint later (GET /api/integrations/discord/status)
        const fetchStatus = async () => {
            setDiscordLinkStatus({ status: 'loading', username: null, message: 'Checking connection...' });
            // try {
            //     if (!backendUrl) throw new Error("Backend URL missing");
            //     const response = await axios.get(`${backendUrl}/api/integrations/discord/status`);
            //     if (response.data && response.data.linked) {
            //         setDiscordLinkStatus({
            //             status: 'linked',
            //             username: response.data.username || 'Unknown Username',
            //             message: ''
            //         });
            //     } else {
            //         setDiscordLinkStatus({ status: 'not_linked', username: null, message: '' });
            //     }
            // } catch (err) {
            //     console.error("Error fetching Discord link status:", err);
            //     setDiscordLinkStatus({
            //         status: 'error',
            //         username: null,
            //         message: 'Could not fetch Discord connection status.'
            //     });
            // }
            // --- MOCK IMPLEMENTATION FOR NOW ---
            // Simulate a delay then set status based on initial assumption or default
            setTimeout(() => {
                if (initialStatusAssumption === 'linked') {
                     setDiscordLinkStatus({ status: 'linked', username: 'YourDiscordUser#1234', message: '' }); // Placeholder username
                } else if (initialStatusAssumption === 'error') {
                    setDiscordLinkStatus({ status: 'error', username: null, message: 'Could not verify Discord connection.' });
                }
                 else {
                     setDiscordLinkStatus({ status: 'not_linked', username: null, message: '' });
                }
            }, 500); // Simulate 0.5 second delay
             // --- END MOCK ---
        };

        fetchStatus();
        // Only re-run if searchParams change (to process redirects)
    }, [searchParams, backendUrl]);


    const handleConnectDiscord = () => {
        setRedirectMessage(''); // Clear previous messages
        if (!backendUrl) {
             setDiscordLinkStatus(prev => ({ ...prev, status: 'error', message: 'Error: Backend URL not configured.' }));
            return;
        }
        window.location.href = `${backendUrl}/api/integrations/discord/link`;
    };

    // TODO: Add handleDisconnectDiscord function later (will need API call)
    // const handleDisconnectDiscord = async () => { ... };

    return (
        <div className="container mx-auto p-4 md:p-6">
             {/* Header */}
             <div className="mb-6 pb-4 border-b border-gray-300">
                 <Link to="/dashboard" className="text-sm text-brand-primary hover:text-brand-dark mb-2 block">&larr; Back to Dashboard</Link>
                 <h1 className="text-3xl font-bold text-brand-darkest">Settings</h1>
             </div>

             {/* Display redirect messages prominently */}
             {redirectMessage && (
                 <div className={`mb-4 p-3 rounded text-sm ${redirectMessage.includes('Failed') || redirectMessage.includes('error') ? 'bg-red-100 text-danger-dark' : 'bg-green-100 text-green-700'}`}>
                     {redirectMessage}
                 </div>
             )}

             {/* Integrations Section */}
             <div className="bg-white p-6 rounded-lg shadow">
                 <h2 className="text-xl font-semibold mb-4 text-brand-dark">Integrations</h2>

                 {/* Discord Sub-section */}
                 <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium mb-2 text-brand-darkest">Discord Account</h3>

                    {discordLinkStatus.status === 'loading' && (
                        <p className="text-gray-500">{discordLinkStatus.message || 'Loading status...'}</p>
                    )}

                    {discordLinkStatus.status === 'error' && (
                        <p className="text-danger-dark">{discordLinkStatus.message || 'Failed to load status.'}</p>
                    )}

                     {discordLinkStatus.status === 'linked' && (
                         <div>
                             <p className="text-sm text-gray-600">
                                 Status: <span className="font-semibold text-brand-primary">Connected</span>
                             </p>
                             {discordLinkStatus.username && (
                                 <p className="text-sm text-gray-600">
                                     Connected as: <span className="font-semibold">{discordLinkStatus.username}</span>
                                 </p>
                             )}
                             {/* TODO: Add Disconnect Button Here */}
                             {/* <Button variant="danger" onClick={handleDisconnectDiscord} className="mt-3">
                                 Disconnect Discord Account
                             </Button> */}
                             <p className="text-xs text-gray-500 mt-3">(Disconnect functionality not yet implemented)</p>
                         </div>
                     )}

                    {discordLinkStatus.status === 'not_linked' && (
                        <div>
                            <p className="text-sm text-gray-600 mb-3">
                                Status: <span className="font-semibold">Not Connected</span>
                            </p>
                            <Button variant="primary" className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white" onClick={handleConnectDiscord}>
                                 Connect Discord Account
                            </Button>
                         </div>
                     )}
                 </div>
                 {/* End Discord Sub-section */}

            </div>
            {/* End Integrations Section */}

        </div>
    );
}

export default SettingsPage;