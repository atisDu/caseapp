import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-74848af3/health", (c) => {
  return c.json({ status: "ok" });
});

// User signup endpoint
app.post("/make-server-74848af3/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log(`Creating user: ${email}`);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        isAdmin: email === 'admin@case.com'
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    console.log(`User created successfully: ${data.user?.id}`);
    return c.json({ user: data.user });
  } catch (error: any) {
    console.log(`Signup exception: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Initialize admin user on startup
async function initializeAdmin() {
  try {
    console.log("Checking for admin user...");
    
    // Check if admin user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminExists = existingUsers.users?.some(user => user.email === 'admin@case.com');
    
    if (!adminExists) {
      console.log("Creating admin user...");
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'admin@case.com',
        password: "X'#22$<d1O0!",
        user_metadata: { 
          name: 'Administrator',
          isAdmin: true
        },
        // Automatically confirm the user's email since an email server hasn't been configured.
        email_confirm: true
      });

      if (error) {
        console.log(`Error creating admin user: ${error.message}`);
      } else {
        console.log("Admin user created successfully");
      }
    } else {
      console.log("Admin user already exists");
    }
  } catch (error: any) {
    console.log(`Error initializing admin: ${error.message}`);
  }
}

// Initialize admin user on startup
initializeAdmin();

Deno.serve(app.fetch);