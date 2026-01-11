// WebSocket handler for call signaling and notifications

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State, Query,
    },
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;

use crate::handlers::common::AppState;

#[derive(Debug, Deserialize)]
pub struct WebSocketQuery {
    pub phone: Option<String>,
    pub call_id: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
}

// Store active WebSocket connections
type Connections = Arc<Mutex<HashMap<String, mpsc::UnboundedSender<Message>>>>;

static WS_CONNECTIONS: Mutex<Option<Connections>> = Mutex::new(None);

fn get_connections() -> Connections {
    static ONCE: std::sync::Once = std::sync::Once::new();
    static mut STORE: Option<Connections> = None;
    
    unsafe {
        ONCE.call_once(|| {
            STORE = Some(Arc::new(Mutex::new(HashMap::new())));
        });
        STORE.as_ref().unwrap().clone()
    }
}

// WebSocket handler
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State((_pool, _otp_store, _push_subscriptions)): State<AppState>,
    Query(params): Query<WebSocketQuery>,
) -> Response {
    let phone = params.phone.clone().unwrap_or_default();
    let call_id = params.call_id.clone();
    
    ws.on_upgrade(move |socket| handle_socket(socket, phone, call_id))
}

async fn handle_socket(socket: WebSocket, phone: String, call_id: Option<String>) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel();

    // Store connection
    let connections = get_connections();
    let connection_id = if let Some(cid) = call_id {
        format!("call_{}", cid)
    } else {
        format!("phone_{}", phone)
    };
    
    connections.lock().unwrap().insert(connection_id.clone(), tx);

    // Spawn task to send messages to client
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    // Spawn task to receive messages from client
    let connections_clone = connections.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                // Handle incoming WebSocket messages
                // For call signaling, forward to other party
                if let Ok(data) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let Some(target_call_id) = data.get("callId").and_then(|v| v.as_str()) {
                        // Forward to other party in the call
                        let target_conn_id = format!("call_{}", target_call_id);
                        let conns = connections_clone.lock().unwrap();
                        if let Some(target_tx) = conns.get(&target_conn_id) {
                            let _ = target_tx.send(Message::Text(text));
                        }
                    }
                }
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };

    // Remove connection
    connections.lock().unwrap().remove(&connection_id);
}

// Send message to a phone number
pub fn send_to_phone(phone: &str, message: Message) {
    let connections = get_connections();
    let conn_id = format!("phone_{}", phone);
    let conns = connections.lock().unwrap();
    if let Some(tx) = conns.get(&conn_id) {
        let _ = tx.send(message);
    }
}

// Send message to a call
pub fn send_to_call(call_id: &str, message: Message) {
    let connections = get_connections();
    let conn_id = format!("call_{}", call_id);
    let conns = connections.lock().unwrap();
    if let Some(tx) = conns.get(&conn_id) {
        let _ = tx.send(message);
    }
}
