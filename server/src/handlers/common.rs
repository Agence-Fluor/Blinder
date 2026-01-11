// Common types for handlers

use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};

// OTP store type
pub type OtpStore = Arc<Mutex<HashMap<String, (String, u64)>>>;

// Push subscription data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushSubscription {
    pub endpoint: String,
    pub keys: PushKeys,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushKeys {
    pub p256dh: String,
    pub auth: String,
}

// Push subscriptions store type
pub type PushSubscriptionsStore = Arc<Mutex<HashMap<String, Vec<PushSubscription>>>>;

// App state: (pool, otp_store, push_subscriptions)
pub type AppState = (Option<PgPool>, OtpStore, PushSubscriptionsStore);

