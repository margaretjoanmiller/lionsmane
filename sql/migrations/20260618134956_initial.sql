-- +goose Up
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    email VARCHAR(254) UNIQUE NOT NULL,
    hashpass TEXT NOT NULL,
    pfp TEXT,
    created_at TIMESTAMPTZ DEFAULT current_timestamp
);

-- +goose Down
DROP TABLE users;
