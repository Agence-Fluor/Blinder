// Message handlers for encrypted chat

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::handlers::common::AppState;

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub destination_phone: String,
    pub encrypted_content: Vec<u8>, // Base64 encoded
    pub message_id: String,
    pub message_type: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SendMessageResponse {
    pub success: bool,
    pub message_id: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct GetMessagesRequest {
    pub phone: String,
    pub since: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize)]
pub struct MessageData {
    pub id: i64,
    pub encrypted_content: Vec<u8>,
    pub message_id: String,
    pub timestamp: String, // Serialize as string for JSON
    pub message_type: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct GetMessagesResponse {
    pub success: bool,
    pub messages: Vec<MessageData>,
    pub message: String,
}

// Send encrypted message
pub async fn send_message(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<SendMessageRequest>,
) -> Result<Json<SendMessageResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            let message_id = if body.message_id.is_empty() {
                Uuid::new_v4().to_string()
            } else {
                body.message_id
            };

            let result = sqlx::query(
                r#"
                INSERT INTO messages (destination_phone, encrypted_content, message_id, message_type, timestamp)
                VALUES ($1, $2, $3, $4, now())
                RETURNING id
                "#
            )
            .bind(&body.destination_phone)
            .bind(&body.encrypted_content)
            .bind(&message_id)
            .bind(&body.message_type.unwrap_or_else(|| "text".to_string()))
            .fetch_one(&pool)
            .await;

            match result {
                Ok(_) => Ok(Json(SendMessageResponse {
                    success: true,
                    message_id,
                    message: "Message sent successfully".to_string(),
                })),
                Err(e) => {
                    eprintln!("Error sending message: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}

// Get messages for a phone number (destination)
pub async fn get_messages(
    State((pool, _otp_store, _push_subscriptions)): State<AppState>,
    Json(body): Json<GetMessagesRequest>,
) -> Result<Json<GetMessagesResponse>, StatusCode> {
    match pool {
        Some(pool) => {
            let rows = if let Some(since) = body.since {
                sqlx::query(
                    r#"
                    SELECT id, encrypted_content, message_id, timestamp, message_type
                    FROM messages
                    WHERE destination_phone = $1 AND timestamp > $2
                    ORDER BY timestamp ASC
                    "#
                )
                .bind(&body.phone)
                .bind(since)
                .fetch_all(&pool)
                .await
            } else {
                sqlx::query(
                    r#"
                    SELECT id, encrypted_content, message_id, timestamp, message_type
                    FROM messages
                    WHERE destination_phone = $1
                    ORDER BY timestamp ASC
                    LIMIT 100
                    "#
                )
                .bind(&body.phone)
                .fetch_all(&pool)
                .await
            };

            match rows {
                Ok(rows) => {
                    let messages: Vec<MessageData> = rows
                        .iter()
                        .map(|row| {
                            let id: i64 = row.try_get("id").unwrap_or(0);
                            let encrypted_content: Vec<u8> = row.try_get("encrypted_content").unwrap_or_default();
                            let message_id: String = row.try_get("message_id").unwrap_or_default();
                            let timestamp: chrono::DateTime<chrono::Utc> = row.try_get("timestamp").unwrap_or_else(|_| chrono::Utc::now());
                            let message_type: Option<String> = row.try_get("message_type").ok();
                            
                            MessageData {
                                id,
                                encrypted_content,
                                message_id,
                                timestamp: timestamp.to_rfc3339(),
                                message_type,
                            }
                        })
                        .collect();
                    
                    let message_count = messages.len();
                    Ok(Json(GetMessagesResponse {
                        success: true,
                        messages,
                        message: format!("Retrieved {} messages", message_count),
                    }))
                },
                Err(e) => {
                    eprintln!("Error getting messages: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        None => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}
