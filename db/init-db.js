//initates the database

use("waypoint");

db.createUser({
  user: process.env.APP_DB_USER,
  pwd: process.env.APP_DB_PASS,
  roles: [
    {
      role: "dbOwner",
      db: "waypoint",
    },
  ],
});

db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "name",
        "username",
        "password",
        "role",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string" },
        username: { bsonType: "string" },
        password: { bsonType: "string" },
        role: { enum: ["admin", "developer"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});

db.createCollection("projects", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "name",
        "description",
        "startDate",
        "team",
        "status",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string" },
        description: { bsonType: "string" },
        startDate: { bsonType: "date" },
        endDate: { bsonType: "date" },
        team: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        status: { enum: ["active", "completed", "archived"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});

db.createCollection("tasks", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "proj_id",
        "name",
        "description",
        "createdAt",
        "updatedAt",
        "status",
        "priority",
        "tags",
        "weight",
      ],
      properties: {
        _id: { bsonType: "objectId" },
        proj_id: { bsonType: "objectId" },
        name: { bsonType: "string" },
        description: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        history: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["type", "createdAt", "userRef"],
            properties: {
              _id: { bsonType: "objectId" },
              type: { enum: ["work_log", "update", "comment", "creation"] },
              createdAt: { bsonType: "date" },
              userRef: { bsonType: "objectId" },
              comment: { bsonType: "string" },
              workTime: { bsonType: "int" },
              changes: {
                bsonType: "object",
                properties: {
                  name: {
                    bsonType: "object",
                    properties: {
                      oldValue: { bsonType: "string" },
                      newValue: { bsonType: "string" },
                    },
                  },
                  description: {
                    bsonType: "object",
                    properties: {
                      oldValue: { bsonType: "string" },
                      newValue: { bsonType: "string" },
                    },
                  },
                  assignees: {
                    bsonType: "object",
                    properties: {
                      oldValue: {
                        bsonType: "array",
                        items: { bsonType: "objectId" },
                      },
                      newValue: {
                        bsonType: "array",
                        items: { bsonType: "objectId" },
                      },
                    },
                  },
                  weight: {
                    bsonType: "object",
                    properties: {
                      oldValue: { bsonType: "int" },
                      newValue: { bsonType: "int" },
                    },
                  },
                  priority: {
                    bsonType: "object",
                    properties: {
                      oldValue: { enum: ["low", "medium", "high", "critical"] },
                      newValue: { enum: ["low", "medium", "high", "critical"] },
                    },
                  },
                  tags: {
                    bsonType: "object",
                    properties: {
                      oldValue: {
                        bsonType: "array",
                        items: { bsonType: "string" },
                      },
                      newValue: {
                        bsonType: "array",
                        items: { bsonType: "string" },
                      },
                    },
                  },
                  status: {
                    bsonType: "object",
                    properties: {
                      oldValue: {
                        enum: ["completed", "in_progress", "not_started"],
                      },
                      newValue: {
                        enum: ["completed", "in_progress", "not_started"],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        status: { enum: ["completed", "in_progress", "not_started"] },
        priority: { enum: ["low", "medium", "high", "critical"] },
        tags: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
        weight: { bsonType: "int" },
        assignees: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        sprint: { bsonType: "objectId" },
      },
    },
  },
});

db.createCollection("sprints", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "proj_id",
        "name",
        "team",
        "tasks",
        "startDate",
        "endDate",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        _id: { bsonType: "objectId" },
        proj_id: { bsonType: "objectId" },
        name: { bsonType: "string" },
        team: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        PO: { bsonType: "objectId" },
        scrumMaster: { bsonType: "objectId" },
        tasks: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        startDate: { bsonType: "date" },
        endDate: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
    },
  },
});

db.createCollection("sessions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "refreshToken"],
      properties: {
        _id: { bsonType: "objectId" },
        username: { bsonType: "string" },
        refreshToken: { bsonType: "string" },
      },
    },
  },
});
