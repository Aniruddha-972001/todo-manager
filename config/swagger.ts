import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Todo Manager API",
    version: "1.0.0",
    description:
      "Interactive API documentation for the Todo Manager backend. Use /api/login first, then authorize protected routes with the returned JWT bearer token.",
    contact: {
      name: "Todo Manager",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [
    {
      name: "System",
      description: "Health and documentation helper endpoints.",
    },
    {
      name: "Auth",
      description: "User signup, login, token refresh, and identity endpoints.",
    },
    {
      name: "Lists",
      description: "List creation and management endpoints.",
    },
    {
      name: "Todos",
      description: "Todo creation endpoints scoped to a list.",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      refreshTokenCookie: {
        type: "apiKey",
        in: "cookie",
        name: "refreshToken",
      },
    },
    schemas: {
      SignupRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "aniruddha" },
          password: { type: "string", example: "secret123" },
        },
        example: {
          username: "aniruddha",
          password: "secret123",
        },
      },
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "aniruddha" },
          password: { type: "string", example: "secret123" },
        },
        example: {
          username: "aniruddha",
          password: "secret123",
        },
      },
      CreateListRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Daily Tasks" },
        },
        example: {
          name: "Daily Tasks",
        },
      },
      CreateTodoRequest: {
        type: "object",
        required: ["task"],
        properties: {
          task: { type: "string", example: "Finish Express refactor" },
        },
        example: {
          task: "Finish Express refactor",
        },
      },
      UpdateTodoRequest: {
        type: "object",
        properties: {
          task: { type: "string", example: "Finish Express refactor today" },
          completed: { type: "boolean", example: true },
        },
        example: {
          completed: true,
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          userId: { type: "string", example: "uuid-value" },
          role: { type: "string", example: "user" },
        },
      },
      UserSummary: {
        type: "object",
        properties: {
          id: { type: "string", example: "uuid-value" },
          username: { type: "string", example: "aniruddha" },
        },
      },
      List: {
        type: "object",
        properties: {
          id: { type: "string", example: "uuid-value" },
          name: { type: "string", example: "Daily Tasks" },
          creatorId: { type: "string", example: "uuid-value" },
        },
      },
      Todo: {
        type: "object",
        properties: {
          id: { type: "string", example: "uuid-value" },
          task: { type: "string", example: "Finish Express refactor" },
          completed: { type: "boolean", example: false },
          listId: { type: "string", example: "uuid-value" },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Operation completed" },
        },
      },
      TokenResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Login Successful" },
          token: { type: "string", example: "jwt-token-value" },
        },
      },
      SignupResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "User created successfully" },
          user: { $ref: "#/components/schemas/UserSummary" },
        },
      },
      ListsResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Lists fetched successfully" },
          lists: {
            type: "array",
            items: { $ref: "#/components/schemas/List" },
          },
        },
      },
      ListResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "List created successfully" },
          list: { $ref: "#/components/schemas/List" },
        },
      },
      ListWithTodosResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "List fetched successfully" },
          list: {
            allOf: [
              { $ref: "#/components/schemas/List" },
              {
                type: "object",
                properties: {
                  todos: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Todo" },
                  },
                },
              },
            ],
          },
        },
      },
      TodoResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Todo added successfully" },
          todo: { $ref: "#/components/schemas/Todo" },
        },
      },
      ListTodosResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Todos fetched successfully" },
          list: { $ref: "#/components/schemas/List" },
          todos: {
            type: "array",
            items: { $ref: "#/components/schemas/Todo" },
          },
        },
      },
      MeResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "User info fetched successfully" },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Invalid credentials" },
        },
      },
    },
  },
} as const;

const options: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: ["./app.ts", "./routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
