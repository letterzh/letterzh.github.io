// --- Discord Tracker Setup (Lanyard API) ---
// REPLACE THIS WITH YOUR DISCORD USER ID
const DISCORD_USER_ID = '1142164320772444281'; // Example ID (Phineas)

async function fetchDiscordStatus() {
    try {
        const [lanyardRes, profileRes] = await Promise.all([
            fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`),
            fetch(`https://dcdn.dstn.to/profile/${DISCORD_USER_ID}`)
        ]);
        
        const data = await lanyardRes.json();
        let profileData = null;
        
        try {
            profileData = await profileRes.json();
        } catch(e) {
            console.log("Could not fetch dcdn profile");
        }

        if (data.success) {
            const discordData = data.data;
            if (profileData && profileData.user) {
                discordData.discord_user.banner = profileData.user.banner;
                discordData.discord_user.bio = profileData.user.bio;
            }
            if (profileData && profileData.badges) {
                discordData.badges = profileData.badges;
            }
            updateDiscordCard(discordData);
        }
    } catch (error) {
        console.error('Error fetching Discord status:', error);
        document.getElementById('discord-activity').textContent = 'Unable to fetch status.';
    }
}

function updateDiscordCard(data) {
    const globalNameEl = document.getElementById('discord-global-name');
    const usernameEl = document.getElementById('discord-username');
    const activityEl = document.getElementById('discord-activity');
    const activityLabel = document.getElementById('activity-label');
    const avatarEl = document.getElementById('discord-avatar');
    const statusIndicator = document.getElementById('discord-status-indicator');
    const bioEl = document.getElementById('discord-bio');
    const badgesEl = document.getElementById('discord-badges');

    // Update Names
    globalNameEl.textContent = data.discord_user.global_name || data.discord_user.username;
    usernameEl.textContent = '@' + data.discord_user.username;

    // Update Avatar
    const avatarHash = data.discord_user.avatar;
    if (avatarHash) {
        const isAvatarAnimated = avatarHash.startsWith('a_');
        const avatarExt = isAvatarAnimated ? 'gif' : 'png';
        avatarEl.src = `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${avatarHash}.${avatarExt}?size=256`;
    }

    // Update Banner
    const bannerEl = document.getElementById('discord-banner');
    const bannerHash = data.discord_user.banner;
    if (bannerHash) {
        const isBannerAnimated = bannerHash.startsWith('a_');
        const bannerExt = isBannerAnimated ? 'gif' : 'png';
        bannerEl.style.backgroundImage = `url(https://cdn.discordapp.com/banners/${DISCORD_USER_ID}/${bannerHash}.${bannerExt}?size=512)`;
        bannerEl.style.animation = 'none';
        bannerEl.style.backgroundSize = 'cover';
        bannerEl.style.backgroundPosition = 'center';
    }

    // Helper to format custom emojis in text (like bio)
    function formatCustomEmojis(text) {
        if (!text) return '';
        // regex to match <a:name:id> or <:name:id>
        return text.replace(/<(a?):([a-zA-Z0-9_]+):([0-9]+)>/g, (match, animated, name, id) => {
            const ext = animated === 'a' ? 'gif' : 'png';
            return `<img src="https://cdn.discordapp.com/emojis/${id}.${ext}" alt="${name}" class="discord-custom-emoji">`;
        });
    }

    // Update Bio
    if (data.discord_user.bio) {
        bioEl.innerHTML = formatCustomEmojis(data.discord_user.bio);
        bioEl.style.display = 'block';
    } else {
        bioEl.style.display = 'none';
    }

    // Update Badges
    badgesEl.innerHTML = '';
    if (data.badges && data.badges.length > 0) {
        data.badges.forEach(badge => {
            const img = document.createElement('img');
            img.src = `https://cdn.discordapp.com/badge-icons/${badge.icon}.png`;
            img.className = 'discord-badge';
            img.title = badge.description || badge.id;
            img.alt = badge.id;
            badgesEl.appendChild(img);
        });
    }

    // Update Status Color
    statusIndicator.className = 'status-indicator ' + data.discord_status;

    // Update Activities
    const activitiesContainer = document.getElementById('discord-activities-container');
    activitiesContainer.innerHTML = '';
    
    if (data.activities && data.activities.length > 0) {
        data.activities.forEach(activity => {
            const box = document.createElement('div');
            box.className = 'discord-activity-box';
            let html = '';
            
            if (activity.type === 4) {
                // Custom Status
                let emojiHTML = '';
                if (activity.emoji) {
                    if (activity.emoji.id) {
                        const ext = activity.emoji.animated ? 'gif' : 'png';
                        emojiHTML = `<img src="https://cdn.discordapp.com/emojis/${activity.emoji.id}.${ext}" alt="${activity.emoji.name}" class="discord-custom-emoji"> `;
                    } else if (activity.emoji.name) {
                        emojiHTML = activity.emoji.name + ' ';
                    }
                }
                html = `<div style="font-weight:600; font-size:0.95rem;">${emojiHTML}${activity.state || ''}</div>`;
            } else if (activity.type === 2 || activity.id === "spotify:1") {
                // Spotify
                const spotify = data.spotify;
                if (spotify) {
                    html = `
                    <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px;">LISTENING TO SPOTIFY</h4>
                    <div class="activity-rich">
                        <img src="${spotify.album_art_url}" class="activity-image" alt="Album Art">
                        <div class="activity-details">
                            <span class="activity-name">${spotify.song}</span>
                            <span>by ${spotify.artist}</span>
                        </div>
                    </div>`;
                }
            } else if (activity.type === 0) {
                // Playing Game
                let imageUrl = '';
                if (activity.assets && activity.assets.large_image) {
                    let assetId = activity.assets.large_image;
                    if (assetId.startsWith('mp:external/')) {
                        imageUrl = 'https://media.discordapp.net/external/' + assetId.replace('mp:external/', '');
                    } else {
                        imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${assetId}.png`;
                    }
                }
                
                let imgHtml = imageUrl ? `<img src="${imageUrl}" class="activity-image" alt="Game Art">` : '';
                html = `
                <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px;">PLAYING A GAME</h4>
                <div class="activity-rich">
                    ${imgHtml}
                    <div class="activity-details">
                        <span class="activity-name">${activity.name}</span>
                        ${activity.details ? `<span>${activity.details}</span>` : ''}
                        ${activity.state ? `<span>${activity.state}</span>` : ''}
                    </div>
                </div>`;
            }
            
            if (html) {
                box.innerHTML = html;
                activitiesContainer.appendChild(box);
            }
        });
    }
}

// Fetch initially and then set interval
fetchDiscordStatus();
setInterval(fetchDiscordStatus, 60000); // Update every minute

// --- Cool JavaScript 3D Tilt Effect ---
document.addEventListener('mousemove', (e) => {
    const tiltElements = document.querySelectorAll('[data-tilt]');
    
    tiltElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate tilt amounts (adjust divisor to change sensitivity)
        const tiltX = (y - centerY) / 20; 
        const tiltY = (centerX - x) / 20;

        // Check if mouse is hovering over the element
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
            el.style.transition = 'transform 0.1s ease';
        } else {
            // Reset if not hovering
            el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            el.style.transition = 'transform 0.5s ease';
        }
    });
});

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
