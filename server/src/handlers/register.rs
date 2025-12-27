use axum::{
    routing::{
        get, 
        post
    },
    Json, Router,
};
use serde::{
    Deserialize, 
    Serialize
};
use sqlx::PgPool;
use std::sync::Arc;
use tokio::net::TcpListener;
use axum::extract::State;


async fn register(
    State(pool): State<PgPool>,  
    Json(body): Json<RegisterRequest>,
) -> Json<RegisterResponse> {
    let result = sqlx::query!(
        r#"INSERT INTO users (fhe_pk, msg_pk, last_activity)
           VALUES ($1, $2, now())
           RETURNING id"#,
        body.username,
        format!("dummy-hash-{}", body.password)
    )
    .fetch_one(&pool)
    .await;

    match result {
        Ok(_) => Json(RegisterResponse {
            success: true,
            message: "User registered successfully".to_string(),
        }),
        Err(e) => Json(RegisterResponse {
            success: false,
            message: format!("Registration failed: {}", e),
        }),
    }
}
