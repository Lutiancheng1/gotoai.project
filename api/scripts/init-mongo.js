// @ts-nocheck
// 切换到 admin 数据库
db = db.getSiblingDB('admin');

// 创建 root 用户（如果不存在）
if (db.getUser(process.env.MONGODB_USERNAME) == null) {
    db.createUser({
        user: process.env.MONGODB_USERNAME,
        pwd: process.env.MONGODB_PASSWORD,
        roles: ["root"]
    });
}

// 切换到应用数据库
db = db.getSiblingDB(process.env.MONGODB_DATABASE);

// 创建应用数据库用户（如果不存在）
if (db.getUser(process.env.MONGODB_USERNAME) == null) {
    db.createUser({
        user: process.env.MONGODB_USERNAME,
        pwd: process.env.MONGODB_PASSWORD,
        roles: [
            { role: "dbOwner", db: process.env.MONGODB_DATABASE }
        ]
    });
}

// 创建必要的集合
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