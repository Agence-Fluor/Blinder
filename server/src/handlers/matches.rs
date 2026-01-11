// Match handlers - everyone matches with everyone for now
// Private data (age, department, avatar) is NOT stored in database
// Only phone numbers are stored - private data is stored client-side in IndexedDB

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use sqlx::Row;

use crate::handlers::common::AppState;

// Base64 encoding helper
fn base64_encode(data: &[u8]) -> String {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::STANDARD.encode(data)
}

#[derive(Debug, Deserialize)]
pub struct MatchRequest {
    pub phone: String,
    pub age: i32,
    pub gender: String,
    pub department: String,
    pub interests: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct MatchData {
    pub phone: String,
    pub encrypted_age: String, // Base64 encoded encrypted age
    pub encrypted_department: String, // Base64 encoded encrypted department
    pub avatar_url: String, // Cartoon avatar URL
    pub match_id: String,
}

#[derive(Debug, Serialize)]
pub struct MatchResponse {
    pub success: bool,
    pub matches: Vec<MatchData>,
    pub message: String,
}

// Get matches for a user
// Returns only phone numbers - private data (age, department, avatar) is stored client-side
pub async fn get_matches(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<MatchRequest>,
) -> Result<Json<MatchResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            // Get all users except the requesting user
            // Only return phone numbers - private data is stored client-side in IndexedDB
            let rows = sqlx::query(
                r#"
                SELECT phone
                FROM users
                WHERE phone != $1 AND phone IS NOT NULL
                "#
            )
            .bind(&body.phone)
            .fetch_all(&pool)
            .await;

            match rows {
                Ok(rows) => {
                    let matches: Vec<MatchData> = rows
                        .iter()
                        .map(|row| {
                            let phone: String = row.try_get("phone").unwrap_or_default();
                            
                            // Private data (age, department, avatar) is NOT stored in DB
                            // It should be stored client-side in IndexedDB and shared encrypted
                            // For now, return empty/placeholder values - frontend will handle decryption
                            let phone_str = phone.clone();
                            MatchData {
                                phone: phone_str.clone(),
                                encrypted_age: String::new(), // Will be retrieved from client-side encrypted storage
                                encrypted_department: String::new(), // Will be retrieved from client-side encrypted storage
                                avatar_url: String::new(), // Will be generated client-side from encrypted profile
                                match_id: format!("match_{}", phone_str),
                            }
                        })
                        .collect();

                    let match_count = matches.len();
                    Ok(Json(MatchResponse {
                        success: true,
                        matches,
                        message: format!("Found {} matches", match_count),
                    }))
                }
                Err(e) => {
                    eprintln!("Error getting matches: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}

// Request a match (register user for matching)
// Private data (age, department) is NOT stored in DB - only phone number
pub async fn request_match(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<MatchRequest>,
) -> Result<Json<MatchResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            // Get or create user - only store phone number, not private data
            let user_result = sqlx::query(
                "SELECT id FROM users WHERE phone = $1"
            )
            .bind(&body.phone)
            .fetch_optional(&pool)
            .await;

            match user_result {
                Ok(Some(_)) => {
                    // User already exists - no need to update private data in DB
                    // Private data (age, department, avatar) is stored client-side in IndexedDB
                }
                Ok(None) => {
                    // Create user with phone number only
                    let result = sqlx::query(
                        "INSERT INTO users (phone, created_at) VALUES ($1, now()) RETURNING id"
                    )
                    .bind(&body.phone)
                    .fetch_one(&pool)
                    .await;

                    match result {
                        Ok(_) => {
                            // User created successfully
                            // Private data (age, department, avatar) should be stored client-side
                        }
                        Err(e) => {
                            eprintln!("Error creating user: {}", e);
                            return Err(StatusCode::INTERNAL_SERVER_ERROR);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Error checking user: {}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            }

            Ok(Json(MatchResponse {
                success: true,
                matches: vec![],
                message: "Match request registered".to_string(),
            }))
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}

