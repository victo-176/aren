// Admin Panel Module
const admin = (() => {
    const API_URL = 'http://localhost:3000/api';
    let allUsers = [];
    let allMessages = [];
    let allTasks = [];
    let allReports = [];
    let allLogs = [];

    const initialize = () => {
        setupEventListeners();
        loadAllData();
    };

    const setupEventListeners = () => {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                switchTab(tabName);
            });
        });

        // Exit admin panel
        document.getElementById('exitAdminBtn').addEventListener('click', () => {
            switchScreen('chatScreen');
        });

        // Users tab
        document.getElementById('userSearchInput').addEventListener('input', filterUsers);

        // Messages tab
        document.getElementById('messageSearchInput').addEventListener('input', filterMessages);

        // Tasks tab - Create task
        document.getElementById('createTaskBtn').addEventListener('click', createNewTask);

        // Admin panel button
        if (document.getElementById('adminPanelBtn')) {
            document.getElementById('adminPanelBtn').addEventListener('click', () => {
                switchScreen('adminPanel');
                admin.initialize();
            });
        }
    };

    const loadAllData = async () => {
        try {
            const headers = {
                'Authorization': `Bearer ${auth.getToken()}`
            };

            // Load all data in parallel
            const [usersRes, messagesRes, tasksRes, reportsRes, logsRes] = await Promise.all([
                fetch(`${API_URL}/admin/users`, { headers }),
                fetch(`${API_URL}/admin/messages`, { headers }),
                fetch(`${API_URL}/admin/tasks`, { headers }),
                fetch(`${API_URL}/admin/reports`, { headers }),
                fetch(`${API_URL}/admin/logs`, { headers })
            ]);

            if (usersRes.ok) allUsers = await usersRes.json();
            if (messagesRes.ok) allMessages = await messagesRes.json();
            if (tasksRes.ok) allTasks = await tasksRes.json();
            if (reportsRes.ok) allReports = await reportsRes.json();
            if (logsRes.ok) allLogs = await logsRes.json();

            // Display active tab
            displayUsers();
            populateUserSelect();

        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    };

    const switchTab = (tabName) => {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');

        // Load tab-specific data
        switch(tabName) {
            case 'users':
                displayUsers();
                break;
            case 'messages':
                displayMessages();
                break;
            case 'tasks':
                displayTasks();
                break;
            case 'reports':
                displayReports();
                break;
            case 'logs':
                displayLogs();
                break;
        }
    };

    // USERS TAB
    const displayUsers = () => {
        const container = document.getElementById('usersList');

        if (allUsers.length === 0) {
            container.innerHTML = '<p>No users found</p>';
            return;
        }

        container.innerHTML = allUsers.map(user => `
            <div class="table-row">
                <div class="table-cell">
                    <label>Username</label>
                    <value>${user.username}</value>
                </div>
                <div class="table-cell">
                    <label>Rank</label>
                    <value>${user.rank}</value>
                </div>
                <div class="table-cell">
                    <label>Points</label>
                    <value>${user.points}</value>
                </div>
                <div class="table-cell">
                    <label>Status</label>
                    <value>${user.suspended ? 'SUSPENDED' : 'ACTIVE'}</value>
                </div>
                <div class="table-cell">
                    <label>Actions</label>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="admin.editUser('${user.id}')">EDIT</button>
                        <button class="action-btn" onclick="admin.changeRank('${user.id}', '${user.username}')">RANK</button>
                        <button class="action-btn" onclick="admin.addPoints('${user.id}', '${user.username}')">+PTS</button>
                        ${user.suspended ? 
                            `<button class="action-btn" onclick="admin.unsuspendUser('${user.id}')">UNSUSPEND</button>` :
                            `<button class="action-btn danger" onclick="admin.suspendUser('${user.id}')">SUSPEND</button>`
                        }
                        <button class="action-btn danger" onclick="admin.blockUser('${user.id}')">BLOCK</button>
                    </div>
                </div>
            </div>
        `).join('');
    };

    const filterUsers = () => {
        const search = document.getElementById('userSearchInput').value.toLowerCase();
        const filtered = allUsers.filter(u => u.username.toLowerCase().includes(search));
        
        const container = document.getElementById('usersList');
        const tempUsers = allUsers;
        allUsers = filtered;
        displayUsers();
        allUsers = tempUsers;
    };

    const changeRank = async (userId, username) => {
        const ranks = ['NOVICE', 'MEMBER', 'VETERAN', 'ELITE', 'LEGEND', 'ADMIN'];
        const currentRank = allUsers.find(u => u.id === userId)?.rank;
        const rank = prompt(`New rank for ${username} (${ranks.join(', ')}):`, currentRank);

        if (!rank || !ranks.includes(rank)) return;

        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({ rank })
            });

            if (response.ok) {
                loadAllData();
            }
        } catch (error) {
            console.error('Error changing rank:', error);
        }
    };

    const addPoints = async (userId, username) => {
        const points = prompt(`Award points to ${username}:`);
        if (!points || isNaN(points)) return;

        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({ points: parseInt(points) })
            });

            if (response.ok) {
                loadAllData();
            }
        } catch (error) {
            console.error('Error adding points:', error);
        }
    };

    const suspendUser = async (userId) => {
        if (!confirm('Suspend this user?')) return;

        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.getToken()}`
                }
            });

            if (response.ok) {
                loadAllData();
            }
        } catch (error) {
            console.error('Error suspending user:', error);
        }
    };

    const unsuspendUser = async (userId) => {
        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}/unsuspend`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.getToken()}`
                }
            });

            if (response.ok) {
                loadAllData();
            }
        } catch (error) {
            console.error('Error unsuspending user:', error);
        }
    };

    const blockUser = async (userId) => {
        if (!confirm('Permanently block this user? This cannot be undone!')) return;

        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}/block`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.getToken()}`
                }
            });

            if (response.ok) {
                loadAllData();
            }
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };

    // MESSAGES TAB
    const displayMessages = () => {
        const container = document.getElementById('messagesList');

        if (allMessages.length === 0) {
            container.innerHTML = '<p>No messages found</p>';
            return;
        }

        container.innerHTML = allMessages.slice(-50).reverse().map(msg => `
            <div class="table-row">
                <div class="table-cell">
                    <label>User</label>
                    <value>${msg.user.username}</value>
                </div>
                <div class="table-cell">
                    <label>Message</label>
                    <value style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${msg.content}</value>
                </div>
                <div class="table-cell">
                    <label>Time</label>
                    <value>${new Date(msg.createdAt).toLocaleString()}</value>
                </div>
                <div class="table-cell">
                    <label>Actions</label>
                    <div class="action-buttons">
                        <button class="action-btn danger" onclick="admin.deleteMessage('${msg.id}')">DELETE</button>
                    </div>
                </div>
            </div>
        `).join('');
    };

    const filterMessages = () => {
        const search = document.getElementById('messageSearchInput').value.toLowerCase();
        const filtered = allMessages.filter(m => 
            m.content.toLowerCase().includes(search) || 
            m.user.username.toLowerCase().includes(search)
        );
        
        const container = document.getElementById('messagesList');
        const temp = allMessages;
        allMessages = filtered;
        displayMessages();
        allMessages = temp;
    };

    const deleteMessage = async (messageId) => {
        if (!confirm('Delete this message?')) return;

        try {
            const response = await fetch(`${API_URL}/admin/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${auth.getToken()}`
                }
            });

            if (response.ok) {
                loadAllData();
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    // TASKS TAB
    const displayTasks = () => {
        const container = document.getElementById('tasksList');

        if (allTasks.length === 0) {
            container.innerHTML = '<p>No tasks found</p>';
            return;
        }

        container.innerHTML = allTasks.map(task => `
            <div class="table-row">
                <div class="table-cell">
                    <label>Title</label>
                    <value>${task.title}</value>
                </div>
                <div class="table-cell">
                    <label>Points</label>
                    <value>${task.points}</value>
                </div>
                <div class="table-cell">
                    <label>Assigned To</label>
                    <value>${task.assignedTo?.username || 'Unassigned'}</value>
                </div>
                <div class="table-cell">
                    <label>Status</label>
                    <value>${task.completed ? 'COMPLETED' : 'PENDING'}</value>
                </div>
                <div class="table-cell">
                    <label>Actions</label>
                    <div class="action-buttons">
                        <button class="action-btn danger" onclick="admin.deleteTask('${task.id}')">DELETE</button>
                    </div>
                </div>
            </div>
        `).join('');
    };

    const createNewTask = async () => {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const points = parseInt(document.getElementById('taskPoints').value);
        const assignedToId = document.getElementById('taskAssignUser').value;

        if (!title || !description || !points) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    points,
                    assignedToId: assignedToId || null
                })
            });

            if (response.ok) {
                document.getElementById('taskTitle').value = '';
                document.getElementById('taskDescription').value = '';
                document.getElementById('taskPoints').value = '';
                document.getElementById('taskAssignUser').value = '';
                loadAllData();
            }
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const deleteTask = async (taskId) => {
        if (!confirm('Delete this task?')) return;

        try {
            const response = await fetch(`${API_URL}/admin/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${auth.getToken()}`
                }
            });

            if (response.ok) {
                loadAllData();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    // REPORTS TAB
    const displayReports = () => {
        const container = document.getElementById('reportsList');

        if (allReports.length === 0) {
            container.innerHTML = '<p>No reports found</p>';
            return;
        }

        container.innerHTML = allReports.map(report => `
            <div class="table-row">
                <div class="table-cell">
                    <label>Reported User</label>
                    <value>${report.reportedUser.username}</value>
                </div>
                <div class="table-cell">
                    <label>Reason</label>
                    <value>${report.reason}</value>
                </div>
                <div class="table-cell">
                    <label>Reported By</label>
                    <value>${report.reportedBy.username}</value>
                </div>
                <div class="table-cell">
                    <label>Status</label>
                    <value>${report.resolved ? 'RESOLVED' : 'PENDING'}</value>
                </div>
                <div class="table-cell">
                    <label>Actions</label>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="admin.resolveReport('${report.id}')">RESOLVE</button>
                    </div>
                </div>
            </div>
        `).join('');
    };

    const resolveReport = async (reportId) => {
        try {
            const response = await fetch(`${API_URL}/admin/reports/${reportId}/resolve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.getToken()}`
                }
            });

            if (response.ok) {
                loadAllData();
            }
        } catch (error) {
            console.error('Error resolving report:', error);
        }
    };

    // LOGS TAB
    const displayLogs = () => {
        const container = document.getElementById('logsList');

        if (allLogs.length === 0) {
            container.innerHTML = '<p>No logs found</p>';
            return;
        }

        container.innerHTML = allLogs.map(log => `
            <div class="table-row">
                <div class="table-cell">
                    <label>Action</label>
                    <value>${log.action}</value>
                </div>
                <div class="table-cell">
                    <label>Admin</label>
                    <value>${log.admin.username}</value>
                </div>
                <div class="table-cell">
                    <label>Target</label>
                    <value>${log.targetUser?.username || 'System'}</value>
                </div>
                <div class="table-cell">
                    <label>Time</label>
                    <value>${new Date(log.createdAt).toLocaleString()}</value>
                </div>
            </div>
        `).join('');
    };

    const populateUserSelect = () => {
        const select = document.getElementById('taskAssignUser');
        select.innerHTML = '<option value="">Select user to assign...</option>' +
            allUsers.map(user => `<option value="${user.id}">${user.username}</option>`).join('');
    };

    const editUser = (userId) => {
        alert('Edit user functionality would open a detailed modal here');
    };

    return {
        initialize,
        editUser,
        changeRank,
        addPoints,
        suspendUser,
        unsuspendUser,
        blockUser,
        deleteMessage,
        deleteTask,
        resolveReport
    };
})();
