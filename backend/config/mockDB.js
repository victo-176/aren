// Mock in-memory database for testing without MongoDB

class MockUser {
  constructor(data) {
    this._id = Math.random().toString(36).substr(2, 9);
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.rank = data.rank || 'Newbie';
    this.points = data.points || 0;
    this.status = data.status || 'active';
    this.isAdmin = data.isAdmin || false;
    this.createdAt = new Date();
    this.lastLogin = null;
    this.onlineStatus = false;
  }

  comparePassword(plain) {
    return Promise.resolve(plain === this.passwordHash);
  }

  getPublicProfile() {
    return {
      _id: this._id,
      username: this.username,
      rank: this.rank,
      points: this.points,
      email: this.email,
      isAdmin: this.isAdmin,
      createdAt: this.createdAt,
    };
  }

  save() {
    return Promise.resolve(this);
  }
}

const store = {
  users: [],
  messages: [],
  tasks: [],
  reports: [],
  logs: [],
};

module.exports = {
  users: store.users,
  messages: store.messages,
  tasks: store.tasks,
  reports: store.reports,
  logs: store.logs,
  MockUser,
  
  User: {
    findOne: async (query) => {
      if (query.username) {
        return store.users.find(u => u.username === query.username);
      }
      if (query.$or) {
        return store.users.find(u => 
          query.$or.some(q => u[Object.keys(q)[0]] === q[Object.keys(q)[0]])
        );
      }
      return store.users.find(u => 
        Object.keys(query).every(k => u[k] === query[k])
      );
    },
    
    findById: async (id) => {
      return store.users.find(u => u._id === id);
    },
    
    find: async (query = {}) => {
      return store.users.filter(u =>
        Object.keys(query).every(k => u[k] === query[k])
      );
    },
    
    countDocuments: async (query = {}) => {
      return store.users.filter(u =>
        Object.keys(query).every(k => u[k] === query[k])
      ).length;
    },
    
    findByIdAndUpdate: async (id, updates) => {
      const user = store.users.find(u => u._id === id);
      if (user) {
        Object.assign(user, updates);
        return user;
      }
      return null;
    },
  },
};
