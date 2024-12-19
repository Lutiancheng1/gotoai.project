// @ts-nocheck
// 切换到 admin 数据库
db = db.getSiblingDB('admin');

// 创建 root 用户（如果不存在）
try {
    db.createUser({
        user: 'admin',
        pwd: 'your_mongodb_password',
        roles: ["root"]
    });
} catch (err) {
    // 如果用户已存在，忽略错误
    if (!err.message.includes('already exists')) {
        print('Error creating root user:', err.message);
    }
}

// 切换到应用数据库
db = db.getSiblingDB('ai-chat');

// 创建应用数据库用户（如果不存在）
try {
    db.createUser({
        user: 'admin',
        pwd: 'your_mongodb_password',
        roles: [
            { role: "dbOwner", db: 'ai-chat' }
        ]
    });
} catch (err) {
    // 如果用户已存在，忽略错误
    if (!err.message.includes('already exists')) {
        print('Error creating database user:', err.message);
    }
}

// 创建必要的集合
try {
    db.createCollection("users");
    db.createCollection("departments");
    db.createCollection("applications");
    db.createCollection("operation_logs");
    db.createCollection("login_histories");

    // 创建索引
    db.users.createIndex({ "email": 1 }, { unique: true });
    db.users.createIndex({ "username": 1 });
    db.users.createIndex({ "role": 1 });

    db.departments.createIndex({ "name": 1, "parentId": 1 }, { unique: true });
    db.departments.createIndex({ "path": 1 });
    db.departments.createIndex({ "level": 1 });

    db.applications.createIndex({ "name": 1 }, { unique: true });
    db.applications.createIndex({ "type": 1 });
    db.applications.createIndex({ "isActive": 1 });

    db.operation_logs.createIndex({ "userId": 1 });
    db.operation_logs.createIndex({ "module": 1 });
    db.operation_logs.createIndex({ "createdAt": 1 });

    db.login_histories.createIndex({ "userId": 1 });
    db.login_histories.createIndex({ "loginType": 1 });
    db.login_histories.createIndex({ "createdAt": 1 });

    print('Successfully created collections and indexes');
} catch (err) {
    print('Error creating collections or indexes:', err.message);
} 