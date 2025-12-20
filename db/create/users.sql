CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    fhe_pk TEXT NOT NULL,
    msg_pk TEXT NOT NULL,
    last_activity TIMESTAMP
);
