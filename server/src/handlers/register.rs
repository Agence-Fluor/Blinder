use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};

use crate::handlers::onboarding::AppState;

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterResponse {
    pub success: bool,
    pub message: String,
}

pub async fn register(
    State((pool, _otp_store)): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Json<RegisterResponse> {
    match pool {
        Some(pool) => {
            let result = sqlx::query(
                r#"INSERT INTO users (fhe_pk, msg_pk, last_activity)
                   VALUES ($1, $2, now())
                   RETURNING id"#
            )
            .bind(&body.username)
            .bind(&format!("dummy-hash-{}", body.password))
            .execute(&pool)
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
        None => Json(RegisterResponse {
            success: false,
            message: "Database not available. Registration is disabled.".to_string(),
        }),
    }
}
