use axum::{
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

mod handlers;
use handlers::onboarding::{send_otp, verify_otp, OtpStore};
use handlers::register::register;
use handlers::webauthn::{
    register_start, register_complete, authenticate_start, authenticate_complete
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Try to connect to database, but make it optional
    let pool = match std::env::var("DATABASE_URL") {
        Ok(database_url) => {
            println!("Connecting to database...");
            match PgPool::connect(&database_url).await {
                Ok(p) => {
                    println!("Connected to database.");
                    Some(p)
                }
                Err(e) => {
                    println!("Warning: Could not connect to database: {}. Running without database.", e);
                    None
                }
            }
        }
        Err(_) => {
            println!("No DATABASE_URL set. Running without database.");
            None
        }
    };

    // Create OTP store (in-memory)
    let otp_store: OtpStore = Arc::new(Mutex::new(HashMap::new()));

    println!("Creating router...");
    let app = Router::new()
        .route("/", get(root))
        .route("/api/register", post(register))
        .route("/api/onboarding/send-otp", post(send_otp))
        .route("/api/onboarding/verify-otp", post(verify_otp))
        .route("/api/webauthn/register/start", post(register_start))
        .route("/api/webauthn/register/complete", post(register_complete))
        .route("/api/webauthn/authenticate/start", post(authenticate_start))
        .route("/api/webauthn/authenticate/complete", post(authenticate_complete))
        .layer(CorsLayer::permissive()) // Allow CORS for development
        .with_state((pool, otp_store)); // give the pool and otp_store to handlers

    println!("Router created.");

    let listener = TcpListener::bind("127.0.0.1:3000").await?;
    println!("Server listening on http://127.0.0.1:3000");

    axum::serve(listener, app).await?;
    Ok(())
}

// -----------------------------
// HTTP Handlers
// -----------------------------

async fn root() -> axum::response::Html<&'static str> {
    axum::response::Html(
        r#"
        <html>
            <head>
                <title>Blinder Server API</title>
            </head>
            <body>
                <h1>Blinder Server API</h1>
                <h2>Available endpoints:</h2>
                <ul>
                    <li>POST /api/register - Register a new user</li>
                    <li>POST /api/onboarding/send-otp - Send OTP to phone number</li>
                    <li>POST /api/onboarding/verify-otp - Verify OTP code</li>
                    <li>POST /api/webauthn/register/start - Start WebAuthn registration</li>
                    <li>POST /api/webauthn/register/complete - Complete WebAuthn registration</li>
                    <li>POST /api/webauthn/authenticate/start - Start WebAuthn authentication</li>
                    <li>POST /api/webauthn/authenticate/complete - Complete WebAuthn authentication</li>
                </ul>
            </body>
        </html>
        "#
    )
}