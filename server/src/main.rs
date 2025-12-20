use axum::{
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;
use tokio::net::TcpListener;
use axum::extract::State;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("Connecting to database...");

    let database_url = std::env::var("DATABASE_URL")?;

    let pool = PgPool::connect(&database_url).await?;
    println!("Connected to database.");

    println!("Creating router...");
    let app = Router::new()
        .route("/", get(root))
        .route("/api/register", post(register))
        .with_state(pool); // give the pool to handlers

    println!("Router created.");

    let listener = TcpListener::bind("127.0.0.1:3000").await?;
    println!("Server listening on http://127.0.0.1:3000");

    axum::serve(listener, app).await?;
    Ok(())
}

// -----------------------------
// Models
// -----------------------------
#[derive(Debug, Deserialize)]
struct RegisterRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize)]
struct RegisterResponse {
    success: bool,
    message: String,
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

                </ul>
            </body>
        </html>
        "#
    )
}