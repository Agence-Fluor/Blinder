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
use handlers::onboarding::{send_otp, verify_otp};
use handlers::common::OtpStore;
use handlers::register::register;
use handlers::devices::{
    register_first_device, register_device,
    upload_encrypted_data, download_encrypted_data, get_devices, delete_device
};
use handlers::messages::{send_message, get_messages};
use handlers::calls::{initiate_call, end_call};
use handlers::websocket::websocket_handler;
use handlers::matches::{get_matches, request_match};
use handlers::users::{check_user, get_identity_key};
use axum::extract::ws::WebSocketUpgrade;
use handlers::common::PushSubscription;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Database is required - fail if not available
    let database_url = std::env::var("DATABASE_URL")
        .map_err(|_| anyhow::anyhow!("DATABASE_URL environment variable is required"))?;
    
    println!("Connecting to database...");
    let pool = PgPool::connect(&database_url).await
        .map_err(|e| anyhow::anyhow!("Failed to connect to database: {}", e))?;
    println!("Connected to database.");

    // Create OTP store (in-memory)
    let otp_store: OtpStore = Arc::new(Mutex::new(HashMap::new()));

    // Create push subscriptions store (in-memory)
    let push_subscriptions: Arc<Mutex<HashMap<String, Vec<PushSubscription>>>> = Arc::new(Mutex::new(HashMap::new()));

    println!("Creating router...");
    let app = Router::new()
        .route("/", get(root))
        .route("/api/register", post(register))
        .route("/api/onboarding/send-otp", post(send_otp))
        .route("/api/onboarding/verify-otp", post(verify_otp))
        .route("/api/devices/register-first", post(register_first_device))
        .route("/api/devices/register", post(register_device))
        .route("/api/devices/upload-encrypted-data", post(upload_encrypted_data))
        .route("/api/devices/download-encrypted-data", post(download_encrypted_data))
        .route("/api/devices/list", post(get_devices))
        .route("/api/devices/delete", post(delete_device))
        .route("/api/messages/send", post(send_message))
        .route("/api/messages/get", post(get_messages))
        .route("/api/calls/initiate", post(initiate_call))
        .route("/api/calls/end", post(end_call))
        .route("/api/matches/get", post(get_matches))
        .route("/api/matches/request", post(request_match))
        .route("/api/users/check", post(check_user))
        .route("/api/users/identity-key", post(get_identity_key))
       // .route("/api/users/messaging-key", post(get_messaging_key))
        .route("/ws", get(websocket_handler))
        .route("/ws/call", get(websocket_handler))
        .layer(CorsLayer::permissive()) // Allow CORS for development
        .with_state((Some(pool), otp_store, push_subscriptions)); // give the pool, otp_store, and push_subscriptions to handlers

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
                    <li>POST /api/devices/register-first - Register first device (onboarding/SMS recovery)</li>
                    <li>POST /api/devices/register - Register additional device</li>
                    <li>POST /api/devices/upload-encrypted-data - Upload encrypted data from old device</li>
                    <li>POST /api/devices/download-encrypted-data - Download encrypted data for new device</li>
                    <li>POST /api/messages/send - Send encrypted message</li>
                    <li>POST /api/messages/get - Get messages for phone number</li>
                </ul>
            </body>
        </html>
        "#
    )
}