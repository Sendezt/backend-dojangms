// src/config/swagger.js

const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",

  info: {
    title: "DojangMS API Documentation",
    version: "1.0.0",
    description: "API documentation for Dojang Management System Backend",
  },

  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server",
    },
    {
      url: "https://api.jokotingkir-tc.online",
      description: "Production server",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Terjadi kesalahan",
          },
        },
      },

      SuccessResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Operasi berhasil",
          },
        },
      },
    },
  },

  tags: [
    {
      name: "Auth",
      description: "Authentication and user management",
    },
  ],
};

const options = {
  swaggerDefinition,

  // Path file route yang berisi dokumentasi Swagger
  apis: ["./src/routes/**/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
