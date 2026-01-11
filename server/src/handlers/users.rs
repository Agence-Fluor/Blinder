// User handlers - check if phone is registered and get identity public key

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use sqlx::Row;

use crate::handlers::common::AppState;

#[derive(Debug, Deserialize)]
pub struct CheckUserRequest {
    pub phone: String,
}

#[derive(Debug, Serialize)]
pub struct CheckUserResponse {
    pub success: bool,
    pub registered: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct GetIdentityKeyRequest {
    pub phone: String,
}

#[derive(Debug, Serialize)]
pub struct GetIdentityKeyResponse {
    pub success: bool,
    pub publicKey: Option<Vec<u8>>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct GetMessagingKeyRequest {
    pub phone: String,
}

#[derive(Debug, Serialize)]
pub struct GetMessagingKeyResponse {
    pub success: bool,
    pub publicKey: Option<Vec<u8>>,
    pub message: String,
}

// Check if a phone number is registered
pub async fn check_user(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<CheckUserRequest>,
) -> Result<Json<CheckUserResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            let user_result = sqlx::query(
                "SELECT id FROM users WHERE phone = $1"
            )
            .bind(&body.phone)
            .fetch_optional(&pool)
            .await;

            match user_result {
                Ok(Some(_)) => Ok(Json(CheckUserResponse {
                    success: true,
                    registered: true,
                    message: "User is registered".to_string(),
                })),
                Ok(None) => Ok(Json(CheckUserResponse {
                    success: true,
                    registered: false,
                    message: "User is not registered".to_string(),
                })),
                Err(e) => {
                    eprintln!("Error checking user: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}

// Get identity public key for a user
pub async fn get_identity_key(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<GetIdentityKeyRequest>,
) -> Result<Json<GetIdentityKeyResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            // Identity keys are now managed client-side only
            // Return null since we're not storing identity keys in DB anymore
            let key_result: Result<Option<sqlx::postgres::PgRow>, sqlx::Error> = Ok(None);

            match key_result {
                Ok(Some(row)) => {
                    let key_bytes: Option<Vec<u8>> = row.try_get("public_key").ok();
                    Ok(Json(GetIdentityKeyResponse {
                        success: true,
                        publicKey: key_bytes,
                        message: "Identity key retrieved".to_string(),
                    }))
                }
                Ok(None) => Ok(Json(GetIdentityKeyResponse {
                    success: true,
                    publicKey: None,
                    message: "User not found or no identity key".to_string(),
                })),
                Err(e) => {
                    eprintln!("Error getting identity key: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}
