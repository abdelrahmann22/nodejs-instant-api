import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Instant API",
      description: "QR-based shared bill-splitting payment app",
      version: "1.0.0",
    },
    servers: [
      {
        url: "https://nodejs-instant-api-production.up.railway.app",
        description: "Production",
      },
      {
        url: "http://localhost:3000",
        description: "Local development",
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
        Merchant: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            stripe_account_id: { type: "string", nullable: true },
            charges_enabled: { type: "boolean" },
            details_submitted: { type: "boolean" },
          },
        },
        MerchantSignup: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Acme Corp" },
            email: {
              type: "string",
              format: "email",
              example: "merchant@test.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "pass123",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "password" },
          },
        },
        MerchantAuthResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            merchant: { $ref: "#/components/schemas/Merchant" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
          },
        },
        UserSignup: {
          type: "object",
          required: ["email", "password"],
          properties: {
            username: { type: "string", example: "john" },
            email: {
              type: "string",
              format: "email",
              example: "user@test.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "pass123",
            },
          },
        },
        UserAuthResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        BillItem: {
          type: "object",
          required: ["title", "quantity", "price"],
          properties: {
            title: { type: "string", example: "Burger" },
            quantity: { type: "integer", example: 2 },
            price: { type: "number", example: 12.5 },
          },
        },
        BillCreate: {
          type: "object",
          required: ["amount", "items", "title"],
          properties: {
            title: { type: "string", example: "Saturday Dinner" },
            amount: { type: "number", example: 30.0 },
            fees: { type: "number", example: 2.5 },
            currency: { type: "string", example: "gbp" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/BillItem" },
            },
          },
        },
        Bill: {
          type: "object",
          properties: {
            id: { type: "integer" },
            merchant_id: { type: "integer" },
            title: { type: "string" },
            currency: { type: "string" },
            amount: { type: "string" },
            fees: { type: "string" },
            status: { type: "string" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/BillItem" },
            },
            token: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            expires_at: { type: "string", format: "date-time" },
            qr_url: { type: "string" },
          },
        },
        BillResponse: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            currency: { type: "string" },
            amount: { type: "string" },
            fees: { type: "string" },
            status: { type: "string" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/BillItem" },
            },
            created_at: { type: "string", format: "date-time" },
            expires_at: { type: "string", format: "date-time" },
            paid_amount: { type: "number" },
            remaining: { type: "number" },
          },
        },
        PaymentInitiate: {
          type: "object",
          required: ["bill_id", "token", "amount"],
          properties: {
            bill_id: { type: "integer", example: 1 },
            token: { type: "string", example: "VcOMwVDw" },
            amount: { type: "number", example: 15.0 },
          },
        },
        PaymentInitiateResponse: {
          type: "object",
          properties: {
            checkout_url: {
              type: "string",
              example: "https://checkout.stripe.com/c/pay/cs_test_...",
            },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "integer" },
            bill_id: { type: "integer" },
            user_id: { type: "integer" },
            amount: { type: "string" },
            payment_intent_id: { type: "string" },
            status: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            paid_at: { type: "string", format: "date-time", nullable: true },
          },
        },
        Error: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/api/auth/merchant/signup": {
        post: {
          tags: ["Auth - Merchant"],
          summary: "Register a new merchant",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MerchantSignup" },
              },
            },
          },
          responses: {
            201: {
              description: "Merchant created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MerchantAuthResponse" },
                },
              },
            },
            409: {
              description: "Email already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/merchant/login": {
        post: {
          tags: ["Auth - Merchant"],
          summary: "Login as merchant",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MerchantAuthResponse" },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/merchant/onboarding-link": {
        post: {
          tags: ["Auth - Merchant"],
          summary: "Get Stripe Connect onboarding link (Merchant)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Onboarding URL",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      url: { type: "string", example: "https://connect.stripe.com/setup/e/acct_..." },
                    },
                  },
                },
              },
            },
            401: {
              description: "Not authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Not a merchant",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/merchant/onboarding-status": {
        get: {
          tags: ["Auth - Merchant"],
          summary: "Check Stripe Connect onboarding status — syncs real-time from Stripe (Merchant)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Onboarding status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      stripe_account_id: { type: "string", nullable: true },
                      charges_enabled: { type: "boolean" },
                      details_submitted: { type: "boolean" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Not authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Not a merchant",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/user/signup": {
        post: {
          tags: ["Auth - User"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserSignup" },
              },
            },
          },
          responses: {
            201: {
              description: "User created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserAuthResponse" },
                },
              },
            },
            409: {
              description: "Email already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/auth/user/login": {
        post: {
          tags: ["Auth - User"],
          summary: "Login as user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserAuthResponse" },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/bills": {
        post: {
          tags: ["Bills"],
          summary: "Create a new bill (Merchant)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BillCreate" },
              },
            },
          },
          responses: {
            201: {
              description: "Bill created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      bill: { $ref: "#/components/schemas/Bill" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/bills/{id}": {
        get: {
          tags: ["Bills"],
          summary: "Get bill by ID and token (User scans QR)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Bill ID",
            },
            {
              name: "token",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Bill access token from QR",
            },
          ],
          responses: {
            200: {
              description: "Bill details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/BillResponse" },
                },
              },
            },
            400: {
              description: "Bill expired or missing token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Bill not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/bills/merchant": {
        get: {
          tags: ["Bills"],
          summary: "Get all bills for a merchant (Merchant)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of bills",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Bill" },
                  },
                },
              },
            },
            404: {
              description: "No bills found for this merchant",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/payments/user": {
        get: {
          tags: ["Payments"],
          summary: "Get user's payment activity list (User)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of user's payments with bill info",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        bill_id: { type: "integer" },
                        bill_title: { type: "string" },
                        bill_token: { type: "string" },
                        amount: { type: "string" },
                        currency: { type: "string" },
                        status: { type: "string" },
                        paid_at: { type: "string", format: "date-time", nullable: true },
                        merchant_name: { type: "string" },
                        contributors_count: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Not authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            403: {
              description: "Not a user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/payments/initiate": {
        post: {
          tags: ["Payments"],
          summary: "Initiate a split payment on a bill (User)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentInitiate" },
              },
            },
          },
          responses: {
            200: {
              description: "Stripe Checkout URL",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaymentInitiateResponse",
                  },
                },
              },
            },
            400: {
              description: "Validation error (expired, overpayment, etc.)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            404: {
              description: "Bill not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/api/payments/{bill_id}": {
        get: {
          tags: ["Payments"],
          summary: "Get all payments for a bill (Merchant)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "bill_id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "Bill ID",
            },
          ],
          responses: {
            200: {
              description: "List of payments",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Payment" },
                  },
                },
              },
            },
            404: {
              description: "No payments found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const specs = swaggerJsdoc(options);

export const serveSwagger = swaggerUi.serve;
export const setupSwagger = swaggerUi.setup(specs, {
  customCssUrl: "https://unpkg.com/swagger-ui-dist@5.32.4/swagger-ui.css",
  customJs: [
    "https://unpkg.com/swagger-ui-dist@5.32.4/swagger-ui-bundle.js",
    "https://unpkg.com/swagger-ui-dist@5.32.4/swagger-ui-standalone-preset.js",
  ],
});
