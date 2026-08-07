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

    // Update Activity
    let activityHTML = 'Just chilling and coding.';
    let activityTitle = 'ABOUT ME';
    
    if (data.activities && data.activities.length > 0) {
        const primaryActivity = data.activities[0];
        
        if (primaryActivity.type === 0) {
            activityTitle = 'PLAYING A GAME';
            activityHTML = primaryActivity.name;
            if (primaryActivity.details) activityHTML += `<br>${primaryActivity.details}`;
        } else if (primaryActivity.type === 2) {
            activityTitle = 'LISTENING TO SPOTIFY';
            activityHTML = `${primaryActivity.details} by ${primaryActivity.state}`;
        } else if (primaryActivity.type === 4) {
            activityTitle = 'CUSTOM STATUS';
            let statusText = primaryActivity.state || '';
            let emojiHTML = '';
            
            if (primaryActivity.emoji) {
                if (primaryActivity.emoji.id) {
                    const ext = primaryActivity.emoji.animated ? 'gif' : 'png';
                    emojiHTML = `<img src="https://cdn.discordapp.com/emojis/${primaryActivity.emoji.id}.${ext}" alt="${primaryActivity.emoji.name}" class="discord-custom-emoji"> `;
                } else if (primaryActivity.emoji.name) {
                    emojiHTML = primaryActivity.emoji.name + ' ';
                }
            }
            activityHTML = emojiHTML + statusText;
        } else {
            activityTitle = 'DOING SOMETHING';
            activityHTML = primaryActivity.name;
        }
    }
    
    activityLabel.textContent = activityTitle;
    activityEl.innerHTML = activityHTML;
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
