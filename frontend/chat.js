// Chat Module
const chat = (() => {
    const API_URL = 'http://localhost:3000/api';
    let socket = null;
    let messageCache = [];
    let typingUsers = new Set();

    const initialize = () => {
        // Initialize Socket.IO connection
        connectSocket();
        loadUserData();
        loadMessages();
        loadTasks();
        setupEventListeners();
    };

    const connectSocket = () => {
        socket = io('http://localhost:3000', {
            auth: {
                token: auth.getToken()
            }
        });

        socket.on('connect', () => {
            addSystemMessage('Connected to network');
        });

        socket.on('new-message', (data) => {
            addMessage(data);
        });

        socket.on('user-typing', (data) => {
            showTypingIndicator(data);
        });

        socket.on('user-profile-update', (user) => {
            if (user.id === auth.getCurrentUser().id) {
                updateUserProfile(user);
            }
        });

        socket.on('disconnect', () => {
            addSystemMessage('Disconnected from network');
        });

        socket.on('error', (error) => {
            addSystemMessage(`Network error: ${error}`);
        });
    };

    const loadUserData = () => {
        const user = auth.getCurrentUser();
        document.getElementById('displayUsername').textContent = user.username;
        document.getElementById('displayRank').textContent = `RANK: ${user.rank || 'NOVICE'}`;
        document.getElementById('displayPoints').textContent = `PTS: ${user.points || 0}`;
        
        // Set avatar
        const avatarUrl = user.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`;
        document.getElementById('userAvatar').src = avatarUrl;
    };

    const loadMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/messages`, {
                headers: {
                    'Authorization': `Bearer ${auth.getToken()}`
                }
            });

            if (response.ok) {
                const messages = await response.json();
                messageCache = messages;
                
                const container = document.getElementById('messageContainer');
                container.innerHTML = '<div class="system-message"><p>> ANON_MESSAGING_SYSTEM initialized</p><p>> Connecting to network...</p><p>> Connection established</p></div>';
                
                messages.forEach(msg => addMessage(msg));
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const loadTasks = async () => {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: {
                    'Authorization': `Bearer ${auth.getToken()}`
                }
            });

            if (response.ok) {
                const tasks = await response.json();
                displayTasks(tasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    const displayTasks = (tasks) => {
        const tasksList = document.getElementById('tasksList');
        
        if (tasks.length === 0) {
            tasksList.innerHTML = '<p class="loading">No tasks available</p>';
            return;
        }

        tasksList.innerHTML = tasks.map(task => `
            <div class="task-item ${task.status === 'completed' ? 'completed' : ''}">
                <div class="title">${task.title}</div>
                <div class="description">${task.description}</div>
                <div class="reward">Reward: ${task.pointsReward} points</div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.task-item').forEach((el, idx) => {
            el.addEventListener('click', () => completeTask(tasks[idx].id));
        });
    };

    const completeTask = async (taskId) => {
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (response.ok) {
                const result = await response.json();
                addSystemMessage(`Task completed! +${result.pointsReward} points`);
                loadTasks();
                loadUserData();
            }
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    const setupEventListeners = () => {
        const form = document.getElementById('messageForm');
        const input = document.getElementById('messageInput');

        form.addEventListener('submit', handleSendMessage);
        
        input.addEventListener('input', () => {
            if (socket) {
                socket.emit('user-typing', {
                    username: auth.getCurrentUser().username
                });
            }
        });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message) return;

        // Handle commands
        if (message.startsWith('/')) {
            handleCommand(message);
            input.value = '';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({ content: message })
            });

            if (response.ok) {
                input.value = '';
                const data = await response.json();
                
                if (socket) {
                    socket.emit('message', data);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleCommand = (command) => {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();

        if (cmd === '/help') {
            addSystemMessage(`
Available commands:
/dm [username] [message] - Send anonymous DM
/profile - View your profile
/report [username] - Report a user
/help - Show this help message
            `);
        } else if (cmd === '/dm' && parts.length > 2) {
            const username = parts[1];
            const msg = parts.slice(2).join(' ');
            sendDM(username, msg);
        } else if (cmd === '/profile') {
            showProfileModal();
        } else if (cmd === '/report' && parts.length > 1) {
            const username = parts.slice(1).join(' ');
            reportUser(username);
        } else {
            addSystemMessage('Unknown command. Type /help for available commands.');
        }
    };

    const sendDM = async (username, message) => {
        try {
            const response = await fetch(`${API_URL}/messages/dm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({ recipientUsername: username, content: message })
            });

            if (response.ok) {
                addSystemMessage(`DM sent to ${username}`);
            } else {
                addSystemMessage(`Failed to send DM to ${username}`);
            }
        } catch (error) {
            console.error('Error sending DM:', error);
        }
    };

    const reportUser = async (username) => {
        const reason = prompt(`Report ${username} for what reason?`);
        if (!reason) return;

        try {
            const response = await fetch(`${API_URL}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({ reportedUsername: username, reason })
            });

            if (response.ok) {
                addSystemMessage('User reported successfully. Thanks for keeping the network clean!');
            }
        } catch (error) {
            console.error('Error reporting user:', error);
        }
    };

    const addMessage = (messageData) => {
        const container = document.getElementById('messageContainer');
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        
        const timestamp = new Date(messageData.createdAt).toLocaleTimeString();
        
        messageEl.innerHTML = `
            <div class="message-user">${messageData.sender.username} [${messageData.sender.rank}]</div>
            <div class="message-content">${escapeHtml(messageData.content)}</div>
            <div class="message-timestamp">${timestamp}</div>
        `;

        container.appendChild(messageEl);
        container.scrollTop = container.scrollHeight;
    };

    const addSystemMessage = (content) => {
        const container = document.getElementById('messageContainer');
        const messageEl = document.createElement('div');
        messageEl.className = 'message system';
        
        messageEl.innerHTML = `
            <p>> ${escapeHtml(content)}</p>
        `;

        container.appendChild(messageEl);
        container.scrollTop = container.scrollHeight;
    };

    const showTypingIndicator = (data) => {
        const indicator = document.getElementById('typingIndicator');
        typingUsers.add(data.username);
        
        indicator.classList.remove('hidden');
        indicator.textContent = Array.from(typingUsers).join(', ') + ' is typing...';

        // Remove indicator after timeout
        setTimeout(() => {
            typingUsers.delete(data.username);
            if (typingUsers.size === 0) {
                indicator.classList.add('hidden');
            } else {
                indicator.textContent = Array.from(typingUsers).join(', ') + ' is typing...';
            }
        }, 2000);
    };

    const updateUserProfile = (user) => {
        loadUserData();
    };

    const showProfileModal = () => {
        const user = auth.getCurrentUser();
        alert(`
Profile: ${user.username}
Rank: ${user.rank}
Points: ${user.points}
Joined: ${new Date(user.createdAt).toLocaleDateString()}
        `);
    };

    const destroy = () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        messageCache = [];
        typingUsers.clear();
    };

    const escapeHtml = (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    };

    return {
        initialize,
        destroy
    };
})();
